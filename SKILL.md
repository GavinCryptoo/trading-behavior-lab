---
name: trading-behavior-lab
title: Trading Behavior Lab
title_zh: 交易行为实验室
description: Open-source wallet trading behavior analysis through replay cards, behavioral diagnosis, and what-if exit simulations.
version: 0.1.0
status: open-source prototype
language: en
ui_languages:
  - en
  - zh
primary_source: wallet analytics with optional OKX-style adapter path
current_data_mode: mock-first demo with adapter fallback
execution_mode: analysis-only
does_not:
  - provide direct buy or sell recommendations
  - execute trades
  - sign wallet transactions
  - custody assets
---

# Trading Behavior Lab Skill

交易行为实验室

## Summary

Trading Behavior Lab is an open-source, analysis-only tool for wallet trade behavior replay.

The core innovation is shifting from alpha discovery to trader behavior analysis. Instead of asking "what should I buy next?", the Skill helps users inspect why previous trades underperformed: weak exits, missed upside, poor profit protection, long loser holds, and repeated behavioral leaks.

## Current Implementation Status

This project currently uses mock wallet trade data to demonstrate the full analysis flow, with an optional adapter path for OKX-style wallet history and market data experiments.

Important implementation notes:

- Current data mode: mock-first frontend demo with fallback labels.
- OKX-style adapter: present as an adapter boundary / optional server-side path.
- The project should not be represented as a completed production data integration unless the adapter is configured and verified for the target wallet.
- No real API keys should be included in the package.
- If adapter-backed data is unavailable, the app uses fallback mock analysis and labels the data source.

## OKX OnchainOS Requirement Alignment

The intended production direction is to use OKX OnchainOS as the primary information source for wallet transaction history and on-chain market context.

Planned OnchainOS usage:

1. Fetch wallet transaction history.
2. Normalize token buy/sell events.
3. Identify complete round-trip token trades.
4. Use OKX / OnchainOS market data or historical candles to reconstruct price paths.
5. Feed those normalized trades into the deterministic behavior analysis layer.

Trading tool boundary:

- This Skill is analysis-only in the current version.
- It does not execute swaps or automatically trade.
- Future versions may link users to OKX trading surfaces or transaction tooling only after explicit safety review and clear user confirmation flows.

## Trigger Description

The Skill should trigger when the user asks to analyze or replay a wallet's past trading behavior.

### English Trigger Examples

- "Analyze this wallet's trading behavior."
- "Replay my Solana wallet trades."
- "Why did this wallet lose money?"
- "Show me if I sold too early."
- "What mistakes does this wallet keep making?"
- "Run a what-if replay for this wallet."
- "Generate a trading behavior report card."
- "Check profit capture and missed upside for this address."

### Chinese Trigger Examples

- "分析这个钱包的交易行为。"
- "复盘这个 Solana 钱包。"
- "看看这个钱包为什么亏。"
- "我是不是经常卖飞？"
- "帮我分析这个地址的交易漏洞。"
- "给这个钱包做回放模拟。"
- "生成交易行为成绩单。"
- "看一下利润捕获率和最大卖飞。"

## Input Parameters

Expected user inputs:

- `walletAddress`: wallet address to analyze
- `chain`: `Solana` or `X Layer`
- `period`: `7D`, `30D`, or `90D`

The current UI starts empty. It does not load a default wallet before user input.

## Complete Execution Flow

1. Receive wallet address, chain, and period.
2. Show loading state so the user knows analysis is running.
3. Attempt adapter-backed analysis when server-side configuration and compatible data are available.
4. If using future OKX OnchainOS integration:
   - Fetch wallet transaction history.
   - Page through transaction results with bounded limits.
   - Filter irrelevant records such as failed transactions, pure SOL transfers, stablecoin transfers, and incomplete token events.
   - Group token events by token contract address.
   - Detect complete buy-then-sell round trips.
   - Fetch or reconstruct price path data for each replayable trade.
5. Normalize each trade into `TradeReplay`.
6. Run deterministic analysis functions:
   - entry score
   - exit score
   - profit capture rate
   - drawdown behavior
   - trading personality
   - trading leaks
   - personalized rules
   - what-if strategy simulation
7. Build a `WalletAnalysis` object.
8. Render structured dashboard sections:
   - Overall diagnosis
   - Summary metric cards
   - Trading personality
   - Drawdown behavior
   - Top leaks
   - Personalized rules
   - What If Replay Simulation
   - Report card
   - Paginated trade replay cards
9. Clearly label data source or fallback status.

## Core Data Structure

```ts
WalletAnalysis {
  walletAddress: string
  chain: string
  period: string
  summary: WalletSummary
  personality: TradingPersonality
  trades: TradeReplay[]
  leaks: TradingLeak[]
  rules: PersonalizedRule[]
  whatIf: WhatIfSimulation
  reportCard: DegenReportCard
}
```

Each `TradeReplay` can include:

- token symbol and address
- buy time and sell time
- buy price and sell price
- hold duration
- realized PnL
- max upside
- max drawdown
- profit capture rate
- entry score
- exit score
- mistake tags
- diagnosis
- suggested fix
- minute-level price path

## Core Analysis Logic

The Skill uses deterministic helper functions:

- `calculateEntryScore(trade)`
- `calculateExitScore(trade)`
- `calculateProfitCaptureRate(trade)`
- `analyzeTradingPersonality(trades)`
- `analyzeTradingLeaks(trades)`
- `buildPersonalizedRules(trades)`
- `analyzeDrawdownBehavior(trades)`
- `buildWhatIfSimulation(trades)`
- `generateReportCard(walletAnalysis)`

Instruction quality principles:

- Ground every conclusion in observed trade data.
- Separate behavior diagnosis from trading advice.
- Use clear labels for estimated, simulated, mock, or fallback values.
- Avoid saying that a wallet is profitable or unprofitable beyond the available sample.
- Avoid token recommendations.
- Avoid execution instructions such as "buy", "sell now", or "enter this trade".

## What If Replay Simulation

The Skill compares actual exits against four retrospective rule-based exit strategies.

### Strategy A: Staged Take Profit

- TP1 +80%, sell 30%
- TP2 +150%, sell 30%
- TP3 +300%, sell 30%
- Remaining 10% moonbag
- Stop loss -30%

### Strategy B: Trailing Stop

- Activates after unrealized PnL exceeds +100%
- Exits after a 35% pullback from peak
- Stop loss -30%

### Strategy C: Time Stop

- If the trade does not exceed +30% within 20 minutes, exit
- Stop loss -30%
- If the trade reaches +100%, sell at least 50%

### Strategy D: Capital Protection

- After +50%, protect breakeven
- After +100%, protect +20%
- After +200%, protect +80%

Simulation boundaries:

- The simulation is retrospective.
- It does not predict future performance.
- It does not execute orders.
- It should be described as "what would have happened on this historical path", not as a future trading strategy guarantee.

## Structured Output

Preferred output shape:

```json
{
  "walletAddress": "string",
  "chain": "Solana",
  "period": "30D",
  "dataSource": "mock | okx-onchainos | fallback",
  "summary": {
    "totalTrades": 0,
    "winRate": 0,
    "realizedPnlPct": 0,
    "profitCaptureRate": 0,
    "maxMissedUpside": 0,
    "avgWinnerHold": "0m",
    "avgLoserHold": "0m",
    "grade": "C+"
  },
  "diagnosis": {
    "mainLeak": "string",
    "oneLineDiagnosis": "string",
    "keyFix": "string",
    "evidence": []
  },
  "whatIf": {
    "actualResultPct": 0,
    "bestAlternativeStrategy": "string",
    "improvementPotentialPct": 0,
    "strategyResults": []
  },
  "trades": []
}
```

UI output sections:

1. Overall Diagnosis
2. Metric Cards
3. Trading Personality
4. Drawdown Behavior
5. Top Trading Leaks
6. Personalized Rules
7. What If Replay Simulation
8. Report Card
9. Paginated Trade Replay Cards

## Fallback Behavior

Fallback is required for a stable user experience.

The Skill should fallback when:

- API credentials are missing.
- OKX / OnchainOS request fails.
- Rate limits or temporary network errors occur.
- Wallet has no complete buy/sell round trips in the selected window.
- Historical candle or price-path data is unavailable.
- Token metadata is incomplete.

Fallback behavior:

1. Do not crash the UI.
2. Return mock analysis only when live data cannot produce a complete analysis.
3. Show a visible data source message.
4. Avoid presenting fallback output as real wallet analysis.
5. For a 7D window with too little replayable data, retry 30D before fallback.

Example fallback message:

```text
Data source: mock fallback.
Reason: no complete buy/sell token pairs with usable price paths were available for the selected period.
```

Chinese fallback example:

```text
数据来源：模拟数据。
原因：当前周期内没有足够完整的买入、卖出和K线数据。
```

## Token Efficiency, Caching, and Performance

Token efficiency strategy:

- Use compact structured summaries instead of dumping full transaction history.
- Only send normalized trade fields to the analysis layer.
- Keep verbose raw transaction data out of user-facing output.
- Paginate replay cards instead of rendering every trade at once.
- Limit what-if detail to the selected sample or current page.

Caching strategy for future OnchainOS integration:

- Cache wallet transaction pages by `walletAddress + chain + period`.
- Cache token candle data by `chain + tokenAddress + timeWindow`.
- Cache normalized `TradeReplay` objects separately from raw transactions.
- Use short TTLs for recent periods and longer TTLs for older historical windows.
- Reuse cached price paths for repeated what-if simulations.

Performance strategy:

- Bound transaction pagination.
- Bound replay-card count per page.
- Retry rate-limited requests with small backoff.
- Avoid repeated price-path fetches for the same token/time window.
- Display loading state immediately after analysis starts.
- Return fallback output rather than blocking indefinitely.

## Human Review Criteria Alignment

### Strategy Executability

The Skill produces concrete behavior rules such as:

- "If unrealized PnL exceeds +80%, sell at least 30%."
- "If a position reaches +100%, do not let final realized PnL fall below +20%."
- "If there is no +30% move within 20 minutes, reduce confidence."

These are retrospective improvement rules, not automatic trade instructions.

### Strategy Result Effectiveness

The Skill compares actual historical exits against simulated alternatives on the same price path. It reports improvement potential as retrospective analysis only.

### Strategy Theme Innovation

The innovation is behavior analysis rather than alpha discovery:

- Not "find the next token"
- Not "copy this wallet"
- Not "auto-trade"
- Instead: "understand why the previous trades failed or underperformed"

## Safety Boundaries

- Analysis-only Skill.
- No direct buy/sell recommendations.
- No automatic trading.
- No wallet signing.
- No custody.
- No guaranteed returns.
- No claim that what-if strategies predict future results.

## Example Output

```text
Trading Personality: Profit Leaker

Core Diagnosis:
You are not bad at finding entries. Your main leak is exit discipline.

Evidence:
- Average profit capture rate: 34%
- Max missed upside: +290%
- Winner hold time is much shorter than loser hold time

What If Replay:
Actual Result: -5%
Staged Take Profit: -22%
Trailing Stop: -22%
Time Stop: -22%
Capital Protection: -22%

Main Leak:
Selling winners too early

Suggested Fix:
Use staged take-profit as a review rule for future planning. This is not an instruction to trade immediately.
```

## Example Chinese Output

```text
你的主要漏洞：盈利单卖太早
关键修复：复盘时重点检查分批止盈和移动止盈纪律。
数据来源：模拟数据 / OKX OnchainOS / fallback
当前展示 5 张复盘卡，共覆盖 59 笔交易。
```

## Future Integration Plan

- Use OKX OnchainOS as the primary transaction history source.
- Use OKX market/candle data to reconstruct price paths.
- Improve token classification and stablecoin filtering.
- Add fee, slippage, gas, and priority-fee estimates.
- Expand historical pagination and cache normalized replay data.
- Keep all trading actions outside the Skill unless separately reviewed and explicitly confirmed by the user.
