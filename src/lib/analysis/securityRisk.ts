import type { SecurityRiskSummary } from "@/src/data/mockWalletAnalysis"

function rows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>
    for (const key of ["data", "list", "items"]) {
      const nested = rows(record[key])
      if (nested.length) return nested
    }
    return [record]
  }
  return []
}

function boolish(value: unknown) {
  if (typeof value === "boolean") return value
  const text = String(value ?? "").toLowerCase()
  return text === "true" || text === "1" || text === "yes" || text === "risk"
}

export function analyzeSecurityRisk(securityData: unknown): SecurityRiskSummary {
  const record = rows(securityData)[0]
  if (!record) {
    return {
      riskLevel: "unknown",
      riskFlags: ["security_data_missing"],
      plainEnglishSummary: "Bitget token security data is unavailable for this request.",
    }
  }

  const flags: string[] = []
  const riskChecks = Array.isArray(record.riskChecks) ? record.riskChecks : []
  const warnChecks = Array.isArray(record.warnChecks) ? record.warnChecks : []
  for (const check of [...riskChecks, ...warnChecks]) {
    if (typeof check === "object" && check !== null) {
      const label = (check as Record<string, unknown>).labelName
      if (typeof label === "string") flags.push(label)
    }
  }
  const checks: Array<[string, string]> = [
    ["isHoneypot", "honeypot risk"],
    ["honeypot", "honeypot risk"],
    ["canBlacklist", "blacklist control"],
    ["blacklist", "blacklist control"],
    ["canMint", "mint authority"],
    ["mintable", "mint authority"],
    ["canFreeze", "freeze authority"],
    ["freezeable", "freeze authority"],
    ["proxyContract", "proxy contract"],
  ]
  checks.forEach(([key, label]) => {
    if (boolish(record[key])) flags.push(label)
  })

  const explicit = String(record.riskLevel ?? record.level ?? "").toLowerCase()
  const riskScore = Number(record.riskScore ?? record.score)
  const highRisk = record.highRisk === true || Number(record.riskCount) > 0
  const riskLevel = highRisk || explicit.includes("high") || riskScore >= 70 || flags.length >= 3
    ? "high"
    : explicit.includes("medium") || riskScore >= 35 || flags.length
      ? "medium"
      : explicit.includes("low") || Number.isFinite(riskScore)
        ? "low"
        : "unknown"

  return {
    riskLevel,
    riskFlags: flags.length ? flags : ["no_major_security_flags_normalized"],
    plainEnglishSummary: riskLevel === "high"
      ? "Security context is high risk; behavior scoring should treat this as a sizing and exit-discipline problem, not just a timing mistake."
      : riskLevel === "medium"
        ? "Security context has some caution flags, so the replay should account for token-risk exposure."
        : riskLevel === "low"
          ? "No major security flags were normalized from the available token security data."
          : "Security data shape was not recognized well enough to classify risk.",
  }
}
