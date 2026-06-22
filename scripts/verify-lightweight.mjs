import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const envExample = read(".env.local.example")
const apiRoute = read("app/api/analyze-wallet/route.ts")
const mockData = read("src/data/mockWalletAnalysis.ts")
const bitgetAdapter = read("src/lib/adapters/bitgetAdapter.ts")
const bitgetClient = read("src/lib/adapters/bitgetClient.ts")

for (const key of [
  "DATA_SOURCE=mock",
  "BITGET_WALLET_SKILL_ENABLED=false",
  "BITGET_WALLET_API_BASE=",
  "BITGET_WALLET_API_TOKEN=",
  "BITGET_DEFAULT_CHAIN=sol",
]) {
  assert(envExample.includes(key), `.env.local.example missing ${key}`)
}

assert(mockData.includes('dataSource: "mock"'), "mock analysis must remain mock-first")
assert(mockData.includes('dataCoverage: "mock_fallback"'), "mock analysis must label fallback coverage")
assert(apiRoute.includes("configuredDataSource"), "API route must branch on DATA_SOURCE")
assert(apiRoute.includes("BITGET_WALLET_SKILL_ENABLED"), "API route must gate Bitget live mode")
assert(apiRoute.includes("ok: false"), "API route must return fallback JSON on adapter failure")
assert(bitgetAdapter.includes("No complete wallet-specific buy/sell pair"), "Bitget adapter must expose missing-pair warnings")
assert(bitgetClient.includes("getSwapQuotePreview"), "Bitget client must support quote preview")
assert(!bitgetClient.includes("swapSend"), "Bitget client must not implement swapSend")
assert(!bitgetClient.includes("orderSubmit"), "Bitget client must not implement orderSubmit")

console.log("Lightweight verification passed: mock mode, Bitget gating, fallback route, and no execution methods are present.")
