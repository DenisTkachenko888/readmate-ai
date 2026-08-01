# ReadMateAI — Telegram Reading Assistant

ReadMateAI is a Telegram bot that helps you **find books**, **read them inside Telegram**, save **bookmarks/quotes**, generate a **short summary (TextRank)**, and listen to pages via **TTS (Edge)**.

> Portfolio note: the repository intentionally **does not** store your downloaded books, TTS cache, or `.env` with secrets.

---

## Features

- **Search & import** books from Project Gutenberg via **Gutendex**.
- **In-chat reading**: page navigation, “open book”, library list.
- **Reading progress** is saved locally (per-user last page).
- **Summary**: TextRank-like extractive summarization (NLTK + NetworkX).
- **TTS**: audio for pages using **edge-tts** (with caching), with automatic voice selection by language.
- **Resilience**: automatic restart on transient Telegram network errors; explicit proxy reset.

Planned / in progress:

- Wikisource provider (code is present, UI integration is in progress).
- Bookmarks/quotes + export (highlights) and a more robust storage backend.

---

## Tech stack

- Python **3.12+**
- **aiogram 3.x**
- httpx / requests / BeautifulSoup4 / lxml
- NLTK + NetworkX (summarization)
- edge-tts (TTS)

---

## Quick start

### 1) Clone & install

```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/readmate-ai.git
cd readmate-ai

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2) Configure environment

Create `.env` from `.env.example` and set your Telegram token:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
BOT_TOKEN=123456:ABCDEF...
```

### 3) Run the bot

```bash
python -m app.main
```

---

## Configuration (.env)

| Variable | Required | Default | Meaning |
|---|---:|---|---|
| `BOT_TOKEN` | ✅ | — | Telegram bot token from @BotFather |
| `LOG_LEVEL` | ❌ | `INFO` | Logging level |
| `DATA_DIR` | ❌ | `app/data` | Runtime data directory |
| `BOOKS_DIR` | ❌ | `app/books` | Where downloaded books are stored |
| `TTS_BACKEND` | ❌ | `edge` | `edge\|pyttsx3\|none` (currently only `edge` is enabled in code) |
| `EDGE_TTS_VOICE_DEFAULT` | ❌ | `en-US-JennyNeural` | Default voice |
| `EDGE_TTS_VOICE_EN` | ❌ | `en-US-JennyNeural` | English voice |
| `EDGE_TTS_VOICE_RU` | ❌ | `ru-RU-SvetlanaNeural` | Russian voice |
| `PAGE_LEN` | ❌ | `1400` | Page length (chars) |
| `TTS_MAX_CHARS` | ❌ | `1200` | Max chars per TTS chunk |
| `TTS_PAGES_AHEAD` | ❌ | `10` | How many pages ahead to pre-generate audio |
| `TTS_MAX_PARTS` | ❌ | `6` | Max mp3 chunks per request |
| `TTS_MAX_TOTAL_CHARS` | ❌ | `6000` | Max text size per request |

---

## Bot commands

- `/start` — greeting + menu
- `/help` — help
- `/browse <query>` — search in sources (currently Gutenberg via Gutendex)
- `/read <book_id>` — open a local book by id (e.g., `g_1661`)
- `/mybooks` — list local books

Tip: you can also type a query without `/browse` — the bot treats it as a quick search.

---

## Project structure

```text
app/
  handlers/        # aiogram routers (commands, callbacks)
  services/        # pagination, text cleaning, reading flow
  services/providers/  # external sources (Gutendex, Wikisource)
  features/        # summarize, TTS
  storage/         # JSON storage helper
  net/             # custom IPv4-only http session
  utils/           # Telegram helper utils
```

More documentation: see [docs/](docs/).

Runtime directories (ignored by git):

- `app/books/` — downloaded books (`*.json`)
- `app/data/tts_cache/` — generated mp3 cache
- `app/data/user_books.json` — per-user reading state (last page) and future highlights
- `app/data/user_books.json` — user library/progress

---

## Security & privacy

- **Do not commit** `.env` (it contains your bot token). This repo includes `.env.example`.
- Local JSON files may contain user IDs and reading metadata. Treat them as private.
- The bot connects to third-party sources (e.g., Gutendex, Project Gutenberg) to fetch book texts.

See [SECURITY.md](SECURITY.md).

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](LICENSE).
