import type { TradeReplay, WalletSummary } from "@/src/data/mockWalletAnalysis"

export function analyzeDrawdownBehavior(trades: TradeReplay[]): Pick<
  WalletSummary,
  "averageMaxDrawdown" | "winnerAvgDrawdown" | "loserAvgDrawdown" | "avgWinnerHold" | "avgLoserHold" | "avgWinnerPnlPct" | "avgLoserPnlPct" | "lossHoldingBias"
> {
  const winners = trades.filter((trade) => trade.realizedPnlPct > 0)
  const losers = trades.filter((trade) => trade.realizedPnlPct < 0)
  const avg = (values: number[]) => values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0
  const avgWinnerHoldMin = avg(winners.map((trade) => trade.holdDurationMin))
  const avgLoserHoldMin = avg(losers.map((trade) => trade.holdDurationMin))
  const holdBias = avgWinnerHoldMin ? Math.round((avgLoserHoldMin / avgWinnerHoldMin) * 10) / 10 : 0

  return {
    averageMaxDrawdown: avg(trades.map((trade) => trade.maxDrawdownPct)),
    winnerAvgDrawdown: avg(winners.map((trade) => trade.maxDrawdownPct)),
    loserAvgDrawdown: avg(losers.map((trade) => trade.maxDrawdownPct)),
    avgWinnerHold: `${Math.round(avgWinnerHoldMin)}m`,
    avgLoserHold: avgLoserHoldMin >= 60 ? `${Math.round((avgLoserHoldMin / 60) * 10) / 10}h` : `${Math.round(avgLoserHoldMin)}m`,
    avgWinnerPnlPct: avg(winners.map((trade) => trade.realizedPnlPct)),
    avgLoserPnlPct: avg(losers.map((trade) => trade.realizedPnlPct)),
    lossHoldingBias: `Losers held ${holdBias}x longer than winners`,
  }
}
