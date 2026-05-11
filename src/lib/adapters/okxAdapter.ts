import { mockWalletAnalysis, type PricePathPoint, type TradeReplay, type WalletAnalysis } from "@/src/data/mockWalletAnalysis"
import { calculateEntryScore } from "@/src/lib/analysis/calculateEntryScore"
import { calculateExitScore } from "@/src/lib/analysis/calculateExitScore"
import { analyzeDrawdownBehavior } from "@/src/lib/analysis/drawdownBehavior"
import { buildPersonalizedRules } from "@/src/lib/analysis/personalizedRules"
import { calculateProfitCaptureRate } from "@/src/lib/analysis/profitCapture"
import { generateReportCard } from "@/src/lib/analysis/reportCard"
import { analyzeTradingLeaks } from "@/src/lib/analysis/tradingLeaks"
import { analyzeTradingPersonality } from "@/src/lib/analysis/tradingPersonality"
import { buildWhatIfSimulation } from "@/src/lib/analysis/whatIfSimulation"
import { OkxClient } from "./okxClient"

export interface WalletAnalysisAdapter {
  getWalletAnalysis(params: {
    walletAddress: string
    chain: string
    period: string
  }): Promise<WalletAnalysis>
}

interface OkxTransaction {
  chainIndex: string
  txHash: string
  txTime: string
  from?: Array<{ address?: string; amount?: string }>
  to?: Array<{ address?: string; amount?: string }>
  tokenContractAddress?: string
  amount?: string
  symbol?: string
  txStatus?: string
}

interface OkxTransactionsResponse {
  code: string
  msg: string
  data: Array<{
    cursor?: string
    transactionList?: OkxTransaction[]
    transactions?: OkxTransaction[]
  }>
}

interface OkxCandlesResponse {
  code: string
  msg: string
  data: Array<[string, string, string, string, string, string, string, string]>
}

type WalletTokenEvent = {
  tokenAddress: string
  symbol: string
  time: number
  amount: number
  side: "receive" | "send"
}

const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112"
const MAX_TRANSACTION_PAGES = 12
const TRANSACTION_PAGE_LIMIT = 100
const MAX_REPLAY_TRADES = 16
const EXCLUDED_TOKEN_SYMBOLS = new Set(["SOL", "USDC", "USDT", "USD1"])

const CHAIN_INDEX: Record<string, string> = {
  Solana: "501",
  "X Layer": "196",
}

function periodToMs(period: string) {
  const days = Number.parseInt(period, 10)
  return (Number.isFinite(days) ? days : 7) * 24 * 60 * 60 * 1000
}

function sameAddress(a = "", b = "") {
  return a.toLowerCase() === b.toLowerCase()
}

function isWalletReceiver(tx: OkxTransaction, walletAddress: string) {
  return tx.to?.some((item) => sameAddress(item.address, walletAddress)) ?? false
}

function isWalletSender(tx: OkxTransaction, walletAddress: string) {
  return tx.from?.some((item) => sameAddress(item.address, walletAddress)) ?? false
}

function normalizeTransactions(response: OkxTransactionsResponse) {
  return response.data.flatMap((item) => item.transactionList ?? item.transactions ?? [])
}

function groupEventsByToken(events: WalletTokenEvent[]) {
  return events.reduce((groups, event) => {
    const existing = groups.get(event.tokenAddress) ?? []
    existing.push(event)
    groups.set(event.tokenAddress, existing)
    return groups
  }, new Map<string, WalletTokenEvent[]>())
}

function hasCompleteRoundTrip(events: WalletTokenEvent[]) {
  const buys = events.filter((event) => event.side === "receive").sort((a, b) => a.time - b.time)
  const sells = events.filter((event) => event.side === "send").sort((a, b) => a.time - b.time)
  return buys.some((buy) => sells.some((sell) => sell.time > buy.time))
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function candlePriceAt(candles: OkxCandlesResponse["data"], targetTime: number) {
  if (!candles.length) return 0
  const sorted = [...candles].sort((a, b) => Number(a[0]) - Number(b[0]))
  return Number(sorted.reduce((nearest, candle) => {
    return Math.abs(Number(candle[0]) - targetTime) < Math.abs(Number(nearest[0]) - targetTime) ? candle : nearest
  }, sorted[0])[4])
}

function buildPricePath(candles: OkxCandlesResponse["data"], buyTime: number, buyPrice: number): PricePathPoint[] {
  if (!candles.length || buyPrice <= 0) return [{ minute: 0, price: buyPrice || 0, pnlPct: 0 }]

  const sorted = [...candles].sort((a, b) => Number(a[0]) - Number(b[0]))
  const points = sorted
    .filter((candle) => Number(candle[0]) >= buyTime)
    .slice(0, 180)
    .map((candle) => {
      const minute = Math.max(0, Math.round((Number(candle[0]) - buyTime) / 60000))
      const price = Number(candle[4])
      return {
        minute,
        price,
        pnlPct: Math.round(((price - buyPrice) / buyPrice) * 1000) / 10,
      }
    })

  return points.length ? points : [{ minute: 0, price: buyPrice, pnlPct: 0 }]
}

function createDiagnosis(trade: Pick<TradeReplay, "realizedPnlPct" | "maxUpsidePct" | "profitCaptureRate">) {
  if (trade.realizedPnlPct < 0 && trade.maxUpsidePct > 20) return "这笔交易曾经进入盈利区，但最终变成亏损，主要问题是没有保护利润。"
  if (trade.realizedPnlPct < 0) return "这笔交易入场后没有形成有效动能，亏损扩大前应该更快退出。"
  if (trade.profitCaptureRate < 40) return `买点可以，但卖点偏弱，只捕获了最高利润的 ${trade.profitCaptureRate}%。`
  return "这笔交易的入场和退出相对健康，利润捕获质量较高。"
}

function buildTradeFromEvents(
  tokenEvents: WalletTokenEvent[],
  candles: OkxCandlesResponse["data"],
  index: number,
): TradeReplay | null {
  const buys = tokenEvents.filter((event) => event.side === "receive").sort((a, b) => a.time - b.time)
  const sells = tokenEvents.filter((event) => event.side === "send").sort((a, b) => a.time - b.time)
  const buy = buys[0]
  const sell = sells.find((event) => event.time > buy?.time)
  if (!buy || !sell) return null

  const buyPrice = candlePriceAt(candles, buy.time)
  const sellPrice = candlePriceAt(candles, sell.time)
  if (!buyPrice || !sellPrice) return null

  const pricePath = buildPricePath(candles, buy.time, buyPrice)
  const realizedPnlPct = Math.round(((sellPrice - buyPrice) / buyPrice) * 1000) / 10
  const maxUpsidePct = Math.max(...pricePath.map((point) => point.pnlPct), realizedPnlPct)
  const maxDrawdownPct = Math.abs(Math.min(...pricePath.map((point) => point.pnlPct), 0))
  const profitCaptureRate = calculateProfitCaptureRate({ realizedPnlPct, maxUpsidePct })
  const baseTrade = {
    pricePath,
    postBuyLowPct: -maxDrawdownPct,
    maxDrawdownPct,
    overheatedAtEntry: false,
  }
  const entryScore = calculateEntryScore(baseTrade)
  const holdDurationMin = Math.max(1, Math.round((sell.time - buy.time) / 60000))
  const exitScore = calculateExitScore({ realizedPnlPct, maxUpsidePct, maxDrawdownPct, pricePath, holdDurationMin })
  const mistakeTags = [
    profitCaptureRate < 40 && realizedPnlPct > 0 ? "卖飞" : "",
    realizedPnlPct < 0 && holdDurationMin > 60 ? "亏损死拿" : "",
  ].filter(Boolean)
  const chineseDiagnosis = createDiagnosis({ realizedPnlPct, maxUpsidePct, profitCaptureRate })

  return {
    id: `okx-${index}`,
    tokenSymbol: buy.symbol,
    tokenAddress: buy.tokenAddress,
    token: { symbol: buy.symbol, name: buy.symbol },
    buyTime: new Date(buy.time).toISOString(),
    sellTime: new Date(sell.time).toISOString(),
    holdDurationMin,
    buyPrice,
    sellPrice,
    positionSizeUsd: Math.round(buy.amount * buyPrice),
    realizedPnlUsd: Math.round(buy.amount * (sellPrice - buyPrice)),
    realizedPnlPct,
    maxUpsidePct: Math.round(maxUpsidePct * 10) / 10,
    maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
    postBuyHighPct: Math.round(maxUpsidePct * 10) / 10,
    postBuyLowPct: -Math.round(maxDrawdownPct * 10) / 10,
    profitCaptureRate,
    profitGivebackPct: realizedPnlPct < maxUpsidePct ? Math.round((maxUpsidePct - realizedPnlPct) * 10) / 10 : 0,
    exitAftermath: "基于 OKX 历史K线估算卖出后走势。",
    entryScore,
    exitScore,
    mistakeTags: mistakeTags.length ? mistakeTags : ["正常退出"],
    diagnosis: chineseDiagnosis,
    chineseDiagnosis,
    suggestedFix: profitCaptureRate < 40 ? "浮盈超过 +80% 后启用分批止盈。" : "继续保持机械化止盈止损。",
    pricePath,
  }
}

export class OkxAdapter implements WalletAnalysisAdapter {
  private readonly client = new OkxClient()

  private async fetchTransactions(params: {
    walletAddress: string
    chainIndex: string
    begin: number
    end: number
  }) {
    const transactions: OkxTransaction[] = []
    let cursor: string | undefined

    for (let page = 0; page < MAX_TRANSACTION_PAGES; page += 1) {
      const response = await this.client.get<OkxTransactionsResponse>("/api/v6/dex/post-transaction/transactions-by-address", {
        address: params.walletAddress,
        chains: params.chainIndex,
        begin: params.begin,
        end: params.end,
        limit: TRANSACTION_PAGE_LIMIT,
        cursor,
      })
      const pageTransactions = normalizeTransactions(response)
      transactions.push(...pageTransactions)
      cursor = response.data[0]?.cursor
      if (!cursor || !pageTransactions.length) break
      await delay(220)
    }

    return transactions
  }

  async getWalletAnalysis(params: { walletAddress: string; chain: string; period: string }): Promise<WalletAnalysis> {
    const chainIndex = CHAIN_INDEX[params.chain] ?? CHAIN_INDEX.Solana
    const end = Date.now()
    const begin = end - periodToMs(params.period)
    const transactions = await this.fetchTransactions({
      walletAddress: params.walletAddress,
      chainIndex,
      begin,
      end,
    })
    const tokenEvents = transactions
      .filter((tx) => tx.txStatus === "success" && tx.tokenContractAddress && tx.tokenContractAddress !== SOL_TOKEN_ADDRESS && tx.symbol && !EXCLUDED_TOKEN_SYMBOLS.has(tx.symbol.toUpperCase()) && tx.amount)
      .map((tx) => ({
        tokenAddress: tx.tokenContractAddress ?? "",
        symbol: tx.symbol ?? "UNKNOWN",
        time: Number(tx.txTime),
        amount: Number(tx.amount),
        side: isWalletReceiver(tx, params.walletAddress) && !isWalletSender(tx, params.walletAddress) ? "receive" as const : "send" as const,
      }))
      .filter((event) => event.amount > 0 && event.tokenAddress)

    const grouped = groupEventsByToken(tokenEvents)
    const completeGroups = [...grouped.entries()].filter(([, events]) => hasCompleteRoundTrip(events))
    const totalRoundTrips = completeGroups.length
    const trades: TradeReplay[] = []

    for (const [tokenAddress, events] of completeGroups) {
      if (trades.length >= MAX_REPLAY_TRADES) break
      const firstBuy = events.filter((event) => event.side === "receive").sort((a, b) => a.time - b.time)[0]
      if (!firstBuy) continue
      await delay(260)
      let candles: OkxCandlesResponse
      try {
        candles = await this.client.get<OkxCandlesResponse>("/api/v6/dex/market/historical-candles", {
          chainIndex,
          tokenContractAddress: tokenAddress,
          before: firstBuy.time,
          bar: "1m",
          limit: 180,
        })
      } catch {
        continue
      }
      const trade = buildTradeFromEvents(events, candles.data, trades.length + 1)
      if (trade) trades.push(trade)
    }

    if (!trades.length) {
      throw new Error("OKX returned wallet transactions, but no complete buy/sell token pairs with usable K-line prices were found.")
    }

    return this.buildAnalysis(params, trades, totalRoundTrips)
  }

  private buildAnalysis(params: { walletAddress: string; chain: string; period: string }, trades: TradeReplay[], totalRoundTrips = trades.length): WalletAnalysis {
    const whatIf = buildWhatIfSimulation(trades)
    const personality = analyzeTradingPersonality(trades)
    const leaks = analyzeTradingLeaks(trades)
    const rules = buildPersonalizedRules(trades)
    const drawdown = analyzeDrawdownBehavior(trades)
    const sampledTradeCount = trades.length
    const winRate = Math.round((trades.filter((trade) => trade.realizedPnlPct > 0).length / sampledTradeCount) * 1000) / 10
    const maxMissedUpside = Math.max(...trades.map((trade) => Math.max(0, trade.maxUpsidePct - trade.realizedPnlPct)), 0)
    const summary = {
      ...mockWalletAnalysis.summary,
      ...drawdown,
      totalTrades: totalRoundTrips,
      winRate,
      realizedPnlUsd: whatIf.actualResult.resultUsd,
      realizedPnlPct: whatIf.actualResult.resultPct,
      profitCaptureRate: Math.round(trades.reduce((sum, trade) => sum + trade.profitCaptureRate, 0) / sampledTradeCount),
      avgHoldTime: `${Math.round(trades.reduce((sum, trade) => sum + trade.holdDurationMin, 0) / sampledTradeCount)}m`,
      maxMissedUpside: Math.round(maxMissedUpside * 10) / 10,
      grade: winRate >= 55 ? "B" : "C+",
    }
    const analysis: WalletAnalysis = {
      ...mockWalletAnalysis,
      walletAddress: params.walletAddress,
      chain: params.chain,
      period: params.period,
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
}
