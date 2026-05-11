import type { TradeReplay } from "@/src/data/mockWalletAnalysis"

export function calculateProfitCaptureRate(trade: Pick<TradeReplay, "realizedPnlPct" | "maxUpsidePct">): number
export function calculateProfitCaptureRate(realizedPnlPct: number, maxUpsidePct: number): number
export function calculateProfitCaptureRate(
  tradeOrRealizedPnlPct: Pick<TradeReplay, "realizedPnlPct" | "maxUpsidePct"> | number,
  maybeMaxUpsidePct?: number,
) {
  const realizedPnlPct = typeof tradeOrRealizedPnlPct === "number" ? tradeOrRealizedPnlPct : tradeOrRealizedPnlPct.realizedPnlPct
  const maxUpsidePct = typeof tradeOrRealizedPnlPct === "number" ? maybeMaxUpsidePct ?? 0 : tradeOrRealizedPnlPct.maxUpsidePct

  if (realizedPnlPct <= 0 || maxUpsidePct <= 0) return 0
  return Math.round(Math.min(100, (realizedPnlPct / maxUpsidePct) * 100) * 10) / 10
}

export function calculateProfitGiveback(trade: Pick<TradeReplay, "realizedPnlPct" | "maxUpsidePct">) {
  if (trade.maxUpsidePct <= 0 || trade.realizedPnlPct >= trade.maxUpsidePct) return 0
  return Math.round((trade.maxUpsidePct - trade.realizedPnlPct) * 10) / 10
}

export function getAverageProfitCapture(trades: TradeReplay[]) {
  const winners = trades.filter((trade) => trade.realizedPnlPct > 0)
  if (!winners.length) return 0

  const total = winners.reduce((sum, trade) => {
    return sum + calculateProfitCaptureRate(trade)
  }, 0)

  return Math.round(total / winners.length)
}
