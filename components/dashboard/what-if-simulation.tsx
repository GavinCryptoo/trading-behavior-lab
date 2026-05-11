"use client"

import { Clock, DollarSign, Play, Shield, Trophy, TrendingUp } from "lucide-react"
import type { WhatIfSimulation as WhatIfSimulationData } from "@/src/data/mockWalletAnalysis"

interface WhatIfSimulationProps {
  simulation: WhatIfSimulationData
}

const icons = [TrendingUp, Shield, Clock, DollarSign]

function money(value: number) {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString()}`
}

export function WhatIfSimulation({ simulation }: WhatIfSimulationProps) {
  return (
    <div className="glass-card rounded-2xl p-6 neon-glow-purple">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-ai-accent/10">
            <Play className="w-5 h-5 text-ai-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">What If Replay Simulation</h3>
            <p className="text-sm text-muted-foreground">Replayed from each trade's actual price path</p>
          </div>
        </div>
        <div className="rounded-xl bg-profit/10 border border-profit/20 px-4 py-3">
          <div className="flex items-center gap-2 text-profit">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">{simulation.bestAlternativeStrategy}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Improvement potential: {money(simulation.improvementPotential)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Suggested: {simulation.suggestedPersonalStrategy}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
        <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Actual Result</p>
          <p className={`text-3xl font-bold ${simulation.actualResult.resultUsd >= 0 ? "text-profit" : "text-loss"}`}>
            {money(simulation.actualResult.resultUsd)}
          </p>
          <p className={`text-sm ${simulation.actualResult.resultPct >= 0 ? "text-profit" : "text-loss"}`}>
            {simulation.actualResult.resultPct >= 0 ? "+" : ""}{simulation.actualResult.resultPct}% replay sample return
          </p>
          <div className="mt-4 space-y-2">
            {simulation.actualResult.trades.map((trade) => (
              <div key={trade.tradeId} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{trade.token}</span>
                <span className={trade.resultPct >= 0 ? "text-profit" : "text-loss"}>
                  {trade.resultPct >= 0 ? "+" : ""}{trade.resultPct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {simulation.strategies.map((sim, index) => {
            const Icon = icons[index] ?? TrendingUp
            return (
              <div
                key={sim.id}
                className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-ai-accent/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-ai-accent/10">
                    <Icon className="w-4 h-4 text-ai-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{sim.strategy}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${sim.improvementUsd >= 0 ? "bg-profit/10 text-profit border-profit/30" : "bg-loss/10 text-loss border-loss/30"}`}>
                        {sim.improvementUsd >= 0 ? "+" : ""}{sim.improvementPct}% vs actual
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{sim.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${sim.resultUsd >= 0 ? "text-profit" : "text-loss"}`}>
                      {money(sim.resultUsd)}
                    </p>
                    <p className={`text-xs ${sim.resultPct >= 0 ? "text-profit" : "text-loss"}`}>
                      {sim.resultPct >= 0 ? "+" : ""}{sim.resultPct}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {sim.trades.map((trade) => (
                    <div key={trade.tradeId} className="rounded-lg bg-background/30 border border-border/40 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{trade.token}</span>
                        <span className={`text-xs ${trade.resultPct >= 0 ? "text-profit" : "text-loss"}`}>
                          {trade.resultPct >= 0 ? "+" : ""}{trade.resultPct}%
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground truncate">{trade.exitReason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-ai-accent/5 border border-ai-accent/20">
        <p className="text-xs text-ai-accent">
          <span className="font-medium">AI Insight:</span> {simulation.aiInsight}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Conclusion:</span> {simulation.conclusion}
        </p>
      </div>
    </div>
  )
}
