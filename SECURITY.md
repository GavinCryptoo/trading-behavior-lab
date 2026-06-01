# Security Policy

Trading Behavior Lab is an analysis-only project. It should not require wallet private keys, seed phrases, or custody of user funds.

## Supported Versions

The `main` branch is the active development branch.

## Reporting a Vulnerability

Please do not post secrets, exploit details, or private credentials in public issues.

For non-sensitive issues, open a GitHub issue with a clear description and reproduction steps.

For sensitive reports, use GitHub private vulnerability reporting if it is enabled for the repository, or contact the maintainer through the GitHub profile linked from the repository.

## Secret Handling

- Do not commit `.env.local`.
- Do not commit API keys, wallet private keys, seed phrases, access tokens, or session cookies.
- Use `.env.example` for placeholder variable names only.
- If a secret is accidentally committed, rotate it immediately and remove it from history before treating the repository as safe.

## Trading Safety Boundary

This project should remain retrospective and analysis-only unless a future change is explicitly reviewed for trading safety.

The current project should not:

- Execute swaps or orders.
- Sign wallet transactions.
- Custody assets.
- Hide partial or fallback data coverage.
- Present analysis output as financial advice.
