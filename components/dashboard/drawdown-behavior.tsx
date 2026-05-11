"use client"

import { Activity, Clock, TrendingDown, TrendingUp } from "lucide-react"
import type { WalletSummary } from "@/src/data/mockWalletAnalysis"

interface DrawdownBehaviorProps {
  summary: Pick<
    WalletSummary,
    "averageMaxDrawdown" | "winnerAvgDrawdown" | "loserAvgDrawdown" | "avgWinnerHold" | "avgLoserHold" | "avgWinnerPnlPct" | "avgLoserPnlPct" | "lossHoldingBias"
  >
}

export function DrawdownBehavior({ summary }: DrawdownBehaviorProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-warning/10">
          <Activity className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Drawdown Behavior</h3>
          <p className="text-sm text-muted-foreground">How you treat winners versus losers</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl bg-secondary/30 border border-border/50 p-4">
          <p className="text-xs text-muted-foreground">Average Max Drawdown</p>
          <p className="mt-1 text-2xl font-bold text-warning">{summary.averageMaxDrawdown}%</p>
        </div>
        <div className="rounded-xl bg-profit/10 border border-profit/20 p-4">
          <div className="flex items-center gap-2 text-profit">
            <TrendingUp className="w-4 h-4" />
            <p className="text-xs">Winner Avg Drawdown</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-profit">{summary.winnerAvgDrawdown}%</p>
        </div>
        <div className="rounded-xl bg-loss/10 border border-loss/20 p-4">
          <div className="flex items-center gap-2 text-loss">
            <TrendingDown className="w-4 h-4" />
            <p className="text-xs">Loser Avg Drawdown</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-loss">{summary.loserAvgDrawdown}%</p>
        </div>
        <div className="rounded-xl bg-ai-accent/10 border border-ai-accent/20 p-4">
          <div className="flex items-center gap-2 text-ai-accent">
            <Clock className="w-4 h-4" />
            <p className="text-xs">Loss Holding Bias</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">{summary.lossHoldingBias}</p>
        </div>
      </div>

      <div className="rounded-xl bg-background/30 border border-border/50 p-4">
        <p className="text-sm text-foreground">
          You cut winners quickly but hold losers much longer. This is a classic "cut profits, let losses run" pattern.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          盈利单平均持仓 {summary.avgWinnerHold}，亏损单平均持仓 {summary.avgLoserHold}。盈利单平均收益 +{summary.avgWinnerPnlPct}%，亏损单平均亏损 {summary.avgLoserPnlPct}%。
        </p>
      </div>
    </div>
  )
}
