# Trading Behavior Lab

交易行为实验室

Trading Behavior Lab is a Web3 wallet trade replay prototype. It is designed to help users review past wallet trading behavior instead of recommending what to buy next.

The current app focuses on a complete frontend demo and analysis workflow: wallet input, summary metrics, trading personality, trade replay cards, what-if simulations, trading leaks, personalized rules, and a shareable report card.

## Current Status

This project is a prototype.

- The default/public demo path uses mock wallet trade data to demonstrate the full analysis flow.
- The repository includes a server-side OKX adapter and adapter interfaces for future data integration, but the app should be treated as mock-first unless valid server-side API credentials and compatible wallet data are configured.
- No API keys are included in the repository.
- This is not a trading bot, signal tool, wallet, or financial advice product.

## Features

- Wallet address input with chain and period selection.
- Empty initial state: no default wallet data is shown before a user submits an address.
- Wallet summary cards:
  - Total trades
  - Win rate
  - Realized PnL
  - Average hold time
  - Profit capture rate
  - Max missed upside
  - Winner/loser hold behavior
  - Trading personality
  - Overall grade
- Overall diagnosis card.
- Trading personality module with evidence-based explanations.
- Drawdown behavior analysis.
- Top trading leaks.
- Personalized trading rules.
- What If Replay Simulation:
  - Staged Take Profit
  - Trailing Stop
  - Time Stop
  - Capital Protection
- Degen/report card style summary for sharing.
- Paginated trade replay cards.
- Chinese and English UI toggle.
- Server fallback flow: if real data is unavailable, the app returns mock analysis instead of breaking the UI.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI primitives
- lucide-react icons
- undici for optional server-side proxy-aware requests

## Installation

```bash
npm install
```

The repository contains a `pnpm-lock.yaml` because the original generated project used pnpm. The package scripts are standard npm scripts, so `npm install`, `npm run dev`, and `npm run build` are valid.

## Run Locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Start Production Build

```bash
npm run start
```

## Environment Variables

Do not commit real API keys.

Use `.env.local.example` as the template:

```bash
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OKX_PROJECT_ID=
```

`.env.local` is ignored by git.

Without server-side credentials, the app uses mock/fallback data for demonstration.

## Project Structure

```text
app/
  api/analyze-wallet/route.ts     Server route for wallet analysis and fallback
  layout.tsx                      App metadata and root layout
  page.tsx                        Main dashboard page

components/dashboard/
  dashboard-header.tsx            Brand header and language switch
  wallet-input.tsx                Wallet input form
  metric-cards.tsx                Summary metrics
  overall-diagnosis.tsx           Top-level diagnosis card
  trading-personality.tsx         Personality view
  drawdown-behavior.tsx           Drawdown behavior panel
  trading-leaks.tsx               Leak list
  personalized-rules.tsx          Rule recommendations
  what-if-simulation.tsx          Strategy comparison panel
  trade-replay-cards.tsx          Paginated trade replay cards
  degen-report-card.tsx           Shareable report card component

src/data/
  mockWalletAnalysis.ts           Mock wallet analysis dataset and shared types

src/lib/analysis/
  calculateEntryScore.ts          Entry quality scoring
  calculateExitScore.ts           Exit quality scoring
  profitCapture.ts                Profit capture and giveback logic
  tradingPersonality.ts           Personality classification
  tradingLeaks.ts                 Trading leak detection
  personalizedRules.ts            Rule generation
  whatIfSimulation.ts             What-if replay strategies
  drawdownBehavior.ts             Drawdown behavior metrics
  reportCard.ts                   Report card generation

src/lib/adapters/
  okxAdapter.ts                   Optional OKX-style data adapter scaffold
  okxClient.ts                    Optional signed OKX client wrapper
  solanaAdapter.ts                Reserved Solana adapter interface
```

## Analysis Model

The prototype treats each trade as a replayable object with:

- Buy and sell timestamps
- Buy and sell prices
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

The scoring and simulation functions are deterministic and currently designed for demo-quality analysis, not institutional backtesting accuracy.

## What If Replay Simulation

The simulation compares actual exits against four simple strategy models:

1. Staged Take Profit
   - TP1 +80%, sell 30%
   - TP2 +150%, sell 30%
   - TP3 +300%, sell 30%
   - Remaining 10% moonbag
   - Stop loss -30%

2. Trailing Stop
   - Activates after +100% unrealized PnL
   - Exits after a 35% pullback from peak
   - Stop loss -30%

3. Time Stop
   - Exits if the trade does not reach +30% within 20 minutes
   - Stop loss -30%
   - Sells at least 50% after +100%

4. Capital Protection
   - Protects breakeven after +50%
   - Protects +20% after +100%
   - Protects +80% after +200%

## Future Integration Direction

Planned integration areas:

- OKX OnchainOS wallet transaction history
- OKX DEX/token market data
- Solana RPC transaction parsing
- DEX K-line or price-history providers
- More robust token classification and stablecoin filtering
- Better cost model for fees, slippage, and priority fees
- Full pagination for all replayable trades

## Limitations

- The demo is not a trading system.
- It does not execute transactions.
- It does not recommend tokens to buy.
- Mock data is used for the default demonstration path.
- Optional API adapter code is not a guarantee of complete coverage for every wallet, token, or chain.
- Price-path quality depends on available K-line data.

