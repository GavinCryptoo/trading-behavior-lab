"use client"

import { Brain, Sparkles } from "lucide-react"
import type { TradingPersonality as TradingPersonalityData } from "@/src/data/mockWalletAnalysis"

interface TradingPersonalityProps {
  personality: TradingPersonalityData
}

export function TradingPersonality({ personality }: TradingPersonalityProps) {
  return (
    <div className="glass-card rounded-2xl p-6 neon-glow-purple">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-ai-accent/10">
          <Brain className="w-5 h-5 text-ai-accent" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Trading Personality</h3>
          <Sparkles className="w-4 h-4 text-ai-accent" />
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-ai-accent/20 border border-ai-accent/30">
          <Sparkles className="w-6 h-6 text-ai-accent" />
        </div>
        <div className="flex-1">
          <h4 className="text-2xl font-bold gradient-text mb-2">{personality.type}</h4>
          <p className="text-sm text-muted-foreground mb-4">
            <span className="text-foreground font-medium">Explanation:</span> {personality.explanation}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            <span className="text-foreground font-medium">你的交易人格：{personality.chineseType}</span><br />
            {personality.chineseExplanation}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {personality.traits.map((trait, index) => (
              <span 
                key={index}
                className="px-3 py-1 text-xs font-medium rounded-full bg-ai-accent/10 text-ai-accent border border-ai-accent/20"
              >
                {trait}
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-secondary/30 border border-border/50 p-4">
            <p className="text-xs uppercase tracking-widest text-ai-accent mb-3">Evidence</p>
            <div className="grid gap-2">
              {personality.evidence.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ai-accent shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
