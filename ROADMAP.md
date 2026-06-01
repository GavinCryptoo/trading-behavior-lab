# Roadmap

This roadmap keeps planned work separate from current implemented features.

## Current Focus

- Keep mock demo mode stable.
- Improve documentation for open-source contributors.
- Keep the analysis-only boundary clear.
- Add validation around deterministic analysis helpers.
- Make fallback and data coverage states easier to inspect.

## Planned

- Add unit tests for entry score, exit score, profit capture, drawdown, and what-if simulation helpers.
- Improve wallet transaction normalization for adapter-backed data.
- Add clearer data coverage states for incomplete wallet histories.
- Improve token filtering for stablecoins, pure transfers, failed transactions, and incomplete buy/sell pairs.
- Add screenshot documentation under `docs/screenshots/`.
- Add exportable report summaries.
- Add richer examples for Solana and EVM-style wallet histories.
- Improve accessibility and keyboard navigation in the dashboard.

## Optional Integration Work

- Continue the OKX-style adapter path for wallet transaction history and market context.
- Improve candle / price-path reconstruction.
- Add safer adapter error handling for rate limits and incomplete external responses.
- Document supported chains and known data limitations.

## Out of Scope

- Automated trading.
- Wallet signing.
- Custody of user funds.
- Guaranteed buy/sell recommendations.
- Profit promises or performance guarantees.
