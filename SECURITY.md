# Security Policy

## Supported versions

This is a portfolio project. Security fixes (if any) are applied to the latest
`main` branch.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Preferred:

1. Use **GitHub Security Advisories**: open the repository → `Security` → `Report a vulnerability`.

Alternative (if advisories are unavailable):

2. Contact the maintainer privately (e.g., email), include:
   - a short description and impact
   - minimal steps to reproduce
   - affected versions/commit hash (if known)

We aim to acknowledge reports quickly and will publish fixes/notes once a patch
is available.

## Secrets

- Never commit `.env` or tokens.
- Rotate the Telegram token immediately if it is exposed.
