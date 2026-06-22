import { NextRequest, NextResponse } from "next/server"
import { mockWalletAnalysis, type AnalysisMode, type DataSource, type WalletAnalysis } from "@/src/data/mockWalletAnalysis"
import { BitgetAdapter } from "@/src/lib/adapters/bitgetAdapter"
import { BitgetApiError, BitgetConfigError } from "@/src/lib/adapters/bitgetClient"
import { OkxAdapter } from "@/src/lib/adapters/okxAdapter"
import { OkxApiError, OkxConfigError } from "@/src/lib/adapters/okxClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AnalyzeWalletPayload = {
  walletAddress?: string
  chain?: string
  period?: string
  tokenAddress?: string
  mode?: AnalysisMode
}

function fallbackAnalysis(payload: Required<Omit<AnalyzeWalletPayload, "tokenAddress" | "mode">> & Pick<AnalyzeWalletPayload, "tokenAddress" | "mode">, warning?: string): WalletAnalysis {
  return {
    ...mockWalletAnalysis,
    walletAddress: payload.walletAddress,
    chain: payload.chain,
    period: payload.period,
    mode: payload.mode ?? (payload.tokenAddress ? "token_replay" : "wallet_behavior"),
    dataSource: "mock",
    dataCoverage: "mock_fallback",
    bitgetMeta: {
      ...mockWalletAnalysis.bitgetMeta,
      chain: payload.chain,
      walletAddress: payload.walletAddress,
      tokenAddress: payload.tokenAddress ?? mockWalletAnalysis.bitgetMeta?.tokenAddress,
      warnings: [
        "Demo fallback data.",
        ...(warning ? [warning] : []),
      ],
    },
  }
}

function publicErrorMessage(error: unknown) {
  if (error instanceof BitgetConfigError) return "Bitget Wallet Skill API base is not configured. Keep DATA_SOURCE=mock or set BITGET_WALLET_API_BASE."
  if (error instanceof BitgetApiError) return `Bitget Wallet Skill request failed：${error.message}`
  if (error instanceof OkxConfigError) return "OKX_API_KEY、OKX_SECRET_KEY 或 OKX_PASSPHRASE 尚未配置。"
  if (error instanceof OkxApiError) return `OKX API 返回错误：${error.message}`
  if (error instanceof Error && error.message.includes("no complete buy/sell")) {
    return "OKX 已连通，但当前周期内没有足够完整的买入、卖出和K线数据，已切换为模拟数据。建议改选30天或90天。"
  }
  if (error instanceof Error) return error.message
  return "未知错误，已切换为模拟数据。"
}

function configuredDataSource(): DataSource {
  const value = String(process.env.DATA_SOURCE ?? "mock").toLowerCase()
  if (value === "bitget" || value === "okx") return value
  return "mock"
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as AnalyzeWalletPayload
  const payload = {
    walletAddress: body.walletAddress?.trim() || mockWalletAnalysis.walletAddress,
    chain: body.chain || process.env.BITGET_DEFAULT_CHAIN || mockWalletAnalysis.chain,
    period: body.period || mockWalletAnalysis.period,
    tokenAddress: body.tokenAddress?.trim(),
    mode: body.mode ?? (body.tokenAddress ? "token_replay" : "wallet_behavior"),
  }
  const dataSource = configuredDataSource()

  if (dataSource === "bitget" && process.env.BITGET_WALLET_SKILL_ENABLED === "true") {
    try {
      const analysis = await new BitgetAdapter().getWalletAnalysis(payload)
      return NextResponse.json({
        ok: true,
        dataSource: "bitget",
        dataCoverage: analysis.dataCoverage,
        source: "bitget",
        message: analysis.dataCoverage === "full"
          ? "Bitget Wallet Skill data was used for token replay and behavior analysis."
          : "Bitget Wallet Skill data was used where available; incomplete coverage is shown in the dashboard.",
        analysis,
      })
    } catch (error) {
      const message = publicErrorMessage(error)
      console.warn("[analyze-wallet] Bitget analysis fallback:", message)
      return NextResponse.json({
        ok: false,
        dataSource: "bitget",
        dataCoverage: "mock_fallback",
        source: "mock",
        message,
        error: message,
        analysis: fallbackAnalysis(payload, message),
      })
    }
  }

  if (dataSource === "okx") {
    try {
      const adapter = new OkxAdapter()
      const analysis = await adapter.getWalletAnalysis(payload)
      const okxAnalysis: WalletAnalysis = {
        ...analysis,
        dataSource: "okx",
        dataCoverage: "partial",
      }
      return NextResponse.json({
        ok: true,
        dataSource: "okx",
        dataCoverage: okxAnalysis.dataCoverage,
        source: "okx",
        message: "已使用 OKX OnchainOS 交易历史与历史K线生成复盘。",
        analysis: okxAnalysis,
      })
    } catch (error) {
      if (payload.period === "7D" && error instanceof Error && error.message.includes("no complete buy/sell")) {
        try {
          const expandedPayload = { ...payload, period: "30D" }
          const analysis = await new OkxAdapter().getWalletAnalysis(expandedPayload)
          const okxAnalysis: WalletAnalysis = {
            ...analysis,
            dataSource: "okx",
            dataCoverage: "partial",
          }
          return NextResponse.json({
            ok: true,
            dataSource: "okx",
            dataCoverage: okxAnalysis.dataCoverage,
            source: "okx",
            message: "7天内可复盘交易样本不足，已自动扩展到30天并使用 OKX OnchainOS 真实数据生成复盘。",
            analysis: okxAnalysis,
          })
        } catch (expandedError) {
          console.warn("[analyze-wallet] OKX expanded analysis fallback:", publicErrorMessage(expandedError))
        }
      }

      const message = publicErrorMessage(error)
      console.warn("[analyze-wallet] OKX analysis fallback:", message)
      return NextResponse.json({
        ok: false,
        dataSource: "okx",
        dataCoverage: "mock_fallback",
        source: "mock",
        message,
        error: message,
        analysis: fallbackAnalysis(payload, message),
      })
    }
  }

  const analysis = fallbackAnalysis(payload)
  return NextResponse.json({
    ok: true,
    dataSource: "mock",
    dataCoverage: "mock_fallback",
    source: "mock",
    message: "Mock Demo Mode is active. No live Bitget or OKX request was made.",
    analysis,
  })
}
