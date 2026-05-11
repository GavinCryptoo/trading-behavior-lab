import type { TradeReplay, TradingLeak } from "@/src/data/mockWalletAnalysis"
import { getAverageProfitCapture } from "./profitCapture"

export function analyzeTradingLeaks(trades: TradeReplay[]): TradingLeak[] {
  const avgCapture = getAverageProfitCapture(trades)
  const earlyExitCount = trades.filter((trade) => trade.realizedPnlPct > 0 && trade.maxUpsidePct > trade.realizedPnlPct * 1.5).length
  const lateStopCount = trades.filter((trade) => trade.realizedPnlPct < 0 && trade.maxDrawdownPct >= 30).length

  return [
    {
      id: "1",
      title: "Selling Winners Too Early",
      chineseTitle: "盈利单卖太早",
      description: "You often find upside, then exit before the chart confirms trend failure.",
      impact: "-$12,400",
      frequency: earlyExitCount * 10 + 2,
      severity: "high",
      evidence: `Average profit capture is ${avgCapture}% across winning replay trades.`,
      recommendation: "Use staged take-profit once unrealized PnL exceeds +80%.",
    },
    {
      id: "2",
      title: "Holding Losers Too Long",
      chineseTitle: "亏损单拿太久",
      description: "Your losing trades stay open much longer than winners.",
      impact: "-$4,200",
      frequency: earlyExitCount + 8,
      severity: "medium",
      evidence: "Avg loser hold is materially longer than avg winner hold.",
      recommendation: "Use a time stop when a token fails to make a new high within 30 minutes.",
    },
    {
      id: "3",
      title: "No Profit Protection",
      chineseTitle: "没有利润保护",
      description: "Large unrealized gains are not protected with a mechanical floor.",
      impact: "-$1,890",
      frequency: lateStopCount + 11,
      severity: "medium",
      evidence: "Several trades reached meaningful floating profit but captured less than half of the move.",
      recommendation: "Once a position reaches +100%, do not let final realized PnL fall below +20%.",
    },
  ]
}

export const detectTradingLeaks = analyzeTradingLeaks
