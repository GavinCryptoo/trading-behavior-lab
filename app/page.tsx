"use client"

import { useEffect, useMemo, useState } from "react"
import { FileWarning } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { WalletInput } from "@/components/dashboard/wallet-input"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { OverallDiagnosis } from "@/components/dashboard/overall-diagnosis"
import { TradingPersonality } from "@/components/dashboard/trading-personality"
import { DrawdownBehavior } from "@/components/dashboard/drawdown-behavior"
import { TradingLeaks } from "@/components/dashboard/trading-leaks"
import { PersonalizedRules } from "@/components/dashboard/personalized-rules"
import { TradeReplayCards } from "@/components/dashboard/trade-replay-cards"
import { WhatIfSimulation } from "@/components/dashboard/what-if-simulation"
import { DegenReportCard } from "@/components/dashboard/degen-report-card"
import { BitgetContextCards } from "@/components/dashboard/bitget-context-cards"
import { HackathonDemoFlow, SafetyNotice } from "@/components/dashboard/hackathon-polish"
import { mockWalletAnalysis } from "@/src/data/mockWalletAnalysis"
import type { AnalysisMode, DataSource, WalletAnalysis } from "@/src/data/mockWalletAnalysis"
import { buildWhatIfSimulation } from "@/src/lib/analysis/whatIfSimulation"
import { analyzeTradingPersonality } from "@/src/lib/analysis/tradingPersonality"
import { analyzeTradingLeaks } from "@/src/lib/analysis/tradingLeaks"
import { buildPersonalizedRules } from "@/src/lib/analysis/personalizedRules"
import { getAverageProfitCapture } from "@/src/lib/analysis/profitCapture"
import { analyzeDrawdownBehavior } from "@/src/lib/analysis/drawdownBehavior"
import { generateReportCard } from "@/src/lib/analysis/reportCard"

type Language = "en" | "zh"
type AnalysisStatus = "idle" | "loading" | "success" | "error"
type AnalyzeWalletResponse = {
  ok: boolean
  dataSource: DataSource
  dataCoverage: WalletAnalysis["dataCoverage"]
  source: DataSource
  message: string
  error?: string
  analysis: WalletAnalysis
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function money(value: number) {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString()}`
}

function formatTokenPrice(value: number) {
  if (!Number.isFinite(value)) return "价格缺失"
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

function zhHold(value: string) {
  return value.replace("m", "分钟").replace("h", "小时")
}

function ZhMetric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "profit" | "loss" | "warning" | "ai" }) {
  const toneClass = {
    default: "text-foreground",
    profit: "text-profit",
    loss: "text-loss",
    warning: "text-warning",
    ai: "text-ai-accent",
  }[tone]

  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}

function strategyName(id: string) {
  const names: Record<string, string> = {
    stagedTakeProfit: "分批止盈策略",
    trailingStop: "移动止盈策略",
    timeStop: "时间止损策略",
    capitalProtection: "利润保护策略",
  }
  return names[id] ?? "实际结果"
}

function strategyReason(id: string) {
  const reasons: Record<string, string> = {
    stagedTakeProfit: "适合经常抓到上涨但卖得过早的钱包。",
    trailingStop: "适合入场不错但缺少趋势退出纪律的钱包。",
    timeStop: "减少低动能交易拖成长期亏损单。",
    capitalProtection: "防止大额浮盈回吐成小赚或亏损。",
  }
  return reasons[id] ?? "真实卖出结果。"
}

function AnalysisLoadingPanel({ elapsedSeconds, language }: { elapsedSeconds: number; language: Language }) {
  const steps = ["连接 Bitget Wallet Skill", "读取代币 / 钱包上下文", "拉取K线与交易标记", "计算行为复盘与风险提示"]

  return (
    <div className="glass-card rounded-2xl border border-primary/30 bg-primary/5 p-5 neon-glow" aria-live="polite">
      <div className="flex items-start gap-4">
        <div className="mt-1 h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_rgba(53,208,83,0.9)] animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">{language === "zh" ? "正在分析钱包，请不要关闭页面" : "Analyzing wallet. Keep this page open."}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === "zh"
              ? `正在请求可用的 Bitget Wallet Skill 数据并生成复盘。通常需要 3-15 秒，超过 20 秒会提示失败。当前已等待 ${elapsedSeconds} 秒。`
              : `Requesting available Bitget Wallet Skill data and building the replay. This usually takes 3-15 seconds; requests time out after 20 seconds. ${elapsedSeconds}s elapsed.`}
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step} className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs text-foreground">
                {step}
              </div>
            ))}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-2/3 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyAnalysisState({ language }: { language: Language }) {
  return (
    <div className="glass-card rounded-2xl border border-border/50 p-8 text-center">
      <p className="text-sm font-medium text-foreground">
        {language === "zh" ? "暂无钱包数据" : "No wallet data loaded"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {language === "zh" ? "输入钱包地址并点击开始分析后，才会生成链上交易复盘。" : "Enter a wallet address and run analysis to generate the trade replay."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
        <span className="rounded-full border border-border/50 bg-secondary/40 px-3 py-1 text-muted-foreground">
          {language === "zh" ? "当前数据状态：模拟演示" : "Current data state: Mock Demo"}
        </span>
        <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-warning">
          {language === "zh" ? "分析后会显示兜底和部分数据状态" : "Fallback and partial states are shown after analysis"}
        </span>
      </div>
    </div>
  )
}

function WalletReplayUnavailable({ analysis, dataSource, sourceMessage, language }: { analysis: WalletAnalysis; dataSource: DataSource; sourceMessage: string; language: Language }) {
  const isChinese = language === "zh"

  return (
    <>
      <BitgetContextCards analysis={analysis} dataSource={dataSource} sourceMessage={sourceMessage} language={language} />
      <div className="glass-card rounded-2xl border border-warning/40 bg-warning/5 p-6" role="status">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-2 text-warning">
            <FileWarning className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {isChinese ? "未取得该钱包的可核验交易记录，无法生成钱包行为复盘" : "No verifiable wallet transactions were returned, so a wallet behavior replay cannot be generated"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isChinese
                ? "总交易数、胜率、收益、利润捕获率和交易人格都依赖该钱包的实际买入与卖出记录。当前 Bitget 数据覆盖未提供这些记录，因此页面不会展示固定模拟指标。"
                : "Total trades, win rate, PnL, profit capture, and trading personality require actual wallet buy and sell records. The current Bitget coverage did not provide them, so fixed demo metrics are not displayed."}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>{isChinese ? "- 请补充代币合约地址，优先使用单币复盘模式。" : "- Add a token contract and use Token Replay mode first."}</p>
              <p>{isChinese ? "- 确认 Bitget API 权限和 IP 白名单已生效。" : "- Confirm Bitget API access and IP allowlisting."}</p>
              <p>{isChinese ? "- 如果接口仍未返回钱包交易，结果会保持为空而不是虚构交易。" : "- If wallet transactions remain unavailable, results stay empty instead of being invented."}</p>
              <p>{isChinese ? "- 模拟演示仅在 Mock Demo 模式下使用，不代表当前钱包。" : "- Mock Demo is only used in Mock Demo mode and does not represent this wallet."}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ZhDashboard({ analysis, dataSource, sourceMessage }: { analysis: WalletAnalysis; dataSource: DataSource; sourceMessage: string }) {
  const isLiveData = dataSource === "bitget" || dataSource === "okx"
  const zhLeakTitles: Record<string, string> = {
    "Selling Winners Too Early": "盈利单卖太早",
    "Holding Losers Too Long": "亏损单拿太久",
    "No Profit Protection": "没有利润保护",
  }
  const zhRuleTitles: Record<string, string> = {
    "Stage Out Winners": "分批卖出盈利单",
    "Trail After +100%": "浮盈翻倍后启用移动止盈",
    "20-Minute Momentum Check": "20分钟动能检查",
    "Do Not Fully Exit Before TP1": "到达第一止盈前不要全卖",
  }
  const sampleReasons = [
    "代表高浮盈后卖飞：买点不错，但只捕获了部分利润。",
    "代表强趋势过早离场：入场很强，但最大加速段前卖出。",
    "代表亏损死拿：早期动能不足，却持有到可避免的亏损。",
    "代表小赚早退：趋势还没结束就按短炒处理。",
  ]
  const pageSize = 5
  const [tradePage, setTradePage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(analysis.trades.length / pageSize))
  const safeTradePage = Math.min(tradePage, totalPages)
  const pagedTrades = analysis.trades.slice((safeTradePage - 1) * pageSize, safeTradePage * pageSize)

  return (
    <>
      <BitgetContextCards analysis={analysis} dataSource={dataSource} sourceMessage={sourceMessage} language="zh" />

      <div className="glass-card rounded-2xl p-6 border-2 border-ai-accent/30 neon-glow-purple">
        <p className="text-xs tracking-widest text-ai-accent">复盘教练诊断</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">你的主要漏洞：盈利单卖太早</h2>
        <p className="mt-4 text-lg text-foreground">你能找到上涨机会，但大额浮盈出现后没有把利润保护住。</p>
        <div className="mt-4 rounded-xl bg-profit/10 border border-profit/20 px-4 py-3 text-profit text-sm font-medium">
          关键修复：使用分批止盈，并在浮盈翻倍后启用移动止盈。
        </div>
        <div className="mt-4 grid gap-2 rounded-xl bg-secondary/30 border border-border/50 p-4 text-sm text-muted-foreground">
          {analysis.personality.evidence.map((item, index) => {
            const zhEvidence = [
              "复盘样本中的盈利交易，卖出后都继续上涨",
              `平均利润捕获率：${analysis.summary.profitCaptureRate}%`,
              `最大卖飞空间：+${analysis.summary.maxMissedUpside}%`,
              `盈利单平均持仓：${zhHold(analysis.summary.avgWinnerHold)}`,
              `亏损单平均持仓：${zhHold(analysis.summary.avgLoserHold)}`,
            ][index]
            return <p key={item}>{zhEvidence}</p>
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <ZhMetric label="总交易数" value={analysis.summary.totalTrades} />
        <ZhMetric label="胜率" value={`${analysis.summary.winRate}%`} tone="loss" />
        <ZhMetric label="已实现收益" value={money(analysis.summary.realizedPnlUsd)} tone="profit" />
        <ZhMetric label="利润捕获率" value={`${analysis.summary.profitCaptureRate}%`} tone="warning" />
        <ZhMetric label="平均持仓" value={zhHold(analysis.summary.avgHoldTime)} />
        <ZhMetric label="最大卖飞收益" value={`+${analysis.summary.maxMissedUpside}%`} tone="loss" />
        <ZhMetric label="盈利单平均持仓" value={zhHold(analysis.summary.avgWinnerHold)} tone="profit" />
        <ZhMetric label="亏损单平均持仓" value={zhHold(analysis.summary.avgLoserHold)} tone="loss" />
        <ZhMetric label="交易人格" value={analysis.personality.chineseType} tone="ai" />
        <ZhMetric label="综合评分" value={analysis.summary.grade} tone="ai" />
      </div>

      <div className="glass-card rounded-2xl p-6 neon-glow-purple">
        <h3 className="text-lg font-semibold text-foreground">交易人格</h3>
        <h4 className="mt-3 text-2xl font-bold gradient-text">{analysis.personality.chineseType}</h4>
        <p className="mt-3 text-sm text-muted-foreground">{analysis.personality.chineseExplanation}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["卖得太早", "利润保护弱", "选币嗅觉不错", "亏损单拿太久"].map((trait) => (
            <span key={trait} className="rounded-full border border-ai-accent/20 bg-ai-accent/10 px-3 py-1 text-xs text-ai-accent">{trait}</span>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground">回撤行为分析</h3>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ZhMetric label="平均最大回撤" value={`${analysis.summary.averageMaxDrawdown}%`} tone="warning" />
          <ZhMetric label="盈利单平均回撤" value={`${analysis.summary.winnerAvgDrawdown}%`} tone="profit" />
          <ZhMetric label="亏损单平均回撤" value={`${analysis.summary.loserAvgDrawdown}%`} tone="loss" />
          <ZhMetric label="亏损持仓偏好" value="亏损单持仓约3.8倍" tone="ai" />
        </div>
        <p className="mt-4 rounded-xl bg-background/30 border border-border/50 p-4 text-sm text-muted-foreground">
          你倾向于快速兑现小利润，但长时间持有亏损单。这是典型的“截断利润，放大亏损”模式。
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground">主要交易漏洞</h3>
        <div className="mt-4 grid gap-3">
          {analysis.leaks.map((leak, index) => (
            <div key={leak.id} className="rounded-xl bg-secondary/30 border border-border/50 p-4">
              <p className="text-sm font-semibold text-warning">{index + 1}. {zhLeakTitles[leak.title] ?? leak.chineseTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {index === 0 && "你有多笔盈利交易在卖出后继续上涨，说明退出计划不完整。"}
                {index === 1 && "亏损交易的持仓时间明显长于盈利交易，容易把小亏拖成大亏。"}
                {index === 2 && "浮盈达到较高水平后缺少机械保护线，利润容易回吐。"}
              </p>
              <p className="mt-2 text-xs text-profit">建议：{index === 0 ? "浮盈超过 +80% 时至少卖出 30%。" : index === 1 ? "30分钟没有创新高就降低持仓信心。" : "浮盈超过 +100% 后，不允许最终收益跌破 +20%。"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground">个性化优化规则</h3>
        <div className="mt-4 grid gap-3">
          {analysis.rules.map((rule, index) => (
            <div key={rule.id} className="rounded-xl bg-secondary/30 border border-border/50 p-4">
              <p className="font-medium text-foreground">规则 {index + 1}：{zhRuleTitles[rule.title]}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {index === 0 && "如果浮盈超过 +80%，至少卖出 30%。"}
                {index === 1 && "如果仓位达到 +100% 浮盈，不允许最终收益跌破 +20%。"}
                {index === 2 && "买入后 20 分钟内没有超过 +30%，退出或降低仓位。"}
                {index === 3 && "绿色交易没有到达第一止盈位前，不要因为害怕回撤而全卖。"}
              </p>
              <p className="mt-2 text-xs text-foreground/70">原因：这些规则直接针对你的卖飞、利润回吐和亏损死拿问题。</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 neon-glow-purple">
        <h3 className="text-lg font-semibold text-foreground">回放模拟</h3>
        <p className="mt-1 text-sm text-muted-foreground">基于每笔交易的价格路径，比较不同退出策略的历史结果。</p>
        <div className="mt-4 rounded-xl bg-secondary/50 border border-border/50 p-4">
          <p className="text-xs text-muted-foreground">实际结果</p>
          <p className="mt-1 text-3xl font-bold text-profit">{money(analysis.whatIf.actualResult.resultUsd)}</p>
          <p className={`text-sm ${pnlTone(analysis.whatIf.actualResultPct)}`}>{formatPnlPct(analysis.whatIf.actualResultPct)}</p>
        </div>
        <div className="mt-4 grid gap-3">
          {analysis.whatIf.strategies.map((strategy) => (
            <div key={strategy.id} className="rounded-xl bg-secondary/30 border border-border/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-foreground">{strategyName(strategy.id)}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{strategyReason(strategy.id)}</p>
                </div>
                <div className={`text-right font-bold ${strategy.resultUsd >= 0 ? "text-profit" : "text-loss"}`}>
                  {money(strategy.resultUsd)}
                  <p className="text-xs">{formatPnlPct(strategy.resultPct)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-ai-accent/10 border border-ai-accent/20 p-4 text-sm text-ai-accent">
          最佳替代策略：{strategyName(analysis.whatIf.strategies[0]?.id ?? "")}。如果使用该策略，样本收益可提升 {money(analysis.whatIf.improvementPotential)}。
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 border-2 border-primary/30 neon-glow">
        <h3 className="text-lg font-semibold text-foreground">成绩单</h3>
        <div className="mt-4 rounded-xl bg-gradient-to-br from-[#0a1a0f] to-[#0f1f14] border border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <p className="font-bold text-foreground">交易行为实验室</p>
            <p className="font-mono text-xs text-muted-foreground">{analysis.walletAddress.slice(0, 4)}...{analysis.walletAddress.slice(-4)}</p>
          </div>
          <div className="my-6 text-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10">
              <span className="text-4xl font-bold gradient-text">{analysis.summary.grade}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{analysis.personality.chineseType}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ZhMetric label="胜率" value={`${analysis.summary.winRate}%`} tone="loss" />
            <ZhMetric label="利润捕获率" value={`${analysis.summary.profitCaptureRate}%`} tone="warning" />
            <ZhMetric label="盈利单持仓" value={zhHold(analysis.summary.avgWinnerHold)} tone="profit" />
            <ZhMetric label="亏损单持仓" value={zhHold(analysis.summary.avgLoserHold)} tone="loss" />
          </div>
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-loss/10 border border-loss/20 p-3 text-xs text-loss">最大漏洞：盈利单卖太早</p>
            <p className="rounded-lg bg-profit/10 border border-profit/20 p-3 text-xs text-profit">建议修复：使用分批止盈</p>
            <p className="rounded-lg bg-ai-accent/10 border border-ai-accent/20 p-3 text-sm text-foreground">你不是没抓到机会，你是抓到了又亲手放生。</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">单笔交易复盘</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              共生成 {analysis.trades.length} 张{isLiveData ? "可复盘交易卡" : "代表性样本卡"}，覆盖 {analysis.summary.totalTrades} 笔交易；当前页显示 {pagedTrades.length} 张。
            </p>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
            {isLiveData ? "已过滤失败交易、未完成买卖对和缺少K线的记录。" : "剩余交易目前只进入总览统计；接入真实价格路径后会分页展示全部交易。"}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-secondary/30 border border-border/50 p-4 text-sm text-muted-foreground">
          {isLiveData ? "展示规则：这里只展示能匹配到 token 买入、卖出和分钟级价格路径的交易，用于计算买入后高低点、利润捕获率和回放模拟；缺失部分会在数据覆盖范围中明示。" : "选择这几笔的原因：它们分别代表卖飞、利润保护不足、亏损死拿、小赚早退四类最高频问题。当前 mock 阶段只有这些交易具备完整分钟级价格路径，才能做买入后高低点、利润捕获率和回放模拟。"}
        </div>
        {!analysis.trades.length ? (
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning">
            当前请求没有重建出完整买入 / 卖出交易对，因此不伪造单笔复盘卡。请尝试单币复盘模式并提供代币合约地址，或查看数据覆盖范围。
          </div>
        ) : null}
        <div className="mt-4 space-y-4">
          {pagedTrades.map((trade, index) => (
            <div key={trade.id} className="rounded-xl bg-secondary/30 border border-border/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{trade.tokenSymbol}</h4>
                  <p className="font-mono text-xs text-muted-foreground">{trade.tokenAddress.slice(0, 8)}...{trade.tokenAddress.slice(-6)}</p>
                </div>
                <div className={`text-right text-lg font-bold ${pnlTone(trade.realizedPnlPct)}`}>
                  {formatPnlPct(trade.realizedPnlPct)}
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-ai-accent/10 border border-ai-accent/20 px-3 py-2 text-xs text-ai-accent">
                样本理由：{sampleReasons[(safeTradePage - 1) * pageSize + index] ?? "来自可用数据的完整买入/卖出样本，已匹配分钟级价格路径。"}
              </p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <p className="text-muted-foreground">买入价：<span className="text-foreground">{formatTokenPrice(trade.buyPrice)}</span></p>
                <p className="text-muted-foreground">卖出价：<span className="text-foreground">{formatTokenPrice(trade.sellPrice)}</span></p>
                <p className="text-muted-foreground">最大浮盈：<span className={pnlTone(trade.maxUpsidePct)}>{formatPnlPct(trade.maxUpsidePct)}</span></p>
                <p className="text-muted-foreground">最大回撤：<span className="text-loss">-{trade.maxDrawdownPct}%</span></p>
                <p className="text-muted-foreground">持仓时间：<span className="text-foreground">{trade.holdDurationMin}分钟</span></p>
                <p className="text-muted-foreground">利润捕获：<span className="text-warning">{trade.profitCaptureRate}%</span></p>
                <p className="text-muted-foreground">买入评分：<span className="text-profit">{trade.entryScore}</span></p>
                <p className="text-muted-foreground">卖出评分：<span className="text-loss">{trade.exitScore}</span></p>
              </div>
              <p className="mt-4 text-sm text-foreground">诊断：{trade.chineseDiagnosis.replace("scalp", "短炒").replace("TP1", "第一止盈位")}</p>
              {Math.abs(trade.realizedPnlPct) < 0.05 && (
                <p className="mt-2 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
                  这笔接近持平，不代表盈利；低价 token 的买卖价过小，已用高精度显示，百分比四舍五入后约等于0。
                </p>
              )}
              <p className="mt-2 text-xs text-warning">错误标签：{trade.mistakeTags.filter((tag) => /[\u4e00-\u9fff]/.test(tag)).join("、") || "卖飞"}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            第 {safeTradePage} / {totalPages} 页，当前显示第 {analysis.trades.length ? (safeTradePage - 1) * pageSize + 1 : 0} - {Math.min(safeTradePage * pageSize, analysis.trades.length)} 笔，共 {analysis.trades.length} 张复盘卡。
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTradePage((page) => Math.max(1, page - 1))}
              disabled={safeTradePage === 1}
              className="rounded-lg border border-border/60 px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => setTradePage((page) => Math.min(totalPages, page + 1))}
              disabled={safeTradePage === totalPages}
              className="rounded-lg border border-border/60 px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>{dataSource === "bitget" ? "当前结果来自 Bitget Wallet Skill 可用数据和本地复盘算法。" : dataSource === "okx" ? "当前结果来自 OKX 接口和本地复盘算法。" : "当前为模拟数据，用于前端演示和算法占位。"}</p>
        <p className="mt-1">复盘结果不是投资建议，只用于交易行为复盘。</p>
      </div>
    </>
  )
}

export default function TradingBehaviorLabDashboard() {
  const [language, setLanguage] = useState<Language>("zh")
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [chain, setChain] = useState("sol")
  const [period, setPeriod] = useState("7d")
  const [analysisOverride, setAnalysisOverride] = useState<WalletAnalysis | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>("mock")
  const [sourceMessage, setSourceMessage] = useState("")
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!isLoading) return
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isLoading])

  const mockAnalysis = useMemo(() => {
    const whatIf = buildWhatIfSimulation(mockWalletAnalysis.trades)
    const personality = analyzeTradingPersonality(mockWalletAnalysis.trades)
    const leaks = analyzeTradingLeaks(mockWalletAnalysis.trades)
    const rules = buildPersonalizedRules(mockWalletAnalysis.trades)
    const profitCaptureRate = getAverageProfitCapture(mockWalletAnalysis.trades)
    const drawdownBehavior = analyzeDrawdownBehavior(mockWalletAnalysis.trades)
    const baseAnalysis = {
      ...mockWalletAnalysis,
      walletAddress,
      chain,
      period,
      personality,
      leaks,
      rules,
      whatIf,
      summary: {
        ...mockWalletAnalysis.summary,
        ...drawdownBehavior,
        realizedPnlUsd: whatIf.actualResult.resultUsd,
        realizedPnlPct: whatIf.actualResult.resultPct,
        profitCaptureRate,
      },
    }
    const reportCard = generateReportCard(baseAnalysis)

    return {
      ...baseAnalysis,
      reportCard,
    }
  }, [walletAddress, chain, period])
  const analysis = analysisOverride ?? mockAnalysis

  const handleAnalyze = async (address: string, selectedChain: string, selectedPeriod: string, tokenAddress: string, selectedMode: AnalysisMode) => {
    setIsLoading(true)
    setAnalysisStatus("loading")
    setStatusMessage(language === "zh" ? "正在连接 Bitget Wallet Skill 并读取链上市场数据。" : "Connecting to Bitget Wallet Skill and reading on-chain market data.")
    setElapsedSeconds(0)
    setWalletAddress(address)
    setChain(selectedChain)
    setPeriod(selectedPeriod)
    setAnalysisOverride(null)
    setIsAnalyzed(false)
    setDataSource("mock")
    setSourceMessage("正在连接 Bitget Wallet Skill 并分析钱包交易，请稍候。")

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 20_000)
    const startedAt = Date.now()

    try {
      const [response] = await Promise.all([
        fetch("/api/analyze-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address, chain: selectedChain, period: selectedPeriod, tokenAddress, mode: selectedMode }),
          signal: controller.signal,
        }),
        wait(900),
      ])
      if (!response.ok) throw new Error(`本地分析接口返回 ${response.status}`)
      const payload = (await response.json()) as AnalyzeWalletResponse
      setAnalysisOverride(payload.analysis)
      setDataSource(payload.dataSource ?? payload.source)
      setSourceMessage(payload.message)
      setIsAnalyzed(true)
      const hasWalletReplay = Boolean(payload.analysis.bitgetMeta?.dataCoverageStatus?.walletTransactions) && payload.analysis.trades.length > 0 && payload.analysis.dataCoverage !== "mock_fallback"
      const liveReplayUnavailable = payload.dataSource === "bitget" && !hasWalletReplay
      if (payload.ok && !liveReplayUnavailable) {
        setAnalysisStatus("success")
        const durationSeconds = Math.max(1, Math.ceil((Date.now() - startedAt) / 1000))
        setStatusMessage(language === "zh" ? `分析完成，耗时约 ${durationSeconds} 秒。${payload.dataCoverage === "full" ? "已获得完整数据覆盖。" : "页面已标注当前数据覆盖范围。"}` : `Analysis completed in about ${durationSeconds}s. The page shows the current data coverage.`)
      } else {
        setAnalysisStatus("error")
        setStatusMessage(liveReplayUnavailable
          ? (language === "zh" ? "未取得该钱包的买卖记录，无法生成真实钱包复盘；页面已隐藏模拟指标。" : "No wallet buy/sell records were returned, so a real wallet replay was not generated; demo metrics are hidden.")
          : (language === "zh" ? `${payload.error ?? payload.message} 当前展示的是明确标注的兜底结果。` : `${payload.error ?? payload.message} A labeled fallback result is displayed.`))
      }
    } catch (error) {
      setDataSource("mock")
      const isTimeout = error instanceof DOMException && error.name === "AbortError"
      const message = isTimeout
        ? (language === "zh" ? "请求超过 20 秒已停止。请检查 Bitget API 权限、IP 白名单或网络后重试。" : "The request exceeded 20 seconds. Check Bitget API access, IP allowlisting, or network and retry.")
        : (error instanceof Error ? `接口暂不可用：${error.message}` : "接口暂不可用，已切换模拟数据。")
      setSourceMessage(message)
      setAnalysisStatus("error")
      setStatusMessage(message)
      setAnalysisOverride(null)
      setIsAnalyzed(false)
    } finally {
      window.clearTimeout(timeout)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader language={language} onLanguageChange={setLanguage} />

      <main className="container mx-auto px-4 lg:px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <WalletInput
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            language={language}
            analysisStatus={analysisStatus}
            statusMessage={statusMessage}
            elapsedSeconds={elapsedSeconds}
          />

          <HackathonDemoFlow language={language} />

          <SafetyNotice language={language} />

          {isLoading && <AnalysisLoadingPanel elapsedSeconds={elapsedSeconds} language={language} />}

          {!isLoading && !isAnalyzed && <EmptyAnalysisState language={language} />}

          {isAnalyzed && analysisOverride && (
            dataSource === "bitget" && (!analysis.bitgetMeta?.dataCoverageStatus?.walletTransactions || analysis.trades.length === 0 || analysis.dataCoverage === "mock_fallback") ? (
              <WalletReplayUnavailable analysis={analysis} dataSource={dataSource} sourceMessage={sourceMessage} language={language} />
            ) : language === "zh" ? (
              <ZhDashboard analysis={analysis} dataSource={dataSource} sourceMessage={sourceMessage} />
            ) : (
              <>
              <BitgetContextCards analysis={analysis} dataSource={dataSource} sourceMessage={sourceMessage} language="en" />

              <OverallDiagnosis
                mainLeak={analysis.reportCard.biggestLeak}
                diagnosis="You can find upside, but you fail to protect it after large unrealized gains."
                keyFix="Use staged take-profit plus trailing stop."
                evidence={analysis.personality.evidence}
              />

              <MetricCards
                data={{
                  totalTrades: analysis.summary.totalTrades,
                  winRate: analysis.summary.winRate,
                  realizedPnL: analysis.summary.realizedPnlUsd,
                  profitCaptureRate: analysis.summary.profitCaptureRate,
                  avgHoldTime: analysis.summary.avgHoldTime,
                  maxMissedUpside: analysis.summary.maxMissedUpside,
                  avgWinnerHold: analysis.summary.avgWinnerHold,
                  avgLoserHold: analysis.summary.avgLoserHold,
                  tradingPersonality: analysis.personality.type,
                  grade: analysis.summary.grade,
                }}
              />

              <TradingPersonality personality={analysis.personality} />

              <DrawdownBehavior summary={analysis.summary} />

              <TradingLeaks leaks={analysis.leaks} />

              <PersonalizedRules rules={analysis.rules} />

              <WhatIfSimulation simulation={analysis.whatIf} />

              <DegenReportCard
                walletAddress={analysis.walletAddress}
                grade={analysis.reportCard.grade}
                personality={analysis.reportCard.personality}
                stats={{
                  totalTrades: analysis.summary.totalTrades,
                  winRate: analysis.summary.winRate,
                  realizedPnL: analysis.summary.realizedPnlUsd,
                  profitCapture: analysis.summary.profitCaptureRate,
                  avgWinnerHold: analysis.summary.avgWinnerHold,
                  avgLoserHold: analysis.summary.avgLoserHold,
                }}
                topLeak={analysis.reportCard.biggestLeak}
                suggestedFix={analysis.reportCard.suggestedFix}
                mirrorRoast={analysis.reportCard.mirrorRoast}
                bestTrade={{
                  token: analysis.reportCard.bestTrade.token,
                  pnl: analysis.reportCard.bestTrade.pnlUsd,
                }}
              />

              <TradeReplayCards trades={analysis.trades} />

              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>Trading Behavior Lab · Powered by Bitget Wallet Skill</p>
                <p className="mt-1">Retrospective behavior analysis only · No signing, auto-trading, or custody · Not financial advice</p>
              </div>
              </>
            )
          )}
        </div>
      </main>
    </div>
  )
}
