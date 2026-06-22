import type { DataCoverage, DataCoverageStatus } from "@/src/data/mockWalletAnalysis"

const coverageLabels: Array<[keyof DataCoverageStatus, string]> = [
  ["tokenInfo", "Token info"],
  ["kline", "Kline"],
  ["walletTransactions", "Wallet transactions"],
  ["security", "Security"],
  ["holders", "Holders"],
  ["smartMoneyMarkers", "Smart money markers"],
]

export function evaluateDataCoverage(status: DataCoverageStatus): DataCoverage {
  const values = Object.values(status)
  if (values.every(Boolean)) return "full"
  if (values.some(Boolean)) return "partial"
  return "unsupported"
}

export function buildDataCoverageWarnings(status: DataCoverageStatus) {
  return coverageLabels
    .filter(([key]) => !status[key])
    .map(([, label]) => `${label} data is missing or unavailable for this request.`)
}

export function hasWalletSpecificReplay(status: DataCoverageStatus) {
  return status.tokenInfo && status.kline && status.walletTransactions
}
