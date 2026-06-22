import type { AnalysisMode, DataCoverage, DataSource, WalletAnalysis } from "@/src/data/mockWalletAnalysis"

export interface AnalyzeWalletParams {
  walletAddress: string
  chain: string
  period: string
  tokenAddress?: string
  mode?: AnalysisMode
}

export interface AdapterAnalysisResult {
  ok: boolean
  dataSource: DataSource
  dataCoverage: DataCoverage
  message: string
  analysis: WalletAnalysis
  error?: string
}

export interface TokenReplayParams {
  walletAddress: string
  chain: string
  tokenAddress: string
  period: string
}

export interface WalletBehaviorParams {
  walletAddress: string
  chain: string
  period: string
}

export interface NormalizedTokenTransaction {
  txHash?: string
  walletAddress?: string
  tokenAddress?: string
  symbol?: string
  side: "buy" | "sell" | "unknown"
  timestamp: number
  priceUsd?: number
  amount?: number
  amountUsd?: number
}

export interface NormalizedKlinePoint {
  timestamp: number
  open?: number
  high?: number
  low?: number
  close: number
  volume?: number
}
