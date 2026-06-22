"use client"

import { useState } from "react"
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronDown, Info, LineChart, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PricePathPoint, TradeReplay } from "@/src/data/mockWalletAnalysis"
import { simulateTradeWithStrategy } from "@/src/lib/analysis/whatIfSimulation"

interface TradeReplayCardsProps {
  trades: TradeReplay[]
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-profit bg-profit/10 border-profit/30"
    if (value >= 60) return "text-warning bg-warning/10 border-warning/30"
    return "text-loss bg-loss/10 border-loss/30"
  }

  return (
    <div className={`px-2 py-1 rounded-lg border ${getScoreColor(score)}`}>
      <span className="text-xs font-medium">{label}: {score}</span>
    </div>
  )
}

function MiniPricePath({ path }: { path: PricePathPoint[] }) {
  const width = 220
  const height = 64
  const min = Math.min(-30, ...path.map((point) => point.pnlPct))
  const max = Math.max(100, ...path.map((point) => point.pnlPct))
  const maxMinute = Math.max(...path.map((point) => point.minute), 1)
  const range = Math.max(max - min, 1)
  const points = path
    .map((point) => {
      const x = (point.minute / maxMinute) * width
      const y = height - ((point.pnlPct - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")
  const zeroY = height - ((0 - min) / range) * height

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full overflow-visible">
      <line x1="0" x2={width} y1={zeroY} y2={zeroY} className="stroke-border" strokeDasharray="4 4" />
      <polyline points={points} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {path.map((point) => {
        const x = (point.minute / maxMinute) * width
        const y = height - ((point.pnlPct - min) / range) * height
        return <circle key={`${point.minute}-${point.pnlPct}`} cx={x} cy={y} r="2.5" className={point.pnlPct >= 0 ? "fill-profit" : "fill-loss"} />
      })}
    </svg>
  )
}

function formatTokenPrice(value: number) {
  if (!Number.isFinite(value)) return "Missing"
  if (value === 0) return "≈$0"
  if (value < 0.000001) return `$${value.toPrecision(4)}`
  if (value < 0.01) return `$${value.toFixed(8)}`
  return `$${value.toFixed(6)}`
}

function formatPnlPct(value: number) {
  if (Math.abs(value) < 0.05) return "≈0%"
  return `${value > 0 ? "+" : ""}${value}%`
}

function pnlTone(value: number) {
  if (Math.abs(value) < 0.05) return "text-muted-foreground"
  return value > 0 ? "text-profit" : "text-loss"
}

function TradeCard({ trade }: { trade: TradeReplay }) {
  const [expanded, setExpanded] = useState(false)
  const mainMistake = trade.mistakeTags[0] ?? "No Major Mistake"
  const singleTradeWhatIf = [
    simulateTradeWithStrategy(trade, "stagedTakeProfit"),
    simulateTradeWithStrategy(trade, "trailingStop"),
    simulateTradeWithStrategy(trade, "timeStop"),
    simulateTradeWithStrategy(trade, "capitalProtection"),
  ]
  const best = singleTradeWhatIf.reduce((bestResult, current) => current.resultUsd > bestResult.resultUsd ? current : bestResult, singleTradeWhatIf[0])

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-ai-accent/20 flex items-center justify-center text-lg font-bold">
            {trade.token.symbol.slice(0, 2)}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{trade.token.symbol}</h4>
            <p className="text-xs text-muted-foreground">{trade.token.name} · held {trade.holdDurationMin}m</p>
            <p className="text-[11px] text-muted-foreground font-mono">{trade.tokenAddress.slice(0, 6)}...{trade.tokenAddress.slice(-6)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-lg font-bold ${trade.realizedPnlUsd >= 0 ? "text-profit" : "text-loss"}`}>
            {trade.realizedPnlUsd >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            ${Math.abs(trade.realizedPnlUsd).toLocaleString()}
          </div>
          <p className={`text-xs ${pnlTone(trade.realizedPnlPct)}`}>
            {formatPnlPct(trade.realizedPnlPct)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 mb-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Buy Price</p>
              <p className="text-sm font-mono text-foreground">{formatTokenPrice(trade.buyPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sell Price</p>
              <p className="text-sm font-mono text-foreground">{formatTokenPrice(trade.sellPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Max Upside</p>
              <p className={`text-sm font-mono ${pnlTone(trade.maxUpsidePct)}`}>{formatPnlPct(trade.maxUpsidePct)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
              <p className="text-sm font-mono text-loss">-{trade.maxDrawdownPct}%</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/30 border border-border/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Diagnosis</p>
              <p className="text-sm text-foreground">{trade.diagnosis}</p>
              <p className="mt-2 text-xs text-muted-foreground">{trade.chineseDiagnosis}</p>
            </div>
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-xs text-warning mb-1">Main Mistake</p>
              <p className="text-sm font-semibold text-warning">{mainMistake}</p>
            </div>
            <div className="rounded-lg bg-profit/10 border border-profit/20 p-3">
              <p className="text-xs text-profit mb-1">Suggested Fix</p>
              <p className="text-sm text-foreground">{trade.suggestedFix}</p>
            </div>
          </div>
          {(trade.smartMoneyAtEntry || trade.securityRisk || trade.holderRiskAtEntry || trade.marketContextDiagnosis) ? (
            <div className="grid md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-ai-accent/10 border border-ai-accent/20 p-3">
                <p className="text-xs text-ai-accent mb-1">Smart Money</p>
                <p className="text-sm text-foreground">{trade.smartMoneyAtEntry ?? "unknown"}</p>
              </div>
              <div className="rounded-lg bg-ai-accent/10 border border-ai-accent/20 p-3">
                <p className="text-xs text-ai-accent mb-1">KOL</p>
                <p className="text-sm text-foreground">{trade.kolAtEntry ?? "unknown"}</p>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
                <p className="text-xs text-warning mb-1">Holder / Security</p>
                <p className="text-sm text-foreground">{trade.holderRiskAtEntry ?? "unknown"} / {trade.securityRisk ?? "unknown"}</p>
              </div>
              <div className="rounded-lg bg-background/30 border border-border/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Market Context</p>
                <p className="text-sm text-foreground">{trade.marketContextDiagnosis ?? "not available"}</p>
              </div>
            </div>
          ) : null}
          {trade.profitGivebackPct ? (
            <div className="rounded-lg bg-loss/10 border border-loss/20 p-3">
              <p className="text-xs text-loss mb-1">Profit Giveback</p>
              <p className="text-sm text-foreground">
                This trade once had meaningful unrealized profit, but ended as a loss. Giveback: {trade.profitGivebackPct} percentage points.
              </p>
            </div>
          ) : null}
          {Math.abs(trade.realizedPnlPct) < 0.05 ? (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-xs text-warning mb-1">Near Breakeven</p>
              <p className="text-sm text-foreground">This is not a profitable trade. The realized move rounds to about 0% because the token price is extremely small or the sampled buy/sell prices are nearly equal.</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl bg-background/30 border border-border/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Mini Price Path</span>
            </div>
            <span className="text-xs text-warning">{trade.profitCaptureRate}% capture</span>
          </div>
          <MiniPricePath path={trade.pricePath} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ScoreBadge score={trade.entryScore} label="Entry" />
        <ScoreBadge score={trade.exitScore} label="Exit" />
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-ai-accent/10 border border-ai-accent/30 text-ai-accent">
          <Target className="w-3 h-3" />
          <span className="text-xs font-medium">Capture: {trade.profitCaptureRate}%</span>
        </div>
        {trade.mistakeTags.map((tag) => (
          <div key={tag} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 border border-warning/30 text-warning">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs font-medium">{tag}</span>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          Details
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50 grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl bg-background/30 border border-border/40 p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Replay Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Buy Time</p>
                <p className="text-foreground">{trade.buyTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sell Time</p>
                <p className="text-foreground">{trade.sellTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Post-buy High</p>
                <p className={pnlTone(trade.postBuyHighPct)}>{formatPnlPct(trade.postBuyHighPct)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Post-buy Low</p>
                <p className="text-loss">{trade.postBuyLowPct}%</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Exit Aftermath: {trade.exitAftermath}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Path ended at {trade.pricePath[trade.pricePath.length - 1]?.pnlPct ?? 0}% after {trade.pricePath[trade.pricePath.length - 1]?.minute ?? 0} minutes.
            </p>
          </div>

          <div className="rounded-xl bg-background/30 border border-border/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Single Trade What If</p>
              <span className={`text-xs ${pnlTone(best.resultPct)}`}>Best: {formatPnlPct(best.resultPct)}</span>
            </div>
            <div className="space-y-2">
              {singleTradeWhatIf.map((result, index) => (
                <div key={`${result.tradeId}-${index}`} className="flex items-center justify-between gap-3 text-xs rounded-lg bg-secondary/30 px-3 py-2">
                  <span className="text-muted-foreground">{["A Staged TP", "B Trailing", "C Time Stop", "D Protection"][index]}</span>
                  <span className={pnlTone(result.resultPct)}>
                    {formatPnlPct(result.resultPct)} · {result.exitReason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TradeReplayCards({ trades }: TradeReplayCardsProps) {
  const pageSize = 5
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedTrades = trades.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ArrowUpRight className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Trade Replay Coach</h3>
            <p className="text-sm text-muted-foreground">Diagnosis, mistake, fix, and per-trade simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>{trades.length} trades analyzed</span>
        </div>
      </div>

      {!trades.length ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning">
          No replayable buy/sell pair was reconstructed for this request. The app is showing the data gap instead of inventing trades.
        </div>
      ) : null}

      <div className="space-y-4">
        {pagedTrades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {safePage} / {totalPages}, showing {trades.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, trades.length)} of {trades.length} replay cards.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={safePage === 1}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={safePage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
