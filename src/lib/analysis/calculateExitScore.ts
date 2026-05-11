import type { TradeReplay } from "@/src/data/mockWalletAnalysis"
import { calculateProfitCaptureRate } from "./profitCapture"

function pnlAfterSell(trade: Pick<TradeReplay, "pricePath" | "holdDurationMin">, minutesAfterSell: number) {
  const target = trade.holdDurationMin + minutesAfterSell
  return trade.pricePath.find((point) => point.minute >= target)?.pnlPct ?? trade.pricePath[trade.pricePath.length - 1]?.pnlPct ?? 0
}

export function calculateExitScore(trade: Pick<TradeReplay, "realizedPnlPct" | "maxUpsidePct" | "maxDrawdownPct" | "pricePath" | "holdDurationMin">) {
  const capture = calculateProfitCaptureRate(trade)
  const after5m = pnlAfterSell(trade, 5)
  const after15m = pnlAfterSell(trade, 15)
  const after60m = pnlAfterSell(trade, 60)
  const missedPeak = Math.max(0, trade.maxUpsidePct - trade.realizedPnlPct)
  let score = 55

  if (capture >= 70) score += 25
  else if (capture >= 45) score += 8
  else if (trade.maxUpsidePct >= 80) score -= 20

  if (after5m > trade.realizedPnlPct + 30) score -= 10
  if (after15m > trade.realizedPnlPct + 50) score -= 12
  if (after60m > trade.realizedPnlPct + 80) score -= 12
  if (missedPeak > 200) score -= 12
  if (trade.realizedPnlPct < 0) score -= 18
  if (trade.maxDrawdownPct >= 30 && trade.realizedPnlPct < 0) score -= 12

  return Math.max(0, Math.min(100, Math.round(score)))
}
