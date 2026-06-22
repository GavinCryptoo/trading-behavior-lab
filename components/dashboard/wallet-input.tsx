"use client"

import { useState } from "react"
import { Loader2, Search, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AnalysisStatus = "idle" | "loading" | "success" | "error"
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

function isSolanaPublicKey(value: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false
  const bytes = [0]
  for (const char of value) {
    let carry = BASE58.indexOf(char)
    if (carry < 0) return false
    for (let index = 0; index < bytes.length; index += 1) {
      const next = bytes[index] * 58 + carry
      bytes[index] = next & 0xff
      carry = next >> 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (const char of value) {
    if (char !== "1") break
    bytes.push(0)
  }
  return bytes.length === 32
}

interface WalletInputProps {
  onAnalyze: (address: string, chain: string, period: string, tokenAddress: string, mode: "token_replay" | "wallet_behavior") => void
  isLoading?: boolean
  language?: "en" | "zh"
  analysisStatus?: AnalysisStatus
  statusMessage?: string
  elapsedSeconds?: number
}

export function WalletInput({ onAnalyze, isLoading, language = "en", analysisStatus = "idle", statusMessage, elapsedSeconds = 0 }: WalletInputProps) {
  const [address, setAddress] = useState("")
  const [chain, setChain] = useState("sol")
  const [tokenAddress, setTokenAddress] = useState("")
  const [period, setPeriod] = useState("7d")
  const [mode, setMode] = useState<"token_replay" | "wallet_behavior">("token_replay")
  const [validationError, setValidationError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const wallet = address.trim()
    const token = tokenAddress.trim()
    if (!wallet) return
    if (chain === "sol" && !isSolanaPublicKey(wallet)) {
      setValidationError(language === "zh" ? "请输入有效的 Solana 钱包地址。当前地址不是 32 字节 Base58 公钥。" : "Enter a valid Solana wallet address. The current value is not a 32-byte Base58 public key.")
      return
    }
    if (mode === "token_replay" && !token) {
      setValidationError(language === "zh" ? "真实单币复盘需要填写代币合约地址。" : "A token contract address is required for a real Token Replay.")
      return
    }
    if (chain === "sol" && token && !isSolanaPublicKey(token)) {
      setValidationError(language === "zh" ? "请输入有效的 Solana 代币合约地址。" : "Enter a valid Solana token contract address.")
      return
    }
    setValidationError("")
    onAnalyze(wallet, chain, period, token, mode)
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 neon-glow">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">{language === "zh" ? "钱包交易行为分析" : "Wallet Behavior Analysis"}</p>
          <h2 className="text-xl font-semibold text-foreground">{language === "zh" ? "交易行为实验室" : "Trading Behavior Lab"}</h2>
          <p className="text-xs font-medium text-ai-accent">{language === "zh" ? "由 Bitget Wallet Skill 提供支持" : "Powered by Bitget Wallet Skill"}</p>
          <p className="text-sm text-muted-foreground">
            {language === "zh" ? "复盘你的链上交易，对比 smart money，找出本该遵守的交易规则。" : "Replay your on-chain trades, compare your behavior with smart money, and discover the trading rules you should have followed."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "zh" ? "单币复盘模式推荐同时输入钱包地址和代币合约地址。" : "Token contract address is optional, but recommended for Bitget Token Replay Mode."}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1.3fr_1fr_140px_130px_150px_auto]">
        <div className="relative">
          <Input
            type="text"
            placeholder={language === "zh" ? "钱包地址" : "Wallet Address"}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setValidationError("")
            }}
            className="h-12 pl-4 pr-4 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder={language === "zh" ? "代币合约地址（单币复盘必填）" : "Token Contract, required for Token Replay"}
            value={tokenAddress}
            onChange={(e) => {
              setTokenAddress(e.target.value)
              setValidationError("")
            }}
            className="h-12 pl-4 pr-4 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>
        <select
          value={chain}
          onChange={(event) => setChain(event.target.value)}
          className="h-12 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="sol">{language === "zh" ? "Solana" : "Solana"}</option>
          <option value="base">Base</option>
          <option value="bnb">BNB</option>
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="polygon">Polygon</option>
        </select>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-12 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="24h">{language === "zh" ? "24小时" : "24h"}</option>
          <option value="7d">{language === "zh" ? "7天" : "7d"}</option>
          <option value="30d">{language === "zh" ? "30天" : "30d"}</option>
        </select>
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as "token_replay" | "wallet_behavior")}
          className="h-12 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="token_replay">{language === "zh" ? "单币复盘" : "Token Replay"}</option>
          <option value="wallet_behavior">{language === "zh" ? "钱包行为" : "Wallet Behavior"}</option>
        </select>
        <Button 
          type="submit" 
          disabled={!address.trim() || isLoading}
          className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium neon-glow transition-all duration-200"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          {isLoading ? (language === "zh" ? "分析中..." : "Analyzing...") : (language === "zh" ? "开始分析" : "Analyze")}
        </Button>
      </form>
      {validationError && (
        <p className="mt-3 text-sm text-loss" role="alert">{validationError}</p>
      )}
      {analysisStatus !== "idle" && (
        <div
          className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            analysisStatus === "success"
              ? "border-profit/30 bg-profit/10 text-profit"
              : analysisStatus === "error"
                ? "border-loss/30 bg-loss/10 text-loss"
                : "border-primary/30 bg-primary/10 text-primary"
          }`}
          aria-live="polite"
        >
          {analysisStatus === "loading" && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
          <div>
            <p className="font-medium">
              {analysisStatus === "loading"
                ? (language === "zh" ? "正在分析" : "Analysis in progress")
                : analysisStatus === "success"
                  ? (language === "zh" ? "分析完成" : "Analysis complete")
                  : (language === "zh" ? "分析失败" : "Analysis failed")}
              {analysisStatus === "loading" && elapsedSeconds > 0 ? ` · ${language === "zh" ? `已等待 ${elapsedSeconds} 秒` : `${elapsedSeconds}s elapsed`}` : ""}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {statusMessage ?? (language === "zh" ? "正在准备分析结果。" : "Preparing analysis results.")}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
