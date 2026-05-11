import { NextRequest, NextResponse } from "next/server"
import { mockWalletAnalysis, type WalletAnalysis } from "@/src/data/mockWalletAnalysis"
import { OkxAdapter } from "@/src/lib/adapters/okxAdapter"
import { OkxApiError, OkxConfigError } from "@/src/lib/adapters/okxClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AnalyzeWalletPayload = {
  walletAddress?: string
  chain?: string
  period?: string
}

function fallbackAnalysis(payload: Required<AnalyzeWalletPayload>): WalletAnalysis {
  return {
    ...mockWalletAnalysis,
    walletAddress: payload.walletAddress,
    chain: payload.chain,
    period: payload.period,
  }
}

function publicErrorMessage(error: unknown) {
  if (error instanceof OkxConfigError) return "OKX_API_KEY、OKX_SECRET_KEY 或 OKX_PASSPHRASE 尚未配置。"
  if (error instanceof OkxApiError) return `OKX API 返回错误：${error.message}`
  if (error instanceof Error && error.message.includes("no complete buy/sell")) {
    return "OKX 已连通，但当前周期内没有足够完整的买入、卖出和K线数据，已切换为模拟数据。建议改选30天或90天。"
  }
  if (error instanceof Error) return error.message
  return "未知错误，已切换为模拟数据。"
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as AnalyzeWalletPayload
  const payload = {
    walletAddress: body.walletAddress?.trim() || mockWalletAnalysis.walletAddress,
    chain: body.chain || mockWalletAnalysis.chain,
    period: body.period || mockWalletAnalysis.period,
  }

  try {
    const adapter = new OkxAdapter()
    const analysis = await adapter.getWalletAnalysis(payload)
    return NextResponse.json({
      source: "okx",
      message: "已使用 OKX OnchainOS 交易历史与历史K线生成复盘。",
      analysis,
    })
  } catch (error) {
    if (payload.period === "7D" && error instanceof Error && error.message.includes("no complete buy/sell")) {
      try {
        const expandedPayload = { ...payload, period: "30D" }
        const analysis = await new OkxAdapter().getWalletAnalysis(expandedPayload)
        return NextResponse.json({
          source: "okx",
          message: "7天内可复盘交易样本不足，已自动扩展到30天并使用 OKX OnchainOS 真实数据生成复盘。",
          analysis,
        })
      } catch (expandedError) {
        console.warn("[analyze-wallet] OKX expanded analysis fallback:", publicErrorMessage(expandedError))
      }
    }

    console.warn("[analyze-wallet] OKX analysis fallback:", publicErrorMessage(error))
    return NextResponse.json({
      source: "mock",
      message: publicErrorMessage(error),
      analysis: fallbackAnalysis(payload),
    })
  }
}
