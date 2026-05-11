"use client"

import { useState } from "react"
import { Loader2, Search, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WalletInputProps {
  onAnalyze: (address: string, chain: string, period: string) => void
  isLoading?: boolean
  language?: "en" | "zh"
}

export function WalletInput({ onAnalyze, isLoading, language = "en" }: WalletInputProps) {
  const [address, setAddress] = useState("")
  const [chain, setChain] = useState("Solana")
  const [period, setPeriod] = useState("7D")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (address.trim()) {
      onAnalyze(address.trim(), chain, period)
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
          <p className="text-sm text-muted-foreground">
            {language === "zh" ? "别再只问下一个买什么，先看清上一笔为什么亏。" : "Stop asking what to buy. Start understanding why your trades failed."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "zh" ? "输入钱包地址，复盘你的链上交易行为，找出你到底是买晚了、卖早了，还是亏损单拿太久。" : "Enter a wallet address to replay your trading behavior and find the repeated leaks."}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_140px_120px_auto]">
        <div className="relative">
          <Input
            type="text"
            placeholder={language === "zh" ? "输入钱包地址..." : "Enter Solana wallet address..."}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-12 pl-4 pr-4 bg-secondary/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>
        <select
          value={chain}
          onChange={(event) => setChain(event.target.value)}
          className="h-12 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="Solana">{language === "zh" ? "索拉纳" : "Solana"}</option>
          <option value="X Layer">{language === "zh" ? "X层" : "X Layer"}</option>
        </select>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-12 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="7D">{language === "zh" ? "7天" : "7D"}</option>
          <option value="30D">{language === "zh" ? "30天" : "30D"}</option>
          <option value="90D">{language === "zh" ? "90天" : "90D"}</option>
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
