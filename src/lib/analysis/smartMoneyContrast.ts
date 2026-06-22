import type { SmartMoneyContrast, TradeReplay } from "@/src/data/mockWalletAnalysis"

type Marker = {
  side: "buy" | "sell" | "hold" | "unknown"
  timestamp?: number
  label?: string
}

function getRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>
    for (const key of ["data", "items", "trades", "list", "rows"]) {
      const rows = getRows(record[key])
      if (rows.length) return rows
    }
  }
  return []
}

function normalizeMarkers(value: unknown): Marker[] {
  return getRows(value).map((row) => {
    const rawSide = String(row.side ?? row.action ?? row.tradeType ?? row.direction ?? "").toLowerCase()
    const side = rawSide.includes("buy") ? "buy" : rawSide.includes("sell") ? "sell" : rawSide.includes("hold") ? "hold" : "unknown"
    const timestamp = Number(row.timestamp ?? row.time ?? row.blockTime ?? row.txTime)
    return {
      side,
      timestamp: Number.isFinite(timestamp) ? timestamp : undefined,
      label: String(row.label ?? row.walletLabel ?? row.category ?? "smart money"),
    }
  })
}

function actionSummary(markers: Marker[]) {
  const buys = markers.filter((marker) => marker.side === "buy").length
  const sells = markers.filter((marker) => marker.side === "sell").length
  if (buys > sells) return "net buying"
  if (sells > buys) return "net selling"
  if (buys || sells) return "mixed"
  return "unknown"
}

export function compareWithSmartMoney(params: {
  trade?: TradeReplay
  smartMoneyData?: unknown
  kolData?: unknown
}): SmartMoneyContrast {
  const smartMarkers = normalizeMarkers(params.smartMoneyData)
  const kolMarkers = normalizeMarkers(params.kolData)
  const smartMoneyAction = actionSummary(smartMarkers)
  const kolAction = actionSummary(kolMarkers)
  const userAction = params.trade ? `${params.trade.realizedPnlPct >= 0 ? "sold winner" : "held into loss"} on ${params.trade.tokenSymbol}` : "no complete user trade"

  let alignmentScore = 50
  if (params.trade?.realizedPnlPct && params.trade.realizedPnlPct > 0 && smartMoneyAction === "net buying") alignmentScore -= 18
  if (params.trade?.realizedPnlPct && params.trade.realizedPnlPct < 0 && smartMoneyAction === "net selling") alignmentScore -= 22
  if (smartMoneyAction === "net buying" && kolAction === "net buying") alignmentScore += 12
  if (smartMoneyAction === "unknown" && kolAction === "unknown") alignmentScore = 50
  alignmentScore = Math.max(0, Math.min(100, alignmentScore))

  const evidence = [
    smartMarkers.length ? `${smartMarkers.length} smart money markers normalized from Bitget data.` : "No smart money markers available.",
    kolMarkers.length ? `${kolMarkers.length} KOL markers normalized from Bitget data.` : "No KOL markers available.",
  ]

  return {
    userAction,
    smartMoneyAction,
    kolAction,
    alignmentScore,
    diagnosis: smartMoneyAction === "unknown"
      ? "Smart money comparison is unavailable for this request, so the app does not infer alignment."
      : alignmentScore < 50
        ? "The user action appears weakly aligned with smart money behavior in this replay window."
        : "The user action is not clearly against the available smart money markers.",
    evidence,
  }
}
