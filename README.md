# ReadMateAI — AI-Powered Telegram Reading Assistant

ReadMateAI is a Telegram bot + Telegram Mini App that turns reading into an interactive, AI-assisted experience: find free books, read them inside Telegram, listen via TTS, and learn with an AI mentor.

> **Note:** this repository intentionally excludes downloaded book payloads (`*.json`), TTS audio cache (`*.mp3`) and environment secrets (`.env`).

---

## 🎯 What It Does

- **Search & import** books from Project Gutenberg (Gutendex API)
- **Read in Telegram** — page navigation, per-user progress, library
- **Bookmarks & quotes** — save highlights with notes
- **AI Mentor** — ask questions about the text, get spoiler-free recaps, main ideas, term explanations, flashcards and quizzes; 4 personas (teacher / friend / philosopher / psychologist)
- **TTS** — listen to pages via `edge-tts` with caching and automatic voice selection by language
- **Security** — REST API protected by HMAC-SHA256 validation of Telegram `initData`

---

## 🏗️ Architecture Highlights

1. **Single-process backend:** FastAPI (REST for the Mini App) + aiogram 3.x (bot) sharing one event loop, started/stopped via `lifespan`.
2. **Zero-Trust auth:** the frontend never decides "whose user_id this is" — every REST endpoint validates the `X-Telegram-Init-Data` header (HMAC-SHA256, `WebAppData` secret) in a FastAPI dependency layer.
3. **Hybrid reading modes:** Live Mode (pages fetched from the backend, progress saved server-side) and Mock Mode (offline demo books for pitches and demos).
4. **Graceful degradation:** AI features fall back to a local TextRank summarizer when the LLM backend is unavailable; the bot and API keep working without it.
5. **Storage abstraction:** data layer isolated for a planned migration JSON → SQLite/PostgreSQL.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Telegram bot token from @BotFather

### Backend

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # put your BOT_TOKEN (and optional AI keys) here
python -m app.main
```

### Frontend (Telegram Mini App)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Docker (optional)

```bash
docker-compose up --build
```

---

## 🤖 Bot Commands

- `/start` — welcome + main menu
- `/browse <query>` — search books in Gutenberg
- `/read <book_id>` — open a local book (e.g. `g_1661`)
- `/mybooks` — your library

Tip: any plain text message is treated as a quick search.

---

## ⚙️ Configuration

| Variable | Required | Default | Meaning |
|---|---:|---|---|
| `BOT_TOKEN` | ✅ | — | Telegram bot token |
| `LOG_LEVEL` | ❌ | `INFO` | Logging level |
| `CORS_ORIGINS` | ❌ | *(empty = disabled)* | Comma-separated allow-list |
| `DATA_DIR` / `BOOKS_DIR` | ❌ | `app/data` / `app/books` | Runtime directories |
| `TTS_BACKEND` | ❌ | `edge` | `edge \| pyttsx3 \| none` |
| `PAGE_LEN` | ❌ | `1400` | Characters per page |
| `YANDEX_API_KEY` / `YANDEX_FOLDER_ID` | ❌ | — | AI features (optional, TextRank fallback otherwise) |

Full list with defaults — see `.env.example`.

---

## 📁 Project Structure

```text
app/                    # Python backend
├── api/                # FastAPI routers + initData auth
├── handlers/           # aiogram bot handlers
├── features/           # AI tutor, summarization, TTS
├── services/           # reading flow, providers (Gutendex, Wikisource)
├── storage/            # user data persistence
└── net/                # IPv4-forced HTTP session
frontend/               # Next.js Mini App
├── app/                # App Router (reader, demo, API proxy)
├── components/         # UI components (Shadcn/Tailwind)
└── lib/                # Telegram bridge, typed API client
tests/                  # pytest suites
```

---

## 🛣️ Roadmap

- [x] Zero-Trust auth via `X-Telegram-Init-Data`
- [x] Mini App reader with Live/Mock hybrid modes
- [x] AI mentor with personas, flashcards, quizzes
- [ ] Migrate AI engine to Gemini 2.0 Flash
- [ ] Migrate JSON storage to SQLite/PostgreSQL
- [ ] Redis caching layer for AI responses
- [ ] Webhooks instead of long polling for multi-worker scaling

---

## 🔒 Security & Privacy

- `.env` is never committed; local JSON files may contain user IDs and reading metadata — treat them as private.
- The bot fetches book texts from third-party public sources (Project Gutenberg / Gutendex).
- See [SECURITY.md](.github/SECURITY.md).

---

## 🤝 Contributing

Contributions are welcome — see [CONTRIBUTING.md](.github/CONTRIBUTING.md). Code must pass Ruff (backend) and ESLint/Prettier (frontend).

---

## 📄 License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Denis Tkachenko.