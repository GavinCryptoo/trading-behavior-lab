"use client"

import { Activity, Check, LineChart, Share2, ShieldCheck, Wallet } from "lucide-react"

type Language = "en" | "zh"

interface HackathonPolishProps {
  language: Language
}

const demoSteps = [
  {
    icon: Wallet,
    en: "Enter wallet + token",
    zh: "输入钱包 + 代币",
  },
  {
    icon: Activity,
    en: "Fetch Bitget-powered market/security/context data",
    zh: "读取 Bitget 市场 / 安全 / 上下文数据",
  },
  {
    icon: LineChart,
    en: "Replay trading behavior",
    zh: "复盘交易行为",
  },
  {
    icon: Share2,
    en: "Generate behavior report",
    zh: "生成行为报告",
  },
]

const safetyItems = [
  { en: "No auto-trading", zh: "不自动交易" },
  { en: "No private keys", zh: "不接触私钥" },
  { en: "No transaction signing", zh: "不签名交易" },
  { en: "Quote preview only", zh: "仅报价预览" },
  { en: "Human-in-the-loop design", zh: "人工确认设计" },
]

export function HackathonDemoFlow({ language }: HackathonPolishProps) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">{language === "zh" ? "黑客松演示流程" : "Hackathon Demo Flow"}</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {language === "zh" ? "评委 4 步快速看懂" : "Four-step reviewer flow"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border/50 bg-secondary/40 px-3 py-1 text-muted-foreground">
            {language === "zh" ? "默认：模拟演示" : "Default: Mock Demo"}
          </span>
          <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-warning">
            {language === "zh" ? "显示部分数据状态" : "Partial Data shown"}
          </span>
          <span className="rounded-full border border-ai-accent/30 bg-ai-accent/10 px-3 py-1 text-ai-accent">
            {language === "zh" ? "标注兜底模式" : "Fallback Mode labeled"}
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {demoSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.en} className="rounded-xl border border-border/50 bg-secondary/30 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">0{index + 1}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{language === "zh" ? step.zh : step.en}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function SafetyNotice({ language }: HackathonPolishProps) {
  return (
    <section className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-warning/30 bg-background/40 text-warning">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-warning">{language === "zh" ? "安全提示" : "Safety Notice"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === "zh"
              ? "交易行为实验室只做回顾分析和报价预览，不执行任何资金移动操作。"
              : "Trading Behavior Lab is retrospective analysis with quote preview only. It does not move funds."}
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {safetyItems.map((item) => (
              <div key={item.en} className="flex items-center gap-2 rounded-lg border border-warning/20 bg-background/30 px-3 py-2 text-xs text-warning">
                <Check className="h-3.5 w-3.5" />
                <span>{language === "zh" ? item.zh : item.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
