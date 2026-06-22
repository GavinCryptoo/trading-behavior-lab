import { fetch as undiciFetch, ProxyAgent } from "undici"
import type { NormalizedTokenTransaction } from "./types"

const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
const DEFAULT_SOL_USD_PRICE_URL = "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112"
const MAX_SIGNATURES = 20
const WSOL_MINT = "So11111111111111111111111111111111111111112"
const USD_STABLE_MINTS = new Set([
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
])
const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY ?? process.env.ALL_PROXY
const proxyDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined

function networkFetch(url: string, init: Parameters<typeof undiciFetch>[1]) {
  return proxyDispatcher
    ? undiciFetch(url, { ...init, dispatcher: proxyDispatcher })
    : undiciFetch(url, init)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type RpcSignature = {
  signature: string
  blockTime: number | null
  err: unknown
}

type RpcTokenBalance = {
  mint?: string
  owner?: string
  uiTokenAmount?: {
    amount?: string
    decimals?: number
    uiAmount?: number | null
    uiAmountString?: string
  }
}

type RpcTransaction = {
  blockTime: number | null
  meta?: {
    err?: unknown
    preBalances?: number[]
    postBalances?: number[]
    preTokenBalances?: RpcTokenBalance[]
    postTokenBalances?: RpcTokenBalance[]
  } | null
  transaction?: {
    message?: {
      accountKeys?: Array<{ pubkey?: string } | string>
    }
  }
}

function periodToDays(period: string) {
  if (period.toLowerCase().includes("24h")) return 1
  const days = Number.parseInt(period, 10)
  return Number.isFinite(days) ? days : 7
}

function uiAmount(balance: RpcTokenBalance) {
  const direct = balance.uiTokenAmount?.uiAmount
  if (typeof direct === "number" && Number.isFinite(direct)) return direct
  const text = balance.uiTokenAmount?.uiAmountString
  if (text) {
    const value = Number(text)
    if (Number.isFinite(value)) return value
  }
  const raw = Number(balance.uiTokenAmount?.amount)
  const decimals = balance.uiTokenAmount?.decimals ?? 0
  return Number.isFinite(raw) ? raw / 10 ** decimals : 0
}

function tokenBalanceForWallet(balances: RpcTokenBalance[] | undefined, walletAddress: string, tokenAddress: string) {
  return (balances ?? []).reduce((total, balance) => {
    if (balance.owner !== walletAddress || balance.mint !== tokenAddress) return total
    return total + uiAmount(balance)
  }, 0)
}

function walletTokenDeltas(preBalances: RpcTokenBalance[] | undefined, postBalances: RpcTokenBalance[] | undefined, walletAddress: string) {
  const totals = new Map<string, { pre: number; post: number }>()
  for (const balance of preBalances ?? []) {
    if (balance.owner !== walletAddress || !balance.mint) continue
    const current = totals.get(balance.mint) ?? { pre: 0, post: 0 }
    current.pre += uiAmount(balance)
    totals.set(balance.mint, current)
  }
  for (const balance of postBalances ?? []) {
    if (balance.owner !== walletAddress || !balance.mint) continue
    const current = totals.get(balance.mint) ?? { pre: 0, post: 0 }
    current.post += uiAmount(balance)
    totals.set(balance.mint, current)
  }
  return [...totals.entries()].map(([mint, value]) => ({ mint, delta: value.post - value.pre }))
}

function publicKeyAt(transaction: RpcTransaction, walletAddress: string) {
  const keys = transaction.transaction?.message?.accountKeys ?? []
  return keys.findIndex((key) => (typeof key === "string" ? key : key.pubkey) === walletAddress)
}

export class SolanaRpcError extends Error {}

/**
 * Read-only token-centric replay source. It only reads public Solana RPC data
 * and never creates, signs, or sends transactions.
 */
export class SolanaRpcClient {
  private readonly rpcUrl: string

  constructor(rpcUrl = process.env.SOLANA_RPC_URL ?? DEFAULT_SOLANA_RPC_URL) {
    this.rpcUrl = rpcUrl
  }

  async getWalletTokenTransactions(params: { walletAddress: string; tokenAddress: string; period: string }): Promise<NormalizedTokenTransaction[]> {
    const cutoff = Math.floor(Date.now() / 1000) - periodToDays(params.period) * 24 * 60 * 60
    const signatures = await this.rpc<RpcSignature[]>("getSignaturesForAddress", [params.walletAddress, { limit: MAX_SIGNATURES }])
    const candidates = signatures.filter((item) => !item.err && item.blockTime && item.blockTime >= cutoff)
    const solUsd = await this.getSolUsdPrice()
    const transactions: NormalizedTokenTransaction[] = []

    for (const item of candidates) {
      const transaction = await this.rpc<RpcTransaction | null>("getTransaction", [item.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }])
      if (!transaction?.meta || transaction.meta.err || !transaction.blockTime) continue

      const preAmount = tokenBalanceForWallet(transaction.meta.preTokenBalances, params.walletAddress, params.tokenAddress)
      const postAmount = tokenBalanceForWallet(transaction.meta.postTokenBalances, params.walletAddress, params.tokenAddress)
      const tokenDelta = postAmount - preAmount
      if (!Number.isFinite(tokenDelta) || Math.abs(tokenDelta) <= 0) continue

      const quoteDelta = walletTokenDeltas(transaction.meta.preTokenBalances, transaction.meta.postTokenBalances, params.walletAddress)
        .filter((item) => item.mint !== params.tokenAddress && item.delta !== 0 && Math.sign(item.delta) !== Math.sign(tokenDelta))
        .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))[0]

      const walletIndex = publicKeyAt(transaction, params.walletAddress)
      const preLamports = walletIndex >= 0 ? transaction.meta.preBalances?.[walletIndex] : undefined
      const postLamports = walletIndex >= 0 ? transaction.meta.postBalances?.[walletIndex] : undefined
      const nativeDeltaSol = typeof preLamports === "number" && typeof postLamports === "number"
        ? (postLamports - preLamports) / 1_000_000_000
        : undefined

      const side = tokenDelta > 0 && (Boolean(quoteDelta) || (nativeDeltaSol ?? 0) < 0)
        ? "buy"
        : tokenDelta < 0 && (Boolean(quoteDelta) || (nativeDeltaSol ?? 0) > 0)
          ? "sell"
          : "unknown"
      if (side === "unknown") continue

      const nativeValue = Math.abs(nativeDeltaSol ?? 0)
      const quoteValueUsd = quoteDelta
        ? USD_STABLE_MINTS.has(quoteDelta.mint)
          ? Math.abs(quoteDelta.delta)
          : quoteDelta.mint === WSOL_MINT && solUsd
            ? Math.abs(quoteDelta.delta) * solUsd
            : undefined
        : solUsd && nativeValue > 0
          ? nativeValue * solUsd
          : undefined
      const priceUsd = quoteValueUsd && Math.abs(tokenDelta) > 0 ? quoteValueUsd / Math.abs(tokenDelta) : undefined
      transactions.push({
        txHash: item.signature,
        walletAddress: params.walletAddress,
        tokenAddress: params.tokenAddress,
        side,
        timestamp: transaction.blockTime * 1000,
        priceUsd,
        amount: Math.abs(tokenDelta),
        amountUsd: quoteValueUsd,
      })
    }

    return transactions.sort((a, b) => a.timestamp - b.timestamp)
  }

  private async getSolUsdPrice() {
    try {
      const response = await networkFetch(DEFAULT_SOL_USD_PRICE_URL, { cache: "no-store" })
      if (!response.ok) return undefined
      const payload = await response.json() as { pairs?: Array<{ priceUsd?: string }> }
      const value = Number(payload.pairs?.[0]?.priceUsd)
      return Number.isFinite(value) && value > 0 ? value : undefined
    } catch {
      return undefined
    }
  }

  private async rpc<T>(method: string, params: unknown[]): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response
      try {
        response = await networkFetch(this.rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
          cache: "no-store",
        })
      } catch (error) {
        throw new SolanaRpcError(error instanceof Error ? error.message : "Solana RPC request failed")
      }
      if (response.status === 429 && attempt < 2) {
        await wait((attempt + 1) * 500)
        continue
      }
      if (!response.ok) throw new SolanaRpcError(`Solana RPC HTTP ${response.status}`)
      const payload = await response.json() as { error?: { message?: string }; result?: T }
      if (payload.error?.message?.toLowerCase().includes("too many requests") && attempt < 2) {
        await wait((attempt + 1) * 500)
        continue
      }
      if (payload.error) throw new SolanaRpcError(payload.error.message ?? "Solana RPC returned an error")
      return payload.result as T
    }
    throw new SolanaRpcError("Solana RPC rate limit persisted after retries")
  }
}
