type QueryValue = string | number | boolean | undefined

export class BitgetConfigError extends Error {}

export class BitgetApiError extends Error {
  constructor(message: string, public readonly endpoint?: string, public readonly status?: number) {
    super(message)
  }
}

export interface BitgetClientOptions {
  baseUrl?: string
  apiToken?: string
}

function queryString(params?: Record<string, QueryValue>) {
  if (!params) return ""
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const value = search.toString()
  return value ? `?${value}` : ""
}

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, "")
}

export class BitgetClient {
  private readonly baseUrl: string
  private readonly apiToken?: string

  constructor(options: BitgetClientOptions = {}) {
    const baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.BITGET_WALLET_API_BASE)
    if (!baseUrl) {
      throw new BitgetConfigError("BITGET_WALLET_API_BASE is not configured. Keep DATA_SOURCE=mock unless a Bitget Wallet Skill bridge or API base is available.")
    }
    this.baseUrl = baseUrl
    this.apiToken = options.apiToken ?? process.env.BITGET_WALLET_API_TOKEN
  }

  getTokenInfo(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/info", params)
  }

  getTokenSecurity(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/security", params)
  }

  getTokenKline(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/kline", params)
  }

  getTokenTradingDynamics(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/trading-dynamics", params)
  }

  getTokenTransactions(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/transactions", params)
  }

  getTokenHolders(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/holders", params)
  }

  getSmartMoneyOrKolTrades(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/token/smart-money-trades", params)
  }

  getAddressAnalysis(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/address/analysis", params)
  }

  getSwapQuotePreview(params: Record<string, QueryValue>) {
    return this.get<Record<string, unknown>>("/swap/quote-preview", params)
  }

  private async get<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
    const endpoint = `${path}${queryString(params)}`
    const headers: Record<string, string> = {
      Accept: "application/json",
    }
    if (this.apiToken) headers.Authorization = `Bearer ${this.apiToken}`

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers,
        cache: "no-store",
      })
    } catch (error) {
      throw new BitgetApiError(error instanceof Error ? error.message : "Bitget Wallet Skill request failed", path)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new BitgetApiError(`Bitget Wallet Skill HTTP ${response.status}${text ? `: ${text}` : ""}`, path, response.status)
    }

    return response.json() as Promise<T>
  }
}
