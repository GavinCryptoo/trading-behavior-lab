import type { TradeReplay } from "@/src/data/mockWalletAnalysis"

function pnlAtMinute(trade: Pick<TradeReplay, "pricePath">, minute: number) {
  return trade.pricePath.find((point) => point.minute >= minute)?.pnlPct ?? trade.pricePath[trade.pricePath.length - 1]?.pnlPct ?? 0
}

export function calculateEntryScore(trade: Pick<TradeReplay, "pricePath" | "postBuyLowPct" | "maxDrawdownPct" | "overheatedAtEntry">) {
  let score = 50
  const pnl1m = pnlAtMinute(trade, 1)
  const pnl5m = pnlAtMinute(trade, 5)
  const pnl15m = pnlAtMinute(trade, 15)
  const pnl60m = pnlAtMinute(trade, 60)

  if (pnl1m > 0) score += 8
  if (pnl5m >= 20) score += 12
  else if (pnl5m <= -20) score -= 18
  if (pnl15m >= 50) score += 16
  else if (pnl15m <= -25) score -= 16
  if (pnl60m >= 100) score += 12
  else if (pnl60m <= -30) score -= 12

  if (trade.postBuyLowPct > -15) score += 10
  else if (trade.maxDrawdownPct > 35) score -= 18
  if (trade.overheatedAtEntry) score -= 12

  return Math.max(0, Math.min(100, Math.round(score)))
}
