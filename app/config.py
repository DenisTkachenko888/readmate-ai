from __future__ import annotations
import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

class Settings(BaseModel):
    bot_token: str
    log_level: str = "INFO"
    cors_origins: str = ""             # Белый список origin'ов (пусто = без CORS middleware)
    rate_limit_per_minute: int = 60
    
    # --- Параметры и ограничения ---
    tutor_history_depth: int = 6       # Глубина истории диалога ИИ
    recap_stride_pages: int = 10       # Интервал автопересказа страниц
    book_cache_size: int = 16          # Лимит книг в памяти
    
    data_dir: Path
    books_dir: Path
    user_books_file: Path
    tts_backend: str = "edge"          # edge|pyttsx3|none
    edge_voice: str = "ru-RU-SvetlanaNeural"
    page_len: int = 1400
    tts_max_chars: int = 1200
    tts_pages_ahead: int = 10
    tts_max_parts: int = 6
    tts_max_total_chars: int = 6000
    edge_voice_default: str = "en-US-JennyNeural"
    edge_voice_en: str = "en-US-JennyNeural"
    edge_voice_ru: str = "ru-RU-SvetlanaNeural"

    # --- Yandex AI Studio ---
    yandex_api_key: str = ""
    yandex_folder_id: str = ""
    yandex_base_url: str = "https://ai.api.cloud.yandex.net/v1"
    yandex_model_lite: str = "yandexgpt-lite"
    yandex_model_pro: str = "yandexgpt"

def get_settings() -> Settings:
    load_dotenv()
    data_dir = Path(os.getenv("DATA_DIR", "app/data")).resolve()
    books_dir = Path(os.getenv("BOOKS_DIR", "app/books")).resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    books_dir.mkdir(parents=True, exist_ok=True)
    user_books_file = data_dir / "user_books.json"
    if not user_books_file.exists():
        user_books_file.write_text("{}", encoding="utf-8")
    token = os.getenv("BOT_TOKEN", "")
    if not token:
        raise RuntimeError("BOT_TOKEN is not set. Put it into .env")
    return Settings(
        bot_token=token,
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        cors_origins=os.getenv("CORS_ORIGINS", os.getenv("ALLOWED_ORIGINS", "")),
        rate_limit_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
        tutor_history_depth=int(os.getenv("TUTOR_HISTORY_DEPTH", "6")),
        recap_stride_pages=int(os.getenv("RECAP_STRIDE_PAGES", "10")),
        book_cache_size=int(os.getenv("BOOK_CACHE_SIZE", "16")),
        data_dir=data_dir,
        books_dir=books_dir,
        user_books_file=user_books_file,
        tts_backend=os.getenv("TTS_BACKEND", "edge"),
        edge_voice=os.getenv("EDGE_TTS_VOICE", "ru-RU-SvetlanaNeural"),
        edge_voice_default=os.getenv("EDGE_TTS_VOICE_DEFAULT", "en-US-JennyNeural"),
        edge_voice_en=os.getenv("EDGE_TTS_VOICE_EN", "en-US-JennyNeural"),
        edge_voice_ru=os.getenv("EDGE_TTS_VOICE_RU", "ru-RU-SvetlanaNeural"),
        tts_max_chars=int(os.getenv("TTS_MAX_CHARS", "1200")),
        tts_pages_ahead=int(os.getenv("TTS_PAGES_AHEAD", "10")),
        tts_max_parts=int(os.getenv("TTS_MAX_PARTS", "6")),
        tts_max_total_chars=int(os.getenv("TTS_MAX_TOTAL_CHARS", "6000")),
        page_len=int(os.getenv("PAGE_LEN", "1400")),
        yandex_api_key=os.getenv("YANDEX_API_KEY", ""),
        yandex_folder_id=os.getenv("YANDEX_FOLDER_ID", ""),
        yandex_base_url=os.getenv("YANDEX_BASE_URL", "https://ai.api.cloud.yandex.net/v1"),
        yandex_model_lite=os.getenv("YANDEX_MODEL_LITE", "yandexgpt-lite"),
        yandex_model_pro=os.getenv("YANDEX_MODEL_PRO", "yandexgpt"),
    )