import type { WalletAnalysis } from "@/src/data/mockWalletAnalysis"

export interface SolanaWalletTrade {
  signature: string
  tokenAddress: string
  blockTime: number
  side: "buy" | "sell"
  amount: number
  priceUsd?: number
}

export class SolanaAdapter {
  async getWalletTrades(): Promise<SolanaWalletTrade[]> {
    throw new Error("Solana adapter is a placeholder. Wire RPC, DEX fills, and K-line enrichment here later.")
  }

  async buildWalletAnalysis(): Promise<WalletAnalysis> {
    throw new Error("Mock data is used for the current frontend demo. Real wallet analysis will be assembled here later.")
  }
}
