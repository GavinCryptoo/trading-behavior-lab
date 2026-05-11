"use client"

import { Crosshair, ShieldCheck, Sparkles } from "lucide-react"

interface OverallDiagnosisProps {
  mainLeak: string
  diagnosis: string
  keyFix: string
  evidence: string[]
}

export function OverallDiagnosis({ mainLeak, diagnosis, keyFix, evidence }: OverallDiagnosisProps) {
  return (
    <div className="glass-card rounded-2xl p-6 border-2 border-ai-accent/30 neon-glow-purple overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ai-accent to-transparent" />
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-ai-accent/10">
              <Crosshair className="w-5 h-5 text-ai-accent" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ai-accent">Mirror Coach Diagnosis</p>
              <h2 className="text-2xl font-bold text-foreground">Your Main Leak: {mainLeak}</h2>
            </div>
          </div>

          <p className="text-lg text-foreground mb-4">{diagnosis}</p>

          <div className="flex items-center gap-2 rounded-xl bg-profit/10 border border-profit/20 px-4 py-3 text-profit">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Key Fix: {keyFix}</span>
          </div>
        </div>

        <div className="lg:w-80 rounded-xl bg-secondary/30 border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-warning" />
            <p className="text-sm font-semibold text-foreground">Evidence Trail</p>
          </div>
          <div className="space-y-2">
            {evidence.slice(0, 4).map((item) => (
              <div key={item} className="text-xs text-muted-foreground border-l border-ai-accent/30 pl-3">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
