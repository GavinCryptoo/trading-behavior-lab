"use client"

import { BookOpen, Shield, Target, Clock } from "lucide-react"

interface PersonalizedRule {
  id: string
  title: string
  description: string
  reason?: string
  category: "entry" | "exit" | "risk" | "timing"
  priority: "critical" | "important" | "suggested"
  evidence?: string
}

interface PersonalizedRulesProps {
  rules: PersonalizedRule[]
}

export function PersonalizedRules({ rules }: PersonalizedRulesProps) {
  const categoryIcons = {
    entry: Target,
    exit: BookOpen,
    risk: Shield,
    timing: Clock
  }

  const categoryLabels = {
    entry: "Entry",
    exit: "Exit",
    risk: "Risk",
    timing: "Timing"
  }

  const priorityStyles = {
    critical: "bg-loss/10 border-loss/30 text-loss",
    important: "bg-warning/10 border-warning/30 text-warning",
    suggested: "bg-profit/10 border-profit/30 text-profit"
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-profit/10">
          <BookOpen className="w-5 h-5 text-profit" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Personalized Rules</h3>
          <p className="text-sm text-muted-foreground">AI-generated rules based on your patterns</p>
        </div>
      </div>
      
      <div className="grid gap-3">
        {rules.map((rule) => {
          const Icon = categoryIcons[rule.category]
          return (
            <div 
              key={rule.id}
              className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-secondary">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{rule.title}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${priorityStyles[rule.priority]}`}>
                    {rule.priority}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">
                    {categoryLabels[rule.category]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
                {rule.reason && (
                  <p className="mt-2 text-xs text-foreground/80">Reason: {rule.reason}</p>
                )}
                {rule.evidence && (
                  <p className="mt-2 text-xs text-foreground/70">Why: {rule.evidence}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
