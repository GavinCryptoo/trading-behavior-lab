"use client"

import { useState } from "react"
import { Loader2, Search, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WalletInputProps {
  onAnalyze: (address: string, chain: string, period: string, tokenAddress: string, mode: "token_replay" | "wallet_behavior") => void
  isLoading?: boolean
  language?: "en" | "zh"
}

export function WalletInput({ onAnalyze, isLoading, language = "en" }: WalletInputProps) {
  const [address, setAddress] = useState("")
  const [chain, setChain] = useState("sol")
  const [tokenAddress, setTokenAddress] = useState("")
  const [period, setPeriod] = useState("7d")
  const [mode, setMode] = useState<"token_replay" | "wallet_behavior">("token_replay")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (address.trim()) {
      onAnalyze(address.trim(), chain, period, tokenAddress.trim(), mode)
    }
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
            onChange={(e) => setAddress(e.target.value)}
            className="h-12 pl-4 pr-4 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder={language === "zh" ? "代币合约地址（可选）" : "Token Contract, optional"}
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
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
      {isLoading && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {language === "zh" ? "正在分析钱包交易，请稍候。真实链上数据可能需要几秒钟。" : "Analyzing wallet trades. Real on-chain data may take a few seconds."}
        </div>
      )}
    </div>
  )
}
