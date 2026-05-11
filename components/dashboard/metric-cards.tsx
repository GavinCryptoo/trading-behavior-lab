"use client"

import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Target, 
  Clock, 
  AlertTriangle,
  Award,
  Percent,
  UserRound
} from "lucide-react"

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  variant?: "default" | "profit" | "loss" | "warning" | "ai"
}

function MetricCard({ label, value, subValue, icon, trend, variant = "default" }: MetricCardProps) {
  const variantStyles = {
    default: "border-border/50",
    profit: "border-profit/30",
    loss: "border-loss/30",
    warning: "border-warning/30",
    ai: "border-ai-accent/30"
  }

  const valueStyles = {
    default: "text-foreground",
    profit: "text-profit",
    loss: "text-loss",
    warning: "text-warning",
    ai: "text-ai-accent"
  }

  const iconBgStyles = {
    default: "bg-secondary/50",
    profit: "bg-profit/10",
    loss: "bg-loss/10",
    warning: "bg-warning/10",
    ai: "bg-ai-accent/10"
  }

  return (
    <div className={`glass-card rounded-xl p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBgStyles[variant]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-profit" : trend === "down" ? "text-loss" : "text-muted-foreground"}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${valueStyles[variant]}`}>{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  )
}

interface MetricCardsProps {
  data: {
    totalTrades: number
    winRate: number
    realizedPnL: number
    profitCaptureRate: number
    avgHoldTime: string
    maxMissedUpside: number
    avgWinnerHold: string
    avgLoserHold: string
    tradingPersonality: string
    grade: string
  }
}

export function MetricCards({ data }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <MetricCard
        label="Total Trades"
        value={data.totalTrades}
        icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
        variant="default"
      />
      <MetricCard
        label="Win Rate"
        value={`${data.winRate}%`}
        icon={<Percent className="w-4 h-4 text-profit" />}
        variant={data.winRate >= 50 ? "profit" : "loss"}
        trend={data.winRate >= 50 ? "up" : "down"}
      />
      <MetricCard
        label="Realized PnL"
        value={`${data.realizedPnL >= 0 ? "+" : ""}$${data.realizedPnL.toLocaleString()}`}
        icon={<TrendingUp className="w-4 h-4 text-profit" />}
        variant={data.realizedPnL >= 0 ? "profit" : "loss"}
        trend={data.realizedPnL >= 0 ? "up" : "down"}
      />
      <MetricCard
        label="Profit Capture"
        value={`${data.profitCaptureRate}%`}
        subValue="of max potential"
        icon={<Target className="w-4 h-4 text-warning" />}
        variant="warning"
      />
      <MetricCard
        label="Avg Hold Time"
        value={data.avgHoldTime}
        icon={<Clock className="w-4 h-4 text-muted-foreground" />}
        variant="default"
      />
      <MetricCard
        label="Missed Upside"
        value={`+${data.maxMissedUpside}%`}
        subValue="max sell-fly"
        icon={<AlertTriangle className="w-4 h-4 text-loss" />}
        variant="loss"
      />
      <MetricCard
        label="Avg Winner Hold"
        value={data.avgWinnerHold}
        icon={<Clock className="w-4 h-4 text-profit" />}
        variant="profit"
      />
      <MetricCard
        label="Avg Loser Hold"
        value={data.avgLoserHold}
        icon={<Clock className="w-4 h-4 text-loss" />}
        variant="loss"
      />
      <MetricCard
        label="Personality"
        value={data.tradingPersonality}
        icon={<UserRound className="w-4 h-4 text-ai-accent" />}
        variant="ai"
      />
      <MetricCard
        label="Overall Grade"
        value={data.grade}
        icon={<Award className="w-4 h-4 text-ai-accent" />}
        variant="ai"
      />
    </div>
  )
}
