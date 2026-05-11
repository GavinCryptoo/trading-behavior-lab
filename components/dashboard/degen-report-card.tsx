"use client"

import { Share2, Twitter, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DegenReportCardProps {
  walletAddress: string
  grade: string
  personality: string
  stats: {
    totalTrades: number
    winRate: number
    realizedPnL: number
    profitCapture: number
    avgWinnerHold: string
    avgLoserHold: string
  }
  topLeak: string
  suggestedFix: string
  mirrorRoast: string
  bestTrade: {
    token: string
    pnl: number
  }
}

export function DegenReportCard({ walletAddress, grade, personality, stats, topLeak, suggestedFix, mirrorRoast, bestTrade }: DegenReportCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const shareText = `My Trading Behavior Lab Report Card

Grade: ${grade}
Personality: ${personality}
Win Rate: ${stats.winRate}%
Profit Capture: ${stats.profitCapture}%
Avg Winner Hold: ${stats.avgWinnerHold}
Avg Loser Hold: ${stats.avgLoserHold}
PnL: ${stats.realizedPnL >= 0 ? "+" : ""}$${stats.realizedPnL.toLocaleString()}
Top Leak: ${topLeak}
Suggested Fix: ${suggestedFix}
Mirror Roast: ${mirrorRoast}
Best Trade: ${bestTrade.token} (+$${bestTrade.pnl.toLocaleString()})

Analyze your trades at Trading Behavior Lab`
    
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTwitterShare = () => {
    const shareText = encodeURIComponent(`My Trading Behavior Lab Report Card

Grade: ${grade} | Win Rate: ${stats.winRate}%
PnL: ${stats.realizedPnL >= 0 ? "+" : ""}$${stats.realizedPnL.toLocaleString()}

Review your trading behavior with Trading Behavior Lab`)
    
    window.open(`https://twitter.com/intent/tweet?text=${shareText}`, "_blank")
  }

  return (
    <div className="glass-card rounded-2xl p-6 border-2 border-primary/30 neon-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Trading Behavior Report Card</h3>
            <p className="text-sm text-muted-foreground">Replay receipt, biggest leak, and coach fix</p>
          </div>
        </div>
      </div>

      {/* Card Preview */}
      <div className="relative mb-6 p-6 rounded-xl bg-gradient-to-br from-[#0a1a0f] to-[#0f1f14] border border-primary/20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-ai-accent/5 rounded-full blur-2xl" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Trading Behavior Lab</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </div>
          </div>

          {/* Grade */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-ai-accent/20 border-2 border-primary/40 mb-2">
              <span className="text-4xl font-bold gradient-text">{grade}</span>
            </div>
            <p className="text-sm text-muted-foreground">{personality}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-foreground">{stats.totalTrades}</p>
              <p className="text-xs text-muted-foreground">Trades</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-profit">{stats.winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className={`text-2xl font-bold ${stats.realizedPnL >= 0 ? "text-profit" : "text-loss"}`}>
                {stats.realizedPnL >= 0 ? "+" : ""}${Math.abs(stats.realizedPnL).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">PnL</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-warning">{stats.profitCapture}%</p>
              <p className="text-xs text-muted-foreground">Capture</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-profit">{stats.avgWinnerHold}</p>
              <p className="text-xs text-muted-foreground">Avg Winner Hold</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-loss">{stats.avgLoserHold}</p>
              <p className="text-xs text-muted-foreground">Avg Loser Hold</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-loss/10 border border-loss/20">
              <p className="text-xs text-loss font-medium">Biggest Leak: {topLeak}</p>
            </div>
            <div className="p-3 rounded-lg bg-profit/10 border border-profit/20">
              <p className="text-xs text-profit font-medium">Suggested Fix: {suggestedFix}</p>
            </div>
            <div className="p-3 rounded-lg bg-ai-accent/10 border border-ai-accent/20">
              <p className="text-xs text-ai-accent font-medium">Mirror Roast</p>
              <p className="mt-1 text-sm text-foreground">{mirrorRoast}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={handleTwitterShare}
          className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Share on X
        </Button>
        <Button 
          onClick={handleCopy}
          variant="outline"
          className="flex-1 border-border/50 hover:bg-secondary/50"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-profit" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Text
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
