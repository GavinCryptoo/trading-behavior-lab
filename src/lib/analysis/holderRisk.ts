import type { HolderRiskSummary, RiskLevel } from "@/src/data/mockWalletAnalysis"

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>
  return undefined
}

function rows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
  const record = asRecord(value)
  if (!record) return []
  for (const key of ["holders", "items", "list", "data", "topHolders"]) {
    const nested = rows(record[key])
    if (nested.length) return nested
  }
  return [record]
}

function numberFrom(record: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key]
    const numeric = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return undefined
}

function concentrationLevel(value?: number): RiskLevel {
  if (value === undefined) return "unknown"
  const pct = value > 1 ? value : value * 100
  if (pct >= 45) return "high"
  if (pct >= 20) return "medium"
  return "low"
}

export function analyzeHolderRisk(holderData: unknown): HolderRiskSummary {
  const record = asRecord(holderData)
  const holderRows = rows(holderData)
  const topHolderPct = numberFrom(record, ["topHolderPct", "topHolderRatio", "top10HolderRatio", "top10Pct", "concentrationPct"])
    ?? numberFrom(holderRows[0], ["percentage", "pct", "ratio"])
  const level = concentrationLevel(topHolderPct)
  const lowerText = JSON.stringify(holderData ?? {}).toLowerCase()
  const smartMoneyHolderPresence = lowerText.includes("smart")
  const cexHolderPresence = lowerText.includes("cex") || lowerText.includes("exchange")
  const suspiciousConcentration = level === "high" || lowerText.includes("suspicious") || lowerText.includes("cluster")

  return {
    topHolderConcentrationLevel: level,
    smartMoneyHolderPresence,
    cexHolderPresence,
    suspiciousConcentration,
    diagnosis: level === "high"
      ? "Top-holder concentration appears elevated; late entries or oversized positions should be treated as behavior risk."
      : level === "medium"
        ? "Holder concentration is moderate, so entry timing and position sizing need extra context."
        : level === "low"
          ? "Holder concentration does not appear to dominate the trade diagnosis."
          : "Holder distribution data is unavailable or not recognized.",
  }
}
