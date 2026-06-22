"use client"

import { Activity, BarChart3, FileWarning, ShieldAlert, Users, WalletCards } from "lucide-react"
import type { DataCoverageStatus, DataSource, WalletAnalysis } from "@/src/data/mockWalletAnalysis"

type Language = "en" | "zh"

interface BitgetContextCardsProps {
  analysis: WalletAnalysis
  dataSource: DataSource
  sourceMessage: string
  language: Language
}

function formatUsd(value: number | undefined, language: Language) {
  if (!Number.isFinite(value)) return language === "zh" ? "暂无" : "N/A"
  if (Math.abs(value as number) >= 1_000_000_000) return `$${((value as number) / 1_000_000_000).toFixed(2)}B`
  if (Math.abs(value as number) >= 1_000_000) return `$${((value as number) / 1_000_000).toFixed(2)}M`
  if (Math.abs(value as number) >= 1_000) return `$${((value as number) / 1_000).toFixed(1)}K`
  if ((value as number) > 0 && (value as number) < 0.01) return `$${(value as number).toPrecision(4)}`
  return `$${(value as number).toLocaleString()}`
}

function coverageText(status?: boolean, language: Language = "en") {
  if (status) return language === "zh" ? "可用" : "available"
  return language === "zh" ? "缺失" : "missing"
}

function coverageTone(status?: boolean) {
  return status ? "border-profit/20 bg-profit/10 text-profit" : "border-warning/20 bg-warning/10 text-warning"
}

function sourceLabel(analysis: WalletAnalysis, dataSource: DataSource, language: Language) {
  if (analysis.dataCoverage === "mock_fallback" && dataSource === "bitget") return language === "zh" ? "已请求 Bitget · 兜底模式" : "Bitget requested · Fallback Mode"
  if (analysis.dataCoverage === "mock_fallback" && dataSource === "mock") return language === "zh" ? "模拟演示 · 兜底模式" : "Mock Demo · Fallback Mode"
  if (analysis.dataCoverage === "partial" && dataSource === "bitget") return language === "zh" ? "Bitget 实时数据 · 部分数据" : "Bitget Live Data · Partial Data"
  if (dataSource === "bitget") return analysis.dataCoverage === "partial" ? (language === "zh" ? "Bitget 实时数据 · 部分数据" : "Bitget Live Data · Partial Data") : (language === "zh" ? "Bitget 实时数据" : "Bitget Live Data")
  if (dataSource === "okx") return language === "zh" ? "OKX 数据" : "OKX Data"
  return language === "zh" ? "模拟演示" : "Mock Demo"
}

function coverageLabel(value: WalletAnalysis["dataCoverage"], language: Language) {
  if (language !== "zh") return value
  const labels: Record<WalletAnalysis["dataCoverage"], string> = {
    full: "完整数据",
    partial: "部分数据",
    mock_fallback: "模拟兜底",
    unsupported: "暂不支持",
  }
  return labels[value]
}

function sourceMessageText(message: string, language: Language) {
  if (language !== "zh") return message
  if (message.includes("Mock Demo Mode is active")) return "当前为模拟演示模式，未请求 Bitget 或 OKX 实时接口。"
  if (message.includes("Bitget Wallet Skill data was used where available")) return "已使用可用的 Bitget Wallet Skill 数据；不完整的数据会在页面中标注。"
  if (message.includes("Bitget Wallet Skill data was used for token replay")) return "已使用 Bitget Wallet Skill 数据生成单币复盘和行为分析。"
  return "实时数据暂不可用或不完整，当前已展示可用结果与数据覆盖范围。"
}

function riskText(value: string | undefined, language: Language) {
  if (language !== "zh") return value ?? "unknown"
  const labels: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    unknown: "未知",
  }
  return labels[value ?? "unknown"] ?? value ?? "未知"
}

function phraseText(value: string | undefined, language: Language) {
  if (!value) return language === "zh" ? "暂无数据" : "N/A"
  if (language !== "zh") return value
  const labels: Record<string, string> = {
    "positive expansion": "动能扩张",
    "negative drift": "下跌漂移",
    "range or insufficient movement": "震荡或动能不足",
    "deep enough for demo sizing": "演示仓位流动性充足",
    "liquid enough for small review sample": "小额复盘样本流动性充足",
    "thin liquidity": "流动性较薄",
    "unknown liquidity": "流动性未知",
    "high volatility": "高波动",
    "moderate volatility": "中等波动",
    "low or unknown volatility": "低波动或未知",
    "net buying": "净买入",
    "continued buying": "持续买入",
    "net selling": "净卖出",
    mixed: "多空混合",
    unknown: "未知",
    "no complete user trade": "没有完整用户交易",
    "sold full position": "全部卖出",
    "momentum discussion increased": "动能讨论升温",
  }
  return labels[value] ?? "已获取相关数据"
}

function sentenceText(value: string | undefined, language: Language) {
  if (!value) return language === "zh" ? "暂无数据。" : "No data available."
  if (language !== "zh") return value
  if (value.includes("Demo fallback security context")) return "当前为模拟兜底安全上下文。真实 Bitget 模式会用 Wallet Skill 的代币安全数据替换。"
  if (value.includes("Demo fallback holder context")) return "当前为模拟兜底持有人上下文，显示中等集中度；行为评分会考虑仓位风险。"
  if (value.includes("The demo wallet exited while smart money")) return "模拟钱包在聪明钱和 KOL 动能尚未冷却时离场，形成卖飞模式。"
  if (value.includes("No security summary available")) return "暂无安全摘要。"
  if (value.includes("No holder diagnosis available")) return "暂无持有人诊断。"
  if (value.includes("No smart money or KOL markers")) return "暂无聪明钱或 KOL 标记。"
  if (value.includes("Quote preview data is unavailable")) return "当前模式暂无报价预览数据。"
  return "已获取相关分析数据。"
}

function warningText(value: string, language: Language) {
  if (language !== "zh") return value
  if (value.includes("Demo fallback data")) return "当前显示模拟兜底数据。"
  if (value.includes("No live Bitget Wallet Skill request was made")) return "未请求 Bitget Wallet Skill 实时接口。"
  if (value.includes("data is missing")) return "部分数据缺失或当前请求不可用。"
  return "当前数据存在缺口，已在数据覆盖范围中标注。"
}

function flagText(value: string, language: Language) {
  if (language !== "zh") return value
  const labels: Record<string, string> = {
    demo_security_context: "模拟安全上下文",
    "holder concentration should be checked before sizing": "建仓前需检查持有人集中度",
    security_data_missing: "安全数据缺失",
    no_major_security_flags_normalized: "未识别到主要安全风险",
  }
  return labels[value] ?? "风险标记"
}

function DataSourceBadge({ analysis, dataSource, sourceMessage, language }: BitgetContextCardsProps) {
  const tone = analysis.dataCoverage === "full"
    ? "border-profit/30 bg-profit/10 text-profit"
    : analysis.dataCoverage === "partial"
      ? "border-warning/30 bg-warning/10 text-warning"
      : "border-border/50 bg-secondary/40 text-muted-foreground"

  return (
    <div className={`rounded-2xl border px-5 py-4 text-sm ${tone}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <WalletCards className="h-4 w-4" />
          <span className="font-semibold">{sourceLabel(analysis, dataSource, language)}</span>
          <span className="text-xs opacity-80">({coverageLabel(analysis.dataCoverage, language)})</span>
        </div>
        <span className="text-xs opacity-90">{sourceMessageText(sourceMessage, language)}</span>
      </div>
    </div>
  )
}

function MarketContextCard({ analysis, language }: { analysis: WalletAnalysis; language: Language }) {
  const context = analysis.bitgetMeta?.marketContext
  const title = language === "zh" ? "Bitget 市场上下文" : "Bitget Market Context"
  const items = [
    [language === "zh" ? "代币价格" : "Token Price", formatUsd(context?.tokenPrice, language)],
    [language === "zh" ? "市值" : "Market Cap", formatUsd(context?.marketCap, language)],
    [language === "zh" ? "流动性" : "Liquidity", formatUsd(context?.liquidity, language)],
    [language === "zh" ? "成交量" : "Volume", formatUsd(context?.volume24h, language)],
    [language === "zh" ? "买压" : "Buy Pressure", context?.buyPressure !== undefined ? `${context.buyPressure}%` : language === "zh" ? "暂无" : "N/A"],
    [language === "zh" ? "卖压" : "Sell Pressure", context?.sellPressure !== undefined ? `${context.sellPressure}%` : language === "zh" ? "暂无" : "N/A"],
  ]

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-lg border border-ai-accent/20 bg-ai-accent/10 p-3 text-xs text-ai-accent">
        {context ? `${phraseText(context.momentumState, language)} · ${phraseText(context.liquidityState, language)} · ${phraseText(context.volatilityState, language)}` : language === "zh" ? "市场上下文缺失。" : "Market context is missing."}
      </p>
    </div>
  )
}

function SecurityHolderRiskCard({ analysis, language }: { analysis: WalletAnalysis; language: Language }) {
  const security = analysis.bitgetMeta?.securitySummary
  const holder = analysis.bitgetMeta?.holderSummary

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">{language === "zh" ? "安全与持有人风险" : "Security & Holder Risk"}</h3>
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground">{language === "zh" ? "安全风险等级" : "Security risk level"}</p>
          <p className="mt-1 font-semibold text-foreground">{riskText(security?.riskLevel, language)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{sentenceText(security?.plainEnglishSummary ?? "No security summary available.", language)}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground">{language === "zh" ? "持有人集中度" : "Holder concentration"}</p>
          <p className="mt-1 font-semibold text-foreground">{riskText(holder?.topHolderConcentrationLevel, language)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{sentenceText(holder?.diagnosis ?? "No holder diagnosis available.", language)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(security?.riskFlags ?? ["security_data_missing"]).map((flag) => (
          <span key={flag} className="rounded-full border border-warning/20 bg-warning/10 px-2 py-1 text-xs text-warning">{flagText(flag, language)}</span>
        ))}
      </div>
    </div>
  )
}

function SmartMoneyContrastCard({ analysis, language }: { analysis: WalletAnalysis; language: Language }) {
  const contrast = analysis.bitgetMeta?.smartMoneySummary

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-ai-accent" />
        <h3 className="text-sm font-semibold text-foreground">{language === "zh" ? "聪明钱 / KOL 对比" : "Smart Money Contrast"}</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground">{language === "zh" ? "用户动作" : "User action"}</p>
          <p className="mt-1 font-semibold text-foreground">{phraseText(contrast?.userAction, language)}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground">{language === "zh" ? "一致性评分" : "Alignment"}</p>
          <p className="mt-1 font-semibold text-foreground">{contrast?.alignmentScore ?? 50}/100</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground">{language === "zh" ? "聪明钱动作" : "Smart money"}</p>
          <p className="mt-1 font-semibold text-foreground">{phraseText(contrast?.smartMoneyAction, language)}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground">{language === "zh" ? "KOL 动作" : "KOL action"}</p>
          <p className="mt-1 font-semibold text-foreground">{phraseText(contrast?.kolAction, language)}</p>
        </div>
      </div>
      <p className="mt-4 rounded-lg border border-ai-accent/20 bg-ai-accent/10 p-3 text-xs text-ai-accent">
        {sentenceText(contrast?.diagnosis ?? "No smart money or KOL markers available.", language)}
      </p>
    </div>
  )
}

function DataCoverageCard({ analysis, language }: { analysis: WalletAnalysis; language: Language }) {
  const status: DataCoverageStatus = analysis.bitgetMeta?.dataCoverageStatus ?? {
    tokenInfo: analysis.dataSource === "mock",
    kline: analysis.dataSource === "mock",
    walletTransactions: analysis.dataSource === "mock",
    security: analysis.dataSource === "mock",
    holders: analysis.dataSource === "mock",
    smartMoneyMarkers: analysis.dataSource === "mock",
  }
  const items: Array<[keyof DataCoverageStatus, string]> = [
    ["tokenInfo", language === "zh" ? "代币信息" : "Token info"],
    ["kline", language === "zh" ? "K线" : "Kline"],
    ["walletTransactions", language === "zh" ? "钱包交易" : "Wallet transactions"],
    ["security", language === "zh" ? "安全数据" : "Security"],
    ["holders", language === "zh" ? "持有人数据" : "Holders"],
    ["smartMoneyMarkers", language === "zh" ? "聪明钱标记" : "Smart money markers"],
  ]

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <FileWarning className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">{language === "zh" ? "数据覆盖范围" : "Data Coverage"}</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {items.map(([key, label]) => (
          <div key={key} className={`rounded-lg border px-3 py-2 text-xs ${coverageTone(status[key])}`}>
            <span className="font-medium">{label}: </span>{coverageText(status[key], language)}
          </div>
        ))}
      </div>
      {analysis.bitgetMeta?.warnings?.length ? (
        <div className="mt-4 space-y-2">
          {analysis.bitgetMeta.warnings.slice(0, 4).map((warning) => (
            <p key={warning} className="text-xs text-muted-foreground">{warningText(warning, language)}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function QuotePreviewCard({ analysis, language }: { analysis: WalletAnalysis; language: Language }) {
  if (!analysis.bitgetMeta?.tokenAddress) return null

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{language === "zh" ? "Bitget 报价预览" : "Bitget Quote Preview"}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {language === "zh"
          ? "如果用户想交易，Bitget Wallet Skill 可以提供报价预览；本工具只展示报价，不执行交易。"
          : "If you wanted to trade, Bitget Wallet Skill can provide a quote preview. This lab only displays quotes and never executes trades."}
      </p>
      <button
        type="button"
        disabled
        className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-70"
      >
        {language === "zh" ? "预览报价" : "Preview Quote"}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        {analysis.bitgetMeta.quotePreview ? (language === "zh" ? "已有报价预览数据，当前仅用于展示，不会执行交易。" : JSON.stringify(analysis.bitgetMeta.quotePreview).slice(0, 180)) : sentenceText("Quote preview data is unavailable in the current mode.", language)}
      </p>
    </div>
  )
}

export function BitgetContextCards(props: BitgetContextCardsProps) {
  return (
    <div className="space-y-4">
      <DataSourceBadge {...props} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MarketContextCard analysis={props.analysis} language={props.language} />
        <SecurityHolderRiskCard analysis={props.analysis} language={props.language} />
        <SmartMoneyContrastCard analysis={props.analysis} language={props.language} />
        <DataCoverageCard analysis={props.analysis} language={props.language} />
        <QuotePreviewCard analysis={props.analysis} language={props.language} />
      </div>
    </div>
  )
}
