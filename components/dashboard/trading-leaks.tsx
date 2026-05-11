"use client"

import { AlertCircle, TrendingDown, Zap } from "lucide-react"

interface TradingLeak {
  id: string
  title: string
  chineseTitle?: string
  description: string
  impact: string
  frequency: number
  severity: "high" | "medium" | "low"
  evidence?: string
  recommendation?: string
}

interface TradingLeaksProps {
  leaks: TradingLeak[]
}

export function TradingLeaks({ leaks }: TradingLeaksProps) {
  const severityStyles = {
    high: {
      bg: "bg-loss/10",
      border: "border-loss/30",
      text: "text-loss",
      badge: "bg-loss/20 text-loss"
    },
    medium: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-warning",
      badge: "bg-warning/20 text-warning"
    },
    low: {
      bg: "bg-muted/50",
      border: "border-border/50",
      text: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-loss/10">
          <AlertCircle className="w-5 h-5 text-loss" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top Trading Leaks</h3>
          <p className="text-sm text-muted-foreground">Issues costing you the most profit</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {leaks.map((leak, index) => {
          const styles = severityStyles[leak.severity]
          return (
            <div 
              key={leak.id}
              className={`p-4 rounded-xl ${styles.bg} border ${styles.border}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-bold text-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${styles.text}`}>{leak.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${styles.badge}`}>
                        {leak.severity}
                      </span>
                    </div>
                    {leak.chineseTitle && <p className="text-xs text-muted-foreground mb-1">{leak.chineseTitle}</p>}
                    <p className="text-sm text-muted-foreground mb-2">{leak.description}</p>
                    {leak.evidence && (
                      <p className="text-xs text-foreground/80 mb-2">Evidence: {leak.evidence}</p>
                    )}
                    {leak.recommendation && (
                      <p className="text-xs text-profit mb-2">Fix: {leak.recommendation}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-loss">
                        <TrendingDown className="w-3 h-3" />
                        Impact: {leak.impact}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        {leak.frequency}x occurrences
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
