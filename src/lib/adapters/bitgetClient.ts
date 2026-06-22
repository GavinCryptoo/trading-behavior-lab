import { createHmac } from "node:crypto"

type QueryValue = string | number | boolean | undefined
type JsonRecord = Record<string, unknown>

const DEFAULT_BITGET_WALLET_API_BASE = "https://bopenapi.bgwapi.io"

const CHAIN_IDS: Record<string, number> = {
  sol: 100278,
  eth: 1,
  base: 8453,
  bnb: 56,
  arbitrum: 42161,
  matic: 137,
  polygon: 137,
}

export class BitgetConfigError extends Error {}

export class BitgetApiError extends Error {
  constructor(message: string, public readonly endpoint?: string, public readonly status?: number) {
    super(message)
  }
}

export interface BitgetClientOptions {
  baseUrl?: string
  apiKey?: string
  apiSecret?: string
}

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, "")
}

function asString(value: QueryValue) {
  return value === undefined ? undefined : String(value)
}

function readTokenAddress(params: Record<string, QueryValue>) {
  const tokenAddress = asString(params.tokenAddress ?? params.contract)
  if (!tokenAddress) throw new BitgetApiError("A token contract address is required for this Bitget Wallet request.")
  return tokenAddress
}

function readChain(params: Record<string, QueryValue>) {
  return asString(params.chain) ?? "sol"
}

function readChainId(chain: string) {
  return CHAIN_IDS[chain.toLowerCase()] ?? 0
}

function klineSize(period: string | undefined) {
  const normalized = (period ?? "7d").toLowerCase()
  if (normalized.includes("24h")) return 24
  const days = Number.parseInt(normalized, 10)
  return Math.min(Math.max(Number.isFinite(days) ? days * 24 : 168, 24), 1440)
}

/**
 * Read-only Bitget Wallet Markets API client. No order, swap, signing, or
 * transaction-submission methods are present in this client.
 */
export class BitgetClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly apiSecret: string

  constructor(options: BitgetClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.BITGET_WALLET_API_BASE) ?? DEFAULT_BITGET_WALLET_API_BASE
    this.apiKey = options.apiKey ?? process.env.BITGET_WALLET_API_KEY ?? process.env.BITGET_WALLET_API_TOKEN ?? ""
    this.apiSecret = options.apiSecret ?? process.env.BITGET_WALLET_API_SECRET ?? ""
    if (!this.apiKey || !this.apiSecret) {
      throw new BitgetConfigError("BITGET_WALLET_API_KEY and BITGET_WALLET_API_SECRET must be configured for official Bitget Wallet API requests.")
    }
  }

  getTokenInfo(params: Record<string, QueryValue>) {
    return this.post<JsonRecord>("/bgw-pro/market/v3/coin/getBaseInfo", {
      chain: readChain(params),
      contract: readTokenAddress(params),
    })
  }

  getTokenSecurity(params: Record<string, QueryValue>) {
    const chain = readChain(params)
    return this.post<JsonRecord>("/bgw-pro/market/v3/coin/security/audits", {
      list: [{ chain_id: readChainId(chain), chain, contract: readTokenAddress(params) }],
      source: "bg",
    })
  }

  getTokenKline(params: Record<string, QueryValue>) {
    return this.post<JsonRecord>("/bgw-pro/market/v3/coin/getKline", {
      chain: readChain(params),
      contract: readTokenAddress(params),
      period: "1h",
      size: klineSize(asString(params.period)),
    })
  }

  getTokenTradingDynamics(params: Record<string, QueryValue>) {
    return this.post<JsonRecord>("/bgw-pro/market/v3/coin/getTxInfo", {
      chain: readChain(params),
      contract: readTokenAddress(params),
    })
  }

  async getTokenTransactions(_params: Record<string, QueryValue>) {
    throw new BitgetApiError("The confirmed Bitget Wallet Markets API endpoints expose aggregate token transaction dynamics, not wallet-filtered token transactions. Wallet replay remains partial until a wallet transaction endpoint is confirmed.")
  }

  getTokenHolders(params: Record<string, QueryValue>) {
    // Base token info includes holder count and concentration fields, used by holder-risk analysis.
    return this.getTokenInfo(params)
  }

  async getSmartMoneyOrKolTrades(_params: Record<string, QueryValue>) {
    throw new BitgetApiError("A Smart Money/KOL trade endpoint is not mapped yet for the official Bitget Wallet API contract.")
  }

  async getAddressAnalysis(_params: Record<string, QueryValue>) {
    throw new BitgetApiError("An address-analysis endpoint is not mapped yet for the official Bitget Wallet API contract.")
  }

  async getSwapQuotePreview(_params: Record<string, QueryValue>) {
    throw new BitgetApiError("Quote preview is intentionally disabled until its official read-only API contract is mapped. No swap execution is implemented.")
  }

  private async post<T>(path: string, body: JsonRecord): Promise<T> {
    const timestamp = String(Date.now())
    const bodyString = JSON.stringify(body)
    const signaturePayload = JSON.stringify({
      apiPath: path,
      body: bodyString,
      "x-api-key": this.apiKey,
      "x-api-timestamp": timestamp,
    })
    const signature = createHmac("sha256", this.apiSecret).update(signaturePayload).digest("base64")

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "x-api-timestamp": timestamp,
          "x-api-signature": signature,
        },
        body: bodyString,
        cache: "no-store",
      })
    } catch (error) {
      throw new BitgetApiError(error instanceof Error ? error.message : "Bitget Wallet request failed", path)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new BitgetApiError(`Bitget Wallet HTTP ${response.status}${text ? `: ${text.slice(0, 500)}` : ""}`, path, response.status)
    }

    const payload = await response.json() as JsonRecord
    if (payload.status !== undefined && Number(payload.status) !== 0) {
      throw new BitgetApiError(`Bitget Wallet API returned status ${String(payload.status)}${payload.errmsg ? `: ${String(payload.errmsg)}` : ""}`, path)
    }
    return payload as T
  }
}
