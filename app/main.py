import asyncio
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.config import get_settings
from app.logging_setup import setup_logging
from app.net.ipv4_session import IPv4Session

# Импорт роутеров Telegram
from app.handlers import start, help, reading, library, browse
# Импорт REST API
from app.api.routes import router as api_router
from app.api.ai_routes import router as ai_router

bot: Bot | None = None
polling_task: asyncio.Task | None = None


def build_dispatcher() -> Dispatcher:
    """Создает Dispatcher и безопасно привязывает роутеры с защитой от Uvicorn reload."""
    dp = Dispatcher()
    routers = [
        start.router,
        help.router,
        browse.router,
        library.router,
        reading.router,
    ]
    for r in routers:
        r._parent_router = None  # Сбрасываем привязку для aiogram 3.x
        dp.include_router(r)
    return dp


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    global bot, polling_task
    s = get_settings()
    setup_logging(s.log_level)

    os.environ.pop("HTTP_PROXY", None)
    os.environ.pop("HTTPS_PROXY", None)

    dp = build_dispatcher()
    session = IPv4Session(timeout=120)
    bot = Bot(
        token=s.bot_token,
        session=session,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    polling_task = asyncio.create_task(dp.start_polling(bot))
    logging.info("FastAPI: Telegram bot polling started in background.")

    yield

    # --- Shutdown ---
    if polling_task:
        polling_task.cancel()
    if bot:
        await bot.session.close()
    logging.info("FastAPI: Shutting down and cleaning up.")


app = FastAPI(
    title="ReadMateAI",
    description="API для Telegram Mini App читалки",
    version="0.3.0",
    lifespan=lifespan,
)

# NB: allow_origins=["*"] — ок для хакатон-демо за прокси, куда фронтенд стучится
# напрямую из браузера. Перед реальным запуском сузь до конкретного домена
# фронтенда через ALLOWED_ORIGINS в .env, чтобы не отдавать API кому попало.
_allowed = os.getenv("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allowed == "*" else [o.strip() for o in _allowed.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api", tags=["Books API"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Tutor"])

s = get_settings()
app.mount("/audio", StaticFiles(directory=s.data_dir / "tts_cache"), name="audio")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)