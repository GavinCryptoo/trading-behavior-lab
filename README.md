# Trading Behavior Lab — Bitget Wallet Skill Edition

![Trading Behavior Lab Preview](./public/preview.png)

A wallet-based trade replay and behavior analysis copilot powered by Bitget Wallet Skill.

Trading Behavior Lab helps users review historical token trades, compare entries and exits against market movement and smart money behavior, detect missed upside, drawdown habits, early exits, late entries, and generate safer trading rules.

This is not an auto-trading bot. It is a retrospective trading behavior replay and risk-analysis tool.

## Judge Quick Start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The default mock demo works without API keys. It shows the full replay experience, Bitget-style market/security/context cards, fallback labels, what-if simulation, and report card.

To enable Bitget mode, create `.env.local`:

```bash
DATA_SOURCE=bitget
BITGET_WALLET_SKILL_ENABLED=true
BITGET_WALLET_API_BASE=https://bopenapi.bgwapi.io
BITGET_WALLET_API_KEY=<Bitget Wallet API key>
BITGET_WALLET_API_SECRET=<Bitget Wallet API secret>
BITGET_DEFAULT_CHAIN=sol
```

The official Bitget Wallet API client signs read-only requests with `BITGET_WALLET_API_KEY` and `BITGET_WALLET_API_SECRET`. Keep both only in `.env.local`; never commit them.

## What It Does

- Replays historical token trades.
- Scores entry and exit quality.
- Calculates profit capture, missed upside, and maximum drawdown.
- Compares user behavior with smart money / KOL activity.
- Adds security and holder-risk context before judging trade quality.
- Runs what-if simulations for staged take profit, trailing stop, time stop, and capital protection.
- Generates a shareable behavior report card.
- Shows data coverage gaps instead of hiding incomplete data.

## What It Does Not Do

- Does not auto-trade.
- Does not sign transactions.
- Does not custody funds.
- Does not store private keys, seed phrases, or wallet credentials.
- Does not provide guaranteed buy/sell recommendations.
- Does not submit swaps, orders, or fund-moving transactions.
- Does not hide incomplete data coverage.

All fund-moving behavior is disabled / not implemented / human-in-the-loop only.

## Current Status

The default mode remains mock-first so the project can run without any Bitget environment.

- Mock Demo Mode uses `src/data/mockWalletAnalysis.ts`.
- Bitget adapter boundaries are implemented in `src/lib/adapters/bitgetClient.ts` and `src/lib/adapters/bitgetAdapter.ts`.
- Bitget live mode is enabled only when `DATA_SOURCE=bitget` and `BITGET_WALLET_SKILL_ENABLED=true`.
- If Bitget data is missing or an endpoint fails, the API returns fallback-aware JSON instead of crashing the page.
- If full wallet history is unavailable, the main live demo path is Token Replay Mode: `walletAddress + tokenAddress + chain + period`.
- If complete buy/sell pairs are unavailable, the app shows partial analysis and data coverage limitations instead of inventing trades.

## Current Integration Status

| Area | Status |
| --- | --- |
| Mock Demo | Implemented |
| Bitget adapter boundary | Implemented |
| Token Replay mode | Implemented with fallback |
| Wallet Behavior mode | Implemented with fallback |
| Live Bitget API mapping | Pending official endpoint confirmation |
| Swap execution | Intentionally not implemented |

## Demo Modes

### Mock Demo Mode

Default mode. Uses bundled replayable trades with minute-level price paths and Bitget-style context fields.

### Bitget Token Replay Mode

Recommended hackathon demo mode.

Input:

- Wallet address
- Chain
- Token contract address
- Period

Flow:

1. Fetch token info.
2. Fetch token kline.
3. Fetch token transaction list.
4. Filter wallet-specific buy/sell records when supported.
5. Reconstruct replayable trade paths when a complete pair is available.
6. Add security, holder, trading dynamics, and smart money / KOL context.
7. Return full or partial analysis with visible coverage warnings.

### Bitget Wallet Behavior Mode

Uses wallet-level address analysis when available. If complete historical trade replay is unavailable, the app keeps mock replay cards as clearly labeled demo fallback data.

### Fallback Mode

Used when live data, endpoint configuration, or complete trade pairs are unavailable. Fallback data is labeled as `mock_fallback`.

## Bitget Wallet Skill Integration

The adapter reserves and normalizes these Bitget Wallet Skill / Bitget Wallet API data directions:

- Token info
- Security audit
- Kline
- Trading dynamics
- Transaction list
- Holder analysis
- Smart money / KOL markers
- Address analysis
- Quote preview only

`getSwapQuotePreview` is read-only and display-only. There is no `swapSend`, `orderSubmit`, signing, private-key handling, or automated execution path.

If the official Bitget Wallet Skill runtime exposes SDK methods without API keys, keep `BITGET_WALLET_API_TOKEN` blank and wire those SDK calls inside `src/lib/adapters/bitgetClient.ts`. If an HTTP bridge is used, set `BITGET_WALLET_API_BASE` and, only if required by that bridge, `BITGET_WALLET_API_TOKEN`.

## Why This Fits Trading Agent Track

Trading Behavior Lab is a trading behavior analysis agent. It is not generic infra and not a generic chatbot.

The agent takes wallet/token context, reconstructs historical trade behavior when data coverage allows, scores entries and exits, compares user actions with market/security/holder/smart-money context, and turns that evidence into trading rules the user can review before future decisions.

It stays human-in-the-loop: the output is retrospective diagnosis, risk context, and rule generation. It does not sign, submit, custody, or automate trades.

## Product Flow

1. User enters wallet address, chain, optional token contract address, period, and mode.
2. API route checks `DATA_SOURCE`.
3. Mock mode returns local demo analysis.
4. Bitget mode calls the Bitget adapter when explicitly enabled.
5. Adapter normalizes live token, security, holder, market, and smart money context.
6. Analysis modules calculate entry score, exit score, profit capture, drawdown, what-if results, and behavior rules.
7. UI displays data source, coverage, market context, security / holder risk, smart money contrast, replay cards, simulations, and report card.

## Install

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Environment

Copy `.env.local.example` to `.env.local` and fill only the values you need.

```bash
DATA_SOURCE=mock
BITGET_WALLET_SKILL_ENABLED=false
BITGET_WALLET_API_BASE=
BITGET_WALLET_API_KEY=
BITGET_WALLET_API_SECRET=
BITGET_DEFAULT_CHAIN=sol

OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OKX_PROJECT_ID=
```

`DATA_SOURCE` supports:

- `mock`
- `bitget`
- `okx`

Default is `mock`. Bitget mode only runs when both of these are true:

```bash
DATA_SOURCE=bitget
BITGET_WALLET_SKILL_ENABLED=true
```

Do not commit real tokens, keys, secrets, seed phrases, or private keys.

## Hackathon Demo Flow

1. Input a wallet address, chain, token contract address, and `7d` period.
2. Fetch available Bitget token, security, market, holder, and smart money context.
3. Reconstruct the wallet's token replay when a complete buy/sell pair is available.
4. Compare the user's entry/exit with market movement, smart money behavior, holder risk, and security risk.
5. Generate a behavior report with profit capture, missed upside, drawdown, what-if replay, and shareable report card.

## Analysis Model

Each replayable trade can contain:

- Token symbol
- Token address
- Buy time
- Sell time
- Hold duration
- Buy price
- Sell price
- Realized PnL
- Max upside
- Max drawdown
- Profit capture rate
- Entry score
- Exit score
- Mistake tags
- Diagnosis
- Suggested fix
- Minute-level price path
- Smart money / KOL action at entry and exit
- Security and holder-risk context
- Buy/sell pressure
- Market context diagnosis

Additional mistake tags include:

- `FOMO_ENTRY`
- `EARLY_EXIT`
- `LATE_EXIT`
- `HELD_THROUGH_DRAWDOWN`
- `IGNORED_SMART_MONEY_SELLING`
- `BOUGHT_INTO_HOLDER_CONCENTRATION`
- `SOLD_BEFORE_MOMENTUM_EXPANSION`
- `NO_CLEAR_EXIT_RULE`

## Project Structure

```text
app/
  api/analyze-wallet/route.ts     Data-source router and fallback-aware API
  layout.tsx                      App metadata and root layout
  page.tsx                        Main dashboard page

components/dashboard/
  bitget-context-cards.tsx        Data source, market, risk, coverage, and quote cards
  dashboard-header.tsx            Header and language switch
  wallet-input.tsx                Wallet / chain / token / period / mode input
  metric-cards.tsx                Summary metric cards
  overall-diagnosis.tsx           Top diagnosis card
  trading-personality.tsx         Personality module
  drawdown-behavior.tsx           Drawdown analysis panel
  trading-leaks.tsx               Top leaks list
  personalized-rules.tsx          Rule suggestions
  what-if-simulation.tsx          Strategy simulation panel
  trade-replay-cards.tsx          Paginated trade replay cards
  degen-report-card.tsx           Report card component

src/data/
  mockWalletAnalysis.ts           Mock analysis dataset and shared analysis types

src/lib/adapters/
  bitgetClient.ts                 Minimal Bitget Wallet Skill / API request wrapper
  bitgetAdapter.ts                Bitget-to-analysis normalization layer
  types.ts                        Adapter input and normalized data types
  okxAdapter.ts                   Legacy optional OKX adapter
  okxClient.ts                    Legacy optional OKX client wrapper

src/lib/analysis/
  bitgetMarketContext.ts          Market context normalization
  smartMoneyContrast.ts           User vs smart money / KOL comparison
  securityRisk.ts                 Security risk summary
  holderRisk.ts                   Holder concentration summary
  dataCoverage.ts                 Coverage classification and warnings
  calculateEntryScore.ts          Entry score logic
  calculateExitScore.ts           Exit score logic
  profitCapture.ts                Profit capture logic
  tradingPersonality.ts           Personality classification
  tradingLeaks.ts                 Leak detection
  personalizedRules.ts            Rule generation
  whatIfSimulation.ts             What-if simulation strategies
  drawdownBehavior.ts             Drawdown behavior metrics
  reportCard.ts                   Report card generation
```

## Limitations

- Some wallet/token histories may be partial depending on available Bitget data.
- If complete buy/sell pairs are unavailable, the app shows partial analysis instead of inventing trades.
- Wallet Behavior Mode may use mock replay cards as clearly labeled demo fallback data.
- The Bitget HTTP paths in `bitgetClient.ts` are a minimal bridge layer and may need adjustment to match official Wallet Skill SDK or endpoint contracts.
- Quote preview is display-only.
- Analysis is retrospective and educational, not financial advice.
