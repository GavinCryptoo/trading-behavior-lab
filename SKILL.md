---
name: bitget-trading-behavior-lab
title: Trading Behavior Lab - Bitget Wallet Skill Edition
title_zh: Bitget 交易行为实验室
description: Wallet-based trade replay and behavior analysis copilot powered by Bitget Wallet Skill.
version: 0.2.0
status: hackathon-prototype
language: en
ui_languages:
  - en
  - zh
primary_source: Bitget Wallet Skill
current_data_mode: mock-first with Bitget adapter fallback
execution_mode: analysis-only
does_not:
  - auto-trade
  - sign transactions
  - custody funds
  - store private keys or seed phrases
  - submit swaps or orders
---

# Trading Behavior Lab Skill

## Skill Name

`bitget-trading-behavior-lab`

## Purpose

Trading Behavior Lab is a wallet-based trade replay and behavior analysis copilot powered by Bitget Wallet Skill.

It helps users review historical token trades, compare entries and exits against market movement and smart money behavior, detect missed upside, drawdown habits, early exits, late entries, and generate safer trading rules.

The product story is behavior diagnosis, not alpha discovery and not automated trading. The user should learn why they bought late, sold early, held through drawdown, ignored smart money selling, or entered a token with poor holder/security context.

## Trigger Examples

- Analyze my wallet behavior on Solana for the last 7 days.
- Replay my trade on this token and tell me if I sold too early.
- Compare my exit with smart money activity.
- Check whether holder concentration made this trade risky.
- Generate a shareable behavior report card.
- 分析我过去 7 天的钱包交易行为。
- 复盘这个 token，看看我是不是卖飞了。
- 对比我的卖点和 smart money 行为。
- 看看 holder 集中度是不是让这笔交易变危险。

## Input Schema

```json
{
  "walletAddress": "string, required",
  "chain": "sol | base | bnb | ethereum | arbitrum | polygon",
  "tokenAddress": "string, optional but recommended for Bitget Token Replay Mode",
  "period": "24h | 7d | 30d",
  "mode": "token_replay | wallet_behavior"
}
```

Recommended Bitget hackathon input:

```json
{
  "walletAddress": "wallet address",
  "chain": "sol",
  "tokenAddress": "token contract address",
  "period": "7d",
  "mode": "token_replay"
}
```

## Output Schema

```json
{
  "ok": true,
  "dataSource": "mock | bitget | okx",
  "dataCoverage": "full | partial | mock_fallback | unsupported",
  "analysis": {
    "walletAddress": "string",
    "chain": "string",
    "period": "string",
    "mode": "token_replay | wallet_behavior",
    "summary": {
      "totalTrades": 0,
      "winRate": 0,
      "realizedPnlUsd": 0,
      "realizedPnlPct": 0,
      "profitCaptureRate": 0,
      "maxMissedUpside": 0,
      "averageMaxDrawdown": 0,
      "grade": "string"
    },
    "bitgetMeta": {
      "chain": "string",
      "walletAddress": "string",
      "tokenAddress": "string",
      "tokenInfo": {},
      "securitySummary": {},
      "holderSummary": {},
      "tradingDynamics": {},
      "marketContext": {},
      "smartMoneySummary": {},
      "kolSummary": {},
      "quotePreview": {},
      "dataCoverageStatus": {},
      "warnings": []
    },
    "trades": [],
    "leaks": [],
    "rules": [],
    "whatIf": {},
    "reportCard": {}
  }
}
```

Failure shape:

```json
{
  "ok": false,
  "dataSource": "bitget",
  "dataCoverage": "mock_fallback",
  "error": "fallback-aware error message",
  "analysis": {
    "dataSource": "mock",
    "dataCoverage": "mock_fallback"
  }
}
```

## Supported Modes

### Mock Demo Mode

Default mode. Uses local replayable trade samples and deterministic analysis logic. This allows reviewers to run the project without live credentials or Wallet Skill runtime setup.

### Bitget Token Replay Mode

Primary hackathon demo mode.

Input:

- `walletAddress`
- `chain`
- `tokenAddress`
- `period`

Execution:

1. Fetch token info.
2. Fetch token kline.
3. Fetch token transactions.
4. Filter wallet-specific transactions if the Bitget data exposes address filtering or address fields.
5. Reconstruct complete buy/sell pairs only when available.
6. Add security audit, holder analysis, trading dynamics, smart money markers, KOL markers, and quote preview.
7. Produce full or partial replay analysis.

If complete buy/sell pairs are unavailable, do not invent trades. Return partial analysis and show the limitation in the Data Coverage card.

### Bitget Wallet Behavior Mode

Uses address analysis / PnL / style / operation data when available.

If full historical wallet trades cannot be fetched, do not claim full coverage. Use mock replay cards as clearly labeled demo fallback data and keep wallet-level Bitget context separate.

### Fallback Mode

Used when Bitget endpoints fail, required data is missing, or adapter configuration is unavailable. The UI must label this as `mock_fallback`.

## Bitget Data Tools Used

Reserved adapter methods in `src/lib/adapters/bitgetClient.ts`:

- `getTokenInfo(params)`
- `getTokenSecurity(params)`
- `getTokenKline(params)`
- `getTokenTradingDynamics(params)`
- `getTokenTransactions(params)`
- `getTokenHolders(params)`
- `getSmartMoneyOrKolTrades(params)`
- `getAddressAnalysis(params)`
- `getSwapQuotePreview(params)`

`getSwapQuotePreview` is quote-only. It must never execute a swap.

The current HTTP paths are a minimal bridge layer and may need to be mapped to official Bitget Wallet Skill SDK functions or endpoint contracts before a production deployment.

## Analysis Modules

Bitget-specific modules:

- `bitgetMarketContext.ts`: entry market state, exit market state, momentum state, liquidity state, volatility state.
- `smartMoneyContrast.ts`: user action vs smart money / KOL behavior, alignment score, diagnosis, evidence.
- `securityRisk.ts`: risk level, flags, plain-English summary.
- `holderRisk.ts`: top-holder concentration, CEX holder presence, smart-money holder presence, suspicious concentration.
- `dataCoverage.ts`: full, partial, mock fallback, unsupported coverage classification.

Core replay modules:

- Entry score
- Exit score
- Profit capture
- Drawdown behavior
- Trading personality
- Trading leaks
- Personalized rules
- What-if replay simulation
- Shareable report card

## Safety Policy

This Skill is analysis-only.

Allowed:

- Read historical wallet/token/market context.
- Normalize complete historical buy/sell pairs.
- Score past entries and exits.
- Compare user behavior with smart money / KOL markers.
- Show security and holder-risk context.
- Simulate retrospective what-if exit rules.
- Display quote preview only.
- Generate educational report cards.

Not allowed:

- Auto-trading.
- Transaction signing.
- Private-key or seed-phrase handling.
- Custody.
- Swap execution.
- Order submission.
- Autonomous buy/sell recommendations.
- Hiding incomplete data coverage.

Every fund-moving action must remain disabled / not implemented / human-in-the-loop only.

## Fallback Behavior

Fallback rules:

1. Default `DATA_SOURCE=mock`.
2. Bitget mode only runs when `DATA_SOURCE=bitget` and `BITGET_WALLET_SKILL_ENABLED=true`.
3. If `BITGET_WALLET_API_BASE` is not configured, return mock fallback.
4. If a Bitget endpoint fails, keep the page alive and show the warning.
5. If token info exists but wallet-specific trades are missing, return partial data and do not invent trades.
6. If Wallet Behavior Mode cannot fetch complete historical trades, use mock replay cards as demo fallback data.
7. Always expose `dataCoverage` and `bitgetMeta.warnings`.

## Environment

```bash
DATA_SOURCE=mock
BITGET_WALLET_SKILL_ENABLED=false
BITGET_WALLET_API_BASE=
BITGET_WALLET_API_TOKEN=
BITGET_DEFAULT_CHAIN=sol
```

Optional legacy OKX variables remain only for the old adapter path:

```bash
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OKX_PROJECT_ID=
```

Do not include real API tokens, secrets, private keys, seed phrases, or wallet credentials in the repository.

## Example Prompts

1. Analyze my wallet behavior on Solana for the last 7 days.
2. Replay my trade on this token and tell me if I sold too early.
3. Compare my exit with smart money activity.
4. Check whether holder concentration made this trade risky.
5. Generate a shareable behavior report card.

## Reviewer Notes

- The default runnable demo is mock-first.
- Bitget Token Replay Mode is the intended live-data story.
- Incomplete wallet/token histories are expected in some cases and must be shown as partial coverage.
- The project is not production trading infrastructure.
- The Skill should be evaluated as a behavior replay and risk-analysis copilot, not as an execution agent.
