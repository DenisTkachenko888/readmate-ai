import asyncio
import os
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.config import get_settings
from app.logging_setup import setup_logging
from app.net.ipv4_session import IPv4Session

from app.handlers import start, help, reading, library, browse
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
        r._parent_router = None
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

logger = logging.getLogger("readmate.api")

s = get_settings()

if s.cors_origins:
    origins = [o.strip() for o in s.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if "*" not in origins else ["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    latency = (time.perf_counter() - started) * 1000
    logger.info(
        "%s %s -> %s | %.0f ms",
        request.method, request.url.path,
        response.status_code, latency,
    )
    return response

@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok"}

app.include_router(api_router, prefix="/api", tags=["Books API"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Tutor"])

app.mount("/audio", StaticFiles(directory=s.data_dir / "tts_cache"), name="audio")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)