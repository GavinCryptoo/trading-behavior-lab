import {
  mockWalletAnalysis,
  type BitgetMeta,
  type DataCoverageStatus,
  type PricePathPoint,
  type TradeReplay,
  type WalletAnalysis,
} from "@/src/data/mockWalletAnalysis"
import { calculateEntryScore } from "@/src/lib/analysis/calculateEntryScore"
import { calculateExitScore } from "@/src/lib/analysis/calculateExitScore"
import { analyzeDrawdownBehavior } from "@/src/lib/analysis/drawdownBehavior"
import { buildDataCoverageWarnings, evaluateDataCoverage } from "@/src/lib/analysis/dataCoverage"
import { analyzeHolderRisk } from "@/src/lib/analysis/holderRisk"
import { buildBitgetMarketContext } from "@/src/lib/analysis/bitgetMarketContext"
import { buildPersonalizedRules } from "@/src/lib/analysis/personalizedRules"
import { calculateProfitCaptureRate } from "@/src/lib/analysis/profitCapture"
import { generateReportCard } from "@/src/lib/analysis/reportCard"
import { analyzeSecurityRisk } from "@/src/lib/analysis/securityRisk"
import { compareWithSmartMoney } from "@/src/lib/analysis/smartMoneyContrast"
import { analyzeTradingLeaks } from "@/src/lib/analysis/tradingLeaks"
import { analyzeTradingPersonality } from "@/src/lib/analysis/tradingPersonality"
import { buildWhatIfSimulation } from "@/src/lib/analysis/whatIfSimulation"
import { BitgetClient } from "./bitgetClient"
import type { AnalyzeWalletParams, NormalizedKlinePoint, NormalizedTokenTransaction } from "./types"

const MAX_REPLAY_TRADES = 8

function periodToDays(period: string) {
  const lower = period.toLowerCase()
  if (lower.includes("24h")) return 1
  const days = Number.parseInt(lower, 10)
  return Number.isFinite(days) ? days : 7
}

function toTimestamp(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return undefined
  return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric
}

function numberFrom(record: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key]
    const numeric = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return undefined
}

function stringFrom(record: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === "string" && value.trim()) return value
  }
  return undefined
}

function recordsFrom(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> | unknown[] => Array.isArray(item) || (typeof item === "object" && item !== null)).map((item) => {
    if (Array.isArray(item)) {
      return {
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
      }
    }
    return item as Record<string, unknown>
  })
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>
    for (const key of ["data", "items", "list", "rows", "transactions", "trades", "klines", "candles", "holders"]) {
      const nested = recordsFrom(record[key])
      if (nested.length) return nested
    }
    return [record]
  }
  return []
}

function normalizeKline(response?: unknown): NormalizedKlinePoint[] {
  return recordsFrom(response)
    .map<NormalizedKlinePoint | null>((row) => {
      const timestamp = toTimestamp(row.timestamp ?? row.time ?? row.t ?? row.ts ?? row.openTime)
      const close = numberFrom(row, ["close", "c", "price", "lastPrice"])
      if (!timestamp || close === undefined) return null
      return {
        timestamp,
        open: numberFrom(row, ["open", "o"]),
        high: numberFrom(row, ["high", "h"]),
        low: numberFrom(row, ["low", "l"]),
        close,
        volume: numberFrom(row, ["volume", "v", "volumeUsd"]),
      }
    })
    .filter((point): point is NormalizedKlinePoint => point !== null)
    .sort((a, b) => a.timestamp - b.timestamp)
}

function normalizeTransactions(response?: unknown): NormalizedTokenTransaction[] {
  return recordsFrom(response)
    .map<NormalizedTokenTransaction | null>((row) => {
      const rawSide = String(row.side ?? row.action ?? row.tradeType ?? row.type ?? row.direction ?? "").toLowerCase()
      const side: NormalizedTokenTransaction["side"] = rawSide.includes("buy") || rawSide.includes("in") ? "buy" : rawSide.includes("sell") || rawSide.includes("out") ? "sell" : "unknown"
      const timestamp = toTimestamp(row.timestamp ?? row.time ?? row.blockTime ?? row.txTime)
      if (!timestamp) return null
      return {
        txHash: stringFrom(row, ["txHash", "hash", "signature"]),
        walletAddress: stringFrom(row, ["walletAddress", "address", "owner", "trader", "maker", "from", "to"]),
        tokenAddress: stringFrom(row, ["tokenAddress", "tokenContractAddress", "contractAddress", "mint"]),
        symbol: stringFrom(row, ["symbol", "tokenSymbol", "baseSymbol"]),
        side,
        timestamp,
        priceUsd: numberFrom(row, ["priceUsd", "price", "tokenPriceUsd", "avgPrice"]),
        amount: numberFrom(row, ["amount", "tokenAmount", "quantity", "qty"]),
        amountUsd: numberFrom(row, ["amountUsd", "valueUsd", "usdValue", "volumeUsd"]),
      }
    })
    .filter((tx): tx is NormalizedTokenTransaction => tx !== null)
    .sort((a, b) => a.timestamp - b.timestamp)
}

function normalizeTokenInfo(response?: unknown) {
  return recordsFrom(response)[0]
}

function walletMatches(tx: NormalizedTokenTransaction, walletAddress: string) {
  if (!tx.walletAddress) return false
  return tx.walletAddress.toLowerCase() === walletAddress.toLowerCase()
}

function transactionRowsExposeWallet(txs: NormalizedTokenTransaction[]) {
  return txs.some((tx) => Boolean(tx.walletAddress))
}

function priceAt(kline: NormalizedKlinePoint[], timestamp: number) {
  if (!kline.length) return undefined
  const nearest = kline.reduce((best, point) => Math.abs(point.timestamp - timestamp) < Math.abs(best.timestamp - timestamp) ? point : best, kline[0])
  return nearest.close
}

function buildPricePath(kline: NormalizedKlinePoint[], buyTime: number, buyPrice: number): PricePathPoint[] {
  const points = kline
    .filter((point) => point.timestamp >= buyTime)
    .slice(0, 180)
    .map((point) => {
      const minute = Math.max(0, Math.round((point.timestamp - buyTime) / 60000))
      return {
        minute,
        price: point.close,
        pnlPct: Math.round(((point.close - buyPrice) / buyPrice) * 1000) / 10,
      }
    })

  return points.length ? points : [{ minute: 0, price: buyPrice, pnlPct: 0 }]
}

function buildTrade(
  buy: NormalizedTokenTransaction,
  sell: NormalizedTokenTransaction,
  kline: NormalizedKlinePoint[],
  index: number,
  meta: Pick<BitgetMeta, "marketContext" | "securitySummary" | "holderSummary" | "smartMoneySummary">,
): TradeReplay | null {
  const buyPrice = buy.priceUsd ?? priceAt(kline, buy.timestamp)
  const sellPrice = sell.priceUsd ?? priceAt(kline, sell.timestamp)
  if (!buyPrice || !sellPrice) return null

  const pricePath = buildPricePath(kline, buy.timestamp, buyPrice)
  const realizedPnlPct = Math.round(((sellPrice - buyPrice) / buyPrice) * 1000) / 10
  const maxUpsidePct = Math.max(...pricePath.map((point) => point.pnlPct), realizedPnlPct)
  const maxDrawdownPct = Math.abs(Math.min(...pricePath.map((point) => point.pnlPct), 0))
  const profitCaptureRate = calculateProfitCaptureRate({ realizedPnlPct, maxUpsidePct })
  const holdDurationMin = Math.max(1, Math.round((sell.timestamp - buy.timestamp) / 60000))
  const positionSizeUsd = Math.round(buy.amountUsd ?? ((buy.amount ?? 0) * buyPrice))
  const baseTrade = {
    pricePath,
    postBuyLowPct: -maxDrawdownPct,
    maxDrawdownPct,
    overheatedAtEntry: meta.holderSummary?.suspiciousConcentration || meta.securitySummary?.riskLevel === "high",
  }
  const entryScore = calculateEntryScore(baseTrade)
  const exitScore = calculateExitScore({ realizedPnlPct, maxUpsidePct, maxDrawdownPct, pricePath, holdDurationMin })
  const mistakeTags = [
    realizedPnlPct > 0 && profitCaptureRate < 40 ? "EARLY_EXIT" : "",
    realizedPnlPct < 0 && holdDurationMin > 60 ? "HELD_THROUGH_DRAWDOWN" : "",
    realizedPnlPct < 0 && meta.smartMoneySummary?.smartMoneyAction === "net selling" ? "IGNORED_SMART_MONEY_SELLING" : "",
    meta.holderSummary?.suspiciousConcentration ? "BOUGHT_INTO_HOLDER_CONCENTRATION" : "",
    profitCaptureRate < 35 ? "NO_CLEAR_EXIT_RULE" : "",
  ].filter(Boolean)

  return {
    id: `bitget-${index}`,
    tokenSymbol: buy.symbol ?? sell.symbol ?? "TOKEN",
    tokenAddress: buy.tokenAddress ?? sell.tokenAddress ?? "unknown-token",
    token: { symbol: buy.symbol ?? sell.symbol ?? "TOKEN", name: buy.symbol ?? sell.symbol ?? "Bitget token replay" },
    buyTime: new Date(buy.timestamp).toISOString(),
    sellTime: new Date(sell.timestamp).toISOString(),
    holdDurationMin,
    buyPrice,
    sellPrice,
    positionSizeUsd,
    realizedPnlUsd: Math.round(positionSizeUsd * realizedPnlPct / 100),
    realizedPnlPct,
    maxUpsidePct: Math.round(maxUpsidePct * 10) / 10,
    maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
    postBuyHighPct: Math.round(maxUpsidePct * 10) / 10,
    postBuyLowPct: -Math.round(maxDrawdownPct * 10) / 10,
    profitCaptureRate,
    profitGivebackPct: Math.max(0, Math.round((maxUpsidePct - realizedPnlPct) * 10) / 10),
    exitAftermath: "Reconstructed from Bitget token replay data and available K-line path.",
    entryScore,
    exitScore,
    mistakeTags: mistakeTags.length ? mistakeTags : ["NO_MAJOR_BEHAVIOR_LEAK"],
    diagnosis: profitCaptureRate < 40
      ? "The replay suggests a weak exit relative to the available upside."
      : "The replay did not show a major profit-capture leak from the available data.",
    chineseDiagnosis: profitCaptureRate < 40
      ? "这笔复盘显示卖点相对弱，利润捕获率低于可用上行空间。"
      : "从当前可用数据看，这笔交易没有明显利润捕获漏洞。",
    suggestedFix: profitCaptureRate < 40
      ? "Use staged take-profit and a trailing rule instead of a full manual exit."
      : "Keep the rule explicit and compare future exits against smart money and holder risk context.",
    pricePath,
    smartMoneyAtEntry: meta.smartMoneySummary?.smartMoneyAction,
    smartMoneyAtExit: meta.smartMoneySummary?.smartMoneyAction,
    kolAtEntry: meta.smartMoneySummary?.kolAction,
    kolAtExit: meta.smartMoneySummary?.kolAction,
    holderRiskAtEntry: meta.holderSummary?.topHolderConcentrationLevel,
    securityRisk: meta.securitySummary?.riskLevel,
    buyPressureAtEntry: meta.marketContext?.buyPressure,
    sellPressureAtExit: meta.marketContext?.sellPressure,
    marketContextDiagnosis: meta.marketContext?.momentumState,
  }
}

function pairTrades(txs: NormalizedTokenTransaction[], kline: NormalizedKlinePoint[], meta: BitgetMeta) {
  const trades: TradeReplay[] = []
  const buys = txs.filter((tx) => tx.side === "buy")
  const sells = txs.filter((tx) => tx.side === "sell")
  for (const buy of buys) {
    if (trades.length >= MAX_REPLAY_TRADES) break
    const sell = sells.find((candidate) => candidate.timestamp > buy.timestamp)
    if (!sell) continue
    const trade = buildTrade(buy, sell, kline, trades.length + 1, meta)
    if (trade) trades.push(trade)
  }
  return trades
}

function buildAnalysis(params: AnalyzeWalletParams, trades: TradeReplay[], meta: BitgetMeta): WalletAnalysis {
  const whatIf = buildWhatIfSimulation(trades)
  const personality = analyzeTradingPersonality(trades)
  const leaks = analyzeTradingLeaks(trades)
  const rules = buildPersonalizedRules(trades)
  const drawdown = analyzeDrawdownBehavior(trades)
  const totalCapital = trades.reduce((sum, trade) => sum + trade.positionSizeUsd, 0)
  const winRate = trades.length ? Math.round((trades.filter((trade) => trade.realizedPnlPct > 0).length / trades.length) * 1000) / 10 : 0
  const maxMissedUpside = trades.length ? Math.max(...trades.map((trade) => Math.max(0, trade.maxUpsidePct - trade.realizedPnlPct))) : 0
  const summary = {
    ...mockWalletAnalysis.summary,
    ...drawdown,
    totalTrades: trades.length,
    winRate,
    realizedPnlUsd: whatIf.actualResult.resultUsd,
    realizedPnlPct: totalCapital ? whatIf.actualResult.resultPct : 0,
    profitCaptureRate: trades.length ? Math.round(trades.reduce((sum, trade) => sum + trade.profitCaptureRate, 0) / trades.length) : 0,
    avgHoldTime: trades.length ? `${Math.round(trades.reduce((sum, trade) => sum + trade.holdDurationMin, 0) / trades.length)}m` : "0m",
    maxMissedUpside: Math.round(maxMissedUpside * 10) / 10,
    grade: trades.length ? (winRate >= 55 ? "B" : "C+") : "N/A",
  }
  const analysis: WalletAnalysis = {
    ...mockWalletAnalysis,
    walletAddress: params.walletAddress,
    chain: params.chain,
    period: params.period,
    mode: params.mode ?? (params.tokenAddress ? "token_replay" : "wallet_behavior"),
    dataSource: "bitget",
    dataCoverage: evaluateDataCoverage(meta.dataCoverageStatus ?? {
      tokenInfo: false,
      kline: false,
      walletTransactions: false,
      security: false,
      holders: false,
      smartMoneyMarkers: false,
    }),
    bitgetMeta: meta,
    summary,
    personality,
    trades,
    leaks,
    rules,
    whatIf,
    reportCard: mockWalletAnalysis.reportCard,
  }

  return {
    ...analysis,
    reportCard: generateReportCard(analysis),
  }
}

function buildMockFallback(params: AnalyzeWalletParams, warnings: string[], addressAnalysis?: Record<string, unknown>): WalletAnalysis {
  return {
    ...mockWalletAnalysis,
    walletAddress: params.walletAddress,
    chain: params.chain,
    period: params.period,
    mode: params.mode ?? "wallet_behavior",
    dataSource: "bitget",
    dataCoverage: "mock_fallback",
    bitgetMeta: {
      chain: params.chain,
      walletAddress: params.walletAddress,
      tokenAddress: params.tokenAddress,
      tradingDynamics: addressAnalysis,
      dataCoverageStatus: {
        tokenInfo: false,
        kline: false,
        walletTransactions: false,
        security: false,
        holders: false,
        smartMoneyMarkers: false,
      },
      warnings: ["Demo fallback data.", ...warnings],
    },
  }
}

function settledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : undefined
}

function settledWarning(name: string, result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") return undefined
  return `${name} unavailable: ${result.reason instanceof Error ? result.reason.message : "unknown Bitget Wallet Skill error"}`
}

export class BitgetAdapter {
  private readonly client = new BitgetClient()

  async getWalletAnalysis(params: AnalyzeWalletParams): Promise<WalletAnalysis> {
    if ((params.mode ?? (params.tokenAddress ? "token_replay" : "wallet_behavior")) === "wallet_behavior" && !params.tokenAddress) {
      return this.getWalletBehaviorAnalysis(params)
    }
    if (!params.tokenAddress) {
      return this.getWalletBehaviorAnalysis(params)
    }
    return this.getTokenReplayAnalysis({ ...params, tokenAddress: params.tokenAddress, mode: "token_replay" })
  }

  private async getTokenReplayAnalysis(params: AnalyzeWalletParams & { tokenAddress: string }): Promise<WalletAnalysis> {
    const common = {
      chain: params.chain,
      tokenAddress: params.tokenAddress,
      walletAddress: params.walletAddress,
      period: params.period,
      days: periodToDays(params.period),
    }
    const [
      tokenInfoResult,
      klineResult,
      transactionsResult,
      securityResult,
      holdersResult,
      dynamicsResult,
      smartMoneyResult,
      quoteResult,
    ] = await Promise.allSettled([
      this.client.getTokenInfo(common),
      this.client.getTokenKline(common),
      this.client.getTokenTransactions(common),
      this.client.getTokenSecurity(common),
      this.client.getTokenHolders(common),
      this.client.getTokenTradingDynamics(common),
      this.client.getSmartMoneyOrKolTrades(common),
      this.client.getSwapQuotePreview({ ...common, side: "preview" }),
    ])

    const tokenInfo = normalizeTokenInfo(settledValue(tokenInfoResult))
    const kline = normalizeKline(settledValue(klineResult))
    const rawTransactions = normalizeTransactions(settledValue(transactionsResult))
    const exposesWallet = transactionRowsExposeWallet(rawTransactions)
    const walletTransactions = exposesWallet
      ? rawTransactions.filter((tx) => walletMatches(tx, params.walletAddress))
      : rawTransactions
    const securitySummary = analyzeSecurityRisk(settledValue(securityResult))
    const holderSummary = analyzeHolderRisk(settledValue(holdersResult))
    const tradingDynamicsRecord = normalizeTokenInfo(settledValue(dynamicsResult))
    const tradingDynamics = (tradingDynamicsRecord?.txn_info ?? tradingDynamicsRecord) as Record<string, unknown> | undefined
    const marketContext = buildBitgetMarketContext({ tokenInfo, tradingDynamics, kline })
    const smartMoneySummary = compareWithSmartMoney({ smartMoneyData: settledValue(smartMoneyResult), kolData: settledValue(smartMoneyResult) })

    const coverageStatus: DataCoverageStatus = {
      tokenInfo: Boolean(tokenInfo),
      kline: kline.length > 0,
      walletTransactions: walletTransactions.some((tx) => tx.side === "buy" || tx.side === "sell"),
      security: securitySummary.riskLevel !== "unknown",
      holders: holderSummary.topHolderConcentrationLevel !== "unknown",
      smartMoneyMarkers: smartMoneySummary.smartMoneyAction !== "unknown" || smartMoneySummary.kolAction !== "unknown",
    }
    const warnings = [
      ...buildDataCoverageWarnings(coverageStatus),
      !exposesWallet && rawTransactions.length ? "Transaction rows did not expose wallet fields; assuming the Bitget endpoint applied the walletAddress filter server-side." : undefined,
      ...[
        settledWarning("Token info", tokenInfoResult),
        settledWarning("Kline", klineResult),
        settledWarning("Transactions", transactionsResult),
        settledWarning("Security", securityResult),
        settledWarning("Holders", holdersResult),
        settledWarning("Trading dynamics", dynamicsResult),
        settledWarning("Smart money/KOL markers", smartMoneyResult),
        settledWarning("Quote preview", quoteResult),
      ],
    ].filter((item): item is string => Boolean(item))
    const meta: BitgetMeta = {
      chain: params.chain,
      walletAddress: params.walletAddress,
      tokenAddress: params.tokenAddress,
      tokenInfo,
      securitySummary,
      holderSummary,
      tradingDynamics,
      marketContext,
      smartMoneySummary,
      kolSummary: settledValue(smartMoneyResult),
      quotePreview: settledValue(quoteResult),
      dataCoverageStatus: coverageStatus,
      warnings,
    }
    let trades = pairTrades(walletTransactions, kline, meta)
    meta.smartMoneySummary = compareWithSmartMoney({ trade: trades[0], smartMoneyData: settledValue(smartMoneyResult), kolData: settledValue(smartMoneyResult) })
    trades = trades.map((trade) => ({
      ...trade,
      smartMoneyAtEntry: meta.smartMoneySummary?.smartMoneyAction,
      smartMoneyAtExit: meta.smartMoneySummary?.smartMoneyAction,
      kolAtEntry: meta.smartMoneySummary?.kolAction,
      kolAtExit: meta.smartMoneySummary?.kolAction,
    }))
    if (!trades.length) {
      meta.warnings.push("No complete wallet-specific buy/sell pair could be reconstructed; replay cards are intentionally empty instead of invented.")
    }

    return buildAnalysis(params, trades, meta)
  }

  private async getWalletBehaviorAnalysis(params: AnalyzeWalletParams): Promise<WalletAnalysis> {
    const result = await Promise.allSettled([
      this.client.getAddressAnalysis({
        walletAddress: params.walletAddress,
        chain: params.chain,
        period: params.period,
        days: periodToDays(params.period),
      }),
    ])
    const addressAnalysis = settledValue(result[0])
    const warning = settledWarning("Address analysis", result[0])

    return buildMockFallback(
      params,
      [
        warning,
        addressAnalysis
          ? "Wallet-level Bitget data was available, but complete historical trade replay is not assumed; demo replay cards remain mock fallback data."
          : "Wallet-level Bitget data was unavailable, so the app is showing demo fallback replay cards.",
      ].filter((item): item is string => Boolean(item)),
      addressAnalysis,
    )
  }
}
