import type { BitgetMarketContext } from "@/src/data/mockWalletAnalysis"
import type { NormalizedKlinePoint } from "@/src/lib/adapters/types"

function numberFrom(record: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key]
    const numeric = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return undefined
}

function movement(kline: NormalizedKlinePoint[]) {
  if (kline.length < 2) return 0
  const first = kline[0]?.close ?? 0
  const last = kline[kline.length - 1]?.close ?? 0
  if (!first) return 0
  return ((last - first) / first) * 100
}

function volatility(kline: NormalizedKlinePoint[]) {
  if (!kline.length) return 0
  const closes = kline.map((point) => point.close).filter((value) => Number.isFinite(value) && value > 0)
  if (!closes.length) return 0
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  return min ? ((max - min) / min) * 100 : 0
}

export function buildBitgetMarketContext(params: {
  tokenInfo?: Record<string, unknown>
  tradingDynamics?: Record<string, unknown>
  kline: NormalizedKlinePoint[]
}): BitgetMarketContext {
  const tokenPrice = numberFrom(params.tokenInfo, ["priceUsd", "price", "currentPrice", "lastPrice"])
  const marketCap = numberFrom(params.tokenInfo, ["marketCapUsd", "marketCap", "market_cap", "fdv"])
  const liquidity = numberFrom(params.tokenInfo, ["liquidityUsd", "liquidity", "totalLiquidity", "total_lp_usd"])
  const volume24h = numberFrom(params.tokenInfo, ["volume24hUsd", "volume24h", "volume", "turnover_24h"])
  const dynamics24h = params.tradingDynamics?.["24h"] as Record<string, unknown> | undefined
  const buyPressure = numberFrom(params.tradingDynamics, ["buyPressure", "buyPressurePct", "buyRatio"])
    ?? numberFrom(dynamics24h, ["buy_turnover", "buyAmount"])
  const sellPressure = numberFrom(params.tradingDynamics, ["sellPressure", "sellPressurePct", "sellRatio"])
    ?? numberFrom(dynamics24h, ["sell_turnover", "sellAmount"])
  const movePct = movement(params.kline)
  const volatilityPct = volatility(params.kline)

  return {
    tokenPrice,
    marketCap,
    liquidity,
    volume24h,
    buyPressure,
    sellPressure,
    entryMarketState: buyPressure !== undefined && sellPressure !== undefined && buyPressure > sellPressure
      ? "buy pressure dominant"
      : "entry pressure mixed or unavailable",
    exitMarketState: sellPressure !== undefined && buyPressure !== undefined && sellPressure > buyPressure
      ? "sell pressure dominant"
      : "exit pressure not clearly bearish",
    momentumState: movePct > 25 ? "positive expansion" : movePct < -20 ? "negative drift" : "range or insufficient movement",
    liquidityState: liquidity === undefined ? "unknown liquidity" : liquidity >= 1_000_000 ? "liquid enough for small review sample" : "thin liquidity",
    volatilityState: volatilityPct > 80 ? "high volatility" : volatilityPct > 25 ? "moderate volatility" : "low or unknown volatility",
  }
}
