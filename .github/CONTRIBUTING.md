# Contributing

Thanks for your interest in contributing!

This repository is primarily a **portfolio** project, but contributions and
feedback are welcome.

## Getting started

1. Fork the repo and create a branch from `main`:

   ```bash
   git checkout -b feat/short-description
   ```

2. Install dependencies:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. Copy config:

   ```bash
   cp .env.example .env
   ```

## Development workflow

- Keep PRs small and focused.
- Add or update documentation when you change behavior.

### Code style

We use **Ruff** for linting/formatting.

```bash
ruff check .
ruff format .
```

### Quick checks

```bash
python -m compileall -q .
```

## Commit messages

Recommended convention:

- `feat: ...` — new feature
- `fix: ...` — bug fix
- `docs: ...` — documentation
- `chore: ...` — tooling / maintenance

## Reporting bugs

Please include:

- what you expected vs what happened
- steps to reproduce
- logs (remove tokens/secrets)
- OS + Python version

## Security reports

See [SECURITY.md](SECURITY.md).
