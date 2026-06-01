# Trading Behavior Lab｜交易行为实验室

An open-source wallet-based trading behavior analysis tool for on-chain traders.

![Trading Behavior Lab Preview](./public/preview.png)

Trading Behavior Lab｜交易行为实验室 是一个开源的钱包交易行为分析工具，帮助链上交易者通过钱包地址复盘历史交易，分析买入质量、卖出质量、利润捕获率、最大回撤、卖飞情况和交易行为问题。

## Overview

Trading Behavior Lab turns wallet trading history into structured behavior analytics. The project focuses on reviewing past trades instead of recommending the next trade or executing orders.

It is designed to help users inspect:

- Entry quality and whether a wallet often buys late.
- Exit quality and whether a wallet sells too early.
- Profit capture rate after a trade becomes profitable.
- Missed gains after exit.
- Maximum drawdown during a trade.
- Repeated behavior patterns across trades.

The current app ships with a mock demo flow and a reserved OKX-style adapter path for wallet transaction history and market data. When adapter-backed data is unavailable, the app falls back to clearly labeled demo data instead of pretending incomplete data is complete.

## Why this project exists

Many on-chain traders only look at final PnL. That misses the behavior behind the result: whether the trade was entered too late, exited too early, held through avoidable drawdown, or failed to capture the main move.

Trading Behavior Lab aims to convert wallet activity into readable behavior metrics so users can review questions such as:

- Did this wallet often chase after a large move had already happened?
- Did exits happen before the main upside?
- Were losing trades held longer than winning trades?
- Was profit protected after a strong move?
- Did high-volatility assets create excessive drawdown?

This project is for retrospective analysis and education. It is not financial advice, not a signal service, and not an automated trading system.

## Features

Current implemented features include:

- Wallet address input with chain and period selection.
- Empty initial state before the user submits a wallet.
- Mock data / demo mode for running the app without API keys.
- Fallback-aware API route for adapter-backed analysis.
- Trade replay dashboard.
- Entry and exit quality review.
- Profit capture analysis.
- Missed gains / sold-too-early review.
- Maximum drawdown view.
- Trading personality summary.
- Repeated trading leak detection.
- Personalized rule suggestions based on historical behavior.
- What-if replay simulations for rule-based exits.
- Report-style trading behavior summary.
- Chinese / English UI toggle.
- Responsive dashboard UI.

Planned work is tracked in [ROADMAP.md](./ROADMAP.md).

## Screenshots

![Trading Behavior Lab dashboard preview](./public/preview.png)

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI primitives
- lucide-react
- Node.js

## Getting Started

```bash
git clone https://github.com/GavinCryptoo/trading-behavior-lab.git
cd trading-behavior-lab
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

The default mock demo works without API keys. Optional OKX environment variables are only needed when working on the adapter-backed data path.

## Environment Variables

Do not commit real credentials. Keep local values in `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OKX_API_KEY` | Optional | OKX Web3 API key for adapter-backed data experiments |
| `OKX_SECRET_KEY` | Optional | OKX Web3 API secret |
| `OKX_PASSPHRASE` | Optional | OKX Web3 API passphrase |
| `OKX_PROJECT_ID` | Optional | OKX Web3 project identifier |

Create local config from the example:

```bash
cp .env.example .env.local
```

## Available Scripts

```bash
npm run dev
```

Start the local development server.

```bash
npm run build
```

Create a production build.

```bash
npm run start
```

Start the production build.

```bash
npm run typecheck
```

Run TypeScript validation.

```bash
npm run lint
```

Run ESLint checks.

## Data Sources

The project currently supports two data modes:

- Mock demo data from `src/data/mockWalletAnalysis.ts`.
- Optional OKX-style adapter path under `src/lib/adapters/`.

The adapter path is intentionally conservative:

- It does not execute swaps.
- It does not sign transactions.
- It does not custody funds.
- It may fall back to demo data when credentials, complete buy/sell pairs, or price paths are unavailable.

## Project Structure

```text
app/
  api/analyze-wallet/route.ts     Server route for analysis and fallback behavior
  layout.tsx                      App metadata and root layout
  page.tsx                        Main dashboard page

components/dashboard/
  dashboard-header.tsx            Header and language switch
  wallet-input.tsx                Wallet input form
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
  mockWalletAnalysis.ts           Mock analysis dataset and shared types

src/lib/analysis/
  calculateEntryScore.ts          Entry score logic
  calculateExitScore.ts           Exit score logic
  profitCapture.ts                Profit capture logic
  tradingPersonality.ts           Personality classification
  tradingLeaks.ts                 Leak detection
  personalizedRules.ts            Rule generation
  whatIfSimulation.ts             Rule-based what-if simulations
  drawdownBehavior.ts             Drawdown behavior metrics
  reportCard.ts                   Report card generation

src/lib/adapters/
  okxAdapter.ts                   Optional OKX-style adapter implementation
  okxClient.ts                    Optional signed OKX client wrapper
  solanaAdapter.ts                Reserved Solana adapter interface
```

## Analysis Model

Each replayable trade can contain:

- Token symbol and token address.
- Buy time and sell time.
- Hold duration.
- Buy price and sell price.
- Realized PnL.
- Max upside.
- Max drawdown.
- Profit capture rate.
- Entry score.
- Exit score.
- Mistake tags.
- Diagnosis.
- Suggested fix.
- Minute-level price path.

The scoring and simulations are deterministic product logic. They are not audited trading models.

## What It Does Not Do

- Does not recommend what to buy.
- Does not provide guaranteed buy or sell signals.
- Does not auto-trade.
- Does not sign wallet transactions.
- Does not store private keys or seed phrases.
- Does not custody assets.
- Does not promise better trading performance.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md) and check [ROADMAP.md](./ROADMAP.md) for planned work.

Good first areas:

- Improve wallet transaction normalization.
- Add tests for analysis helpers.
- Improve fallback and data coverage labels.
- Add screenshots and documentation examples.
- Refine the dashboard for more chains and trade types.

## License

MIT. See [LICENSE](./LICENSE).

## Disclaimer

Trading Behavior Lab is for historical wallet analysis and educational review. It is not financial advice, investment advice, or a trading recommendation system.
