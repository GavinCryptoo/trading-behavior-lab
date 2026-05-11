# Trading Behavior Lab Skill

交易行为实验室

## Skill Idea

Trading Behavior Lab is a wallet trade replay coach prototype. The core idea is:

Most tools tell users what to buy next. Trading Behavior Lab helps users understand what happened in their previous trades.

The Skill analyzes wallet trade behavior and presents a replay-style report: entry quality, exit quality, profit capture, missed upside, drawdown behavior, repeated mistakes, and strategy alternatives.

## Current Implementation Status

This submission is a mock-first frontend prototype.

- It uses mock wallet trade data to demonstrate the full analysis flow.
- It includes analysis functions and adapter boundaries for future OKX OnchainOS / Solana data integration.
- It includes optional server-side adapter code, but live data availability depends on server credentials, API access, wallet coverage, and usable price-path data.
- If data retrieval fails or credentials are not configured, the app falls back to mock analysis instead of breaking the user experience.
- No real API keys should be included in the Skill package.

## Intended Users

- Meme-token traders who want to review past behavior.
- Wallet users who want to understand repeated mistakes.
- Traders who sell winners too early or hold losers too long.
- Users who want a shareable, screenshot-friendly behavior report.

## Trigger / Entry Point

The user opens the web app and enters:

- Wallet address
- Chain: Solana or X Layer
- Period: 7D, 30D, or 90D

Current default behavior:

- No wallet data is shown before address input.
- After Analyze is clicked, the app shows a loading state.
- The analysis route returns either an OKX-backed response when available or a mock fallback response.

## Core Logic

The analysis is built around a `WalletAnalysis` object:

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

Each replayable trade includes:

- Token symbol and address
- Buy and sell time
- Buy and sell price
- Hold duration
- Realized PnL
- Max upside
- Max drawdown
- Post-buy high and low
- Profit capture rate
- Entry score
- Exit score
- Mistake tags
- Diagnosis
- Suggested fix
- Minute-level price path

## Analysis Functions

The Skill uses deterministic analysis helpers:

- `calculateEntryScore(trade)`
- `calculateExitScore(trade)`
- `calculateProfitCaptureRate(trade)`
- `analyzeTradingPersonality(trades)`
- `analyzeTradingLeaks(trades)`
- `buildPersonalizedRules(trades)`
- `analyzeDrawdownBehavior(trades)`
- `buildWhatIfSimulation(trades)`
- `generateReportCard(walletAnalysis)`

These functions are currently suitable for product demonstration and behavioral coaching UI. They are not presented as audited financial or trading models.

## Output Format

The app returns a dashboard-style report with:

1. Overall Diagnosis
   - Main leak
   - One-line diagnosis
   - Key fix
   - Evidence list

2. Metric Cards
   - Total trades
   - Win rate
   - Realized PnL
   - Average hold time
   - Profit capture rate
   - Max missed upside
   - Average winner hold
   - Average loser hold
   - Trading personality
   - Grade

3. Trading Personality
   - Label such as Profit Leaker, Paper Hand Sniper, Diamond Bagholder, etc.
   - Explanation
   - Evidence-based behavior traits

4. What If Replay Simulation
   - Actual result
   - Strategy comparison
   - Best alternative
   - Improvement potential
   - AI-style insight

5. Report Card
   - Wallet summary
   - Personality
   - Win rate
   - Profit capture
   - Biggest leak
   - Suggested fix
   - Roast/commentary

6. Trade Replay Cards
   - Paginated cards
   - Diagnosis
   - Main mistake
   - Profit capture rate
   - Suggested fix
   - Mini price path
   - Per-trade what-if detail

## What If Replay Simulation

The Skill simulates four exit strategies against each trade's price path.

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

The simulation is for replay and coaching. It does not imply future performance and does not execute trades.

## Fallback Handling

The `/api/analyze-wallet` route follows this flow:

1. Parse wallet address, chain, and period.
2. Attempt adapter-backed analysis when server-side configuration is available.
3. If the 7D window has too little replayable data, optionally retry with 30D.
4. If the adapter cannot return usable buy/sell pairs and price paths, return mock fallback analysis.
5. The UI displays the data source message so the user knows whether they are seeing adapter-backed data or mock fallback data.

Fallback examples:

- Missing server credentials
- API request error
- No complete buy/sell round trip
- Missing price path / historical candles
- Unsupported or low-coverage token data

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
Use staged take-profit and activate trailing stop after large unrealized gains.
```

## Example Chinese UI Phrases

```text
你的主要漏洞：盈利单卖太早
关键修复：使用分批止盈，并在浮盈翻倍后启用移动止盈。
这笔接近持平，不代表盈利。
当前展示 5 张复盘卡，共覆盖 59 笔交易。
```

## Safety Notes

- The Skill does not provide buy/sell recommendations.
- The Skill does not connect to user wallets for signing.
- The Skill does not execute swaps or transactions.
- The Skill should not store API keys in the repository.
- The Skill should label mock or fallback data clearly.

## Future Integration Direction

- Production-grade OKX OnchainOS integration
- Solana transaction parser
- Token classification improvements
- Better price-path reconstruction
- Fee, slippage, and priority-fee cost model
- More robust pagination and historical coverage
- Exportable report cards

