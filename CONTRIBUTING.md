# Contributing

Thanks for considering a contribution to Trading Behavior Lab.

This project is a wallet-based trading behavior analysis tool. Contributions should keep the product focused on historical analysis, data quality, and clear user-facing explanations.

## Local Setup

```bash
git clone https://github.com/GavinCryptoo/trading-behavior-lab.git
cd trading-behavior-lab
npm install
cp .env.example .env.local
npm run dev
```

Mock demo mode works without API keys.

## Development Checks

Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
npm run build
```

If a command fails, include the error and the reason in the pull request.

## Contribution Guidelines

- Keep changes scoped and easy to review.
- Do not commit `.env.local`, API keys, wallet private keys, seed phrases, or access tokens.
- Do not add auto-trading, wallet signing, or order execution behavior without a separate safety discussion.
- Label mock, partial, and adapter-backed data clearly in the UI.
- Avoid presenting analysis output as financial advice.
- Add or update tests when changing analysis logic.
- Update README or ROADMAP when changing user-facing behavior.

## Pull Request Checklist

- The change has a clear purpose.
- The app still runs in mock demo mode.
- Data source and fallback labels remain visible.
- No secrets or local-only files are included.
- Validation commands were run or the reason they were skipped is documented.
