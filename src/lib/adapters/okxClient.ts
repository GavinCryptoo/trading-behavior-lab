import crypto from "node:crypto"
import { ProxyAgent, setGlobalDispatcher } from "undici"

const OKX_BASE_URL = "https://web3.okx.com"
let proxyConfigured = false

export class OkxConfigError extends Error {}
export class OkxApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
  }
}

export interface OkxCredentials {
  apiKey: string
  secretKey: string
  passphrase: string
  projectId?: string
}

export function getOkxCredentials(): OkxCredentials {
  const apiKey = process.env.OKX_API_KEY
  const secretKey = process.env.OKX_SECRET_KEY
  const passphrase = process.env.OKX_PASSPHRASE

  if (!apiKey || !secretKey || !passphrase) {
    throw new OkxConfigError("OKX API credentials are missing. Set OKX_API_KEY, OKX_SECRET_KEY, and OKX_PASSPHRASE in .env.local.")
  }

  return {
    apiKey,
    secretKey,
    passphrase,
    projectId: process.env.OKX_PROJECT_ID,
  }
}

function sign(timestamp: string, method: string, requestPath: string, body: string, secretKey: string) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}${method}${requestPath}${body}`)
    .digest("base64")
}

function queryString(params?: Record<string, string | number | undefined>) {
  if (!params) return ""
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const value = search.toString()
  return value ? `?${value}` : ""
}

function configureProxy() {
  if (proxyConfigured) return
  proxyConfigured = true

  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.ALL_PROXY || process.env.all_proxy || process.env.HTTP_PROXY || process.env.http_proxy
  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class OkxClient {
  private readonly credentials = getOkxCredentials()

  constructor() {
    configureProxy()
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const requestPath = `${path}${queryString(params)}`
    return this.request<T>("GET", requestPath)
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, JSON.stringify(body))
  }

  private async request<T>(method: "GET" | "POST", requestPath: string, body = "", attempt = 0): Promise<T> {
    const timestamp = new Date().toISOString()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": this.credentials.apiKey,
      "OK-ACCESS-SIGN": sign(timestamp, method, requestPath, body, this.credentials.secretKey),
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": this.credentials.passphrase,
    }
    if (this.credentials.projectId) headers["OK-ACCESS-PROJECT"] = this.credentials.projectId

    const response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
      method,
      headers,
      body: method === "POST" ? body : undefined,
      cache: "no-store",
    })

    if ((response.status === 429 || response.status === 500) && attempt < 2) {
      await delay(600 * (attempt + 1))
      return this.request<T>(method, requestPath, body, attempt + 1)
    }

    if (!response.ok) {
      throw new OkxApiError(`OKX HTTP ${response.status}: ${await response.text()}`)
    }

    const json = await response.json()
    if (json.code && String(json.code) !== "0") {
      if (String(json.code) === "50011" && attempt < 2) {
        await delay(700 * (attempt + 1))
        return this.request<T>(method, requestPath, body, attempt + 1)
      }
      throw new OkxApiError(json.msg || "OKX API returned a non-zero code", String(json.code))
    }

    return json as T
  }
}
