"""
Тонкий асинхронный клиент к Yandex AI Studio (YandexGPT) через
OpenAI-совместимый эндпоинт.

Нужны переменные окружения (см. .env.example):
    YANDEX_API_KEY    — API-ключ сервисного аккаунта (роль ai.languageModels.user)
    YANDEX_FOLDER_ID  — ID каталога (folder) в Yandex Cloud

Если они не заданы — клиент работает в режиме "выключен" (enabled=False),
а вызывающий код (app/features/tutor.py) откатывается на локальный TextRank
или отдаёт понятную ошибку. Ни бот, ни API не падают без ключа.

Актуальный base_url/имена моделей сверяй с документацией, если что-то
перестанет отвечать: https://aistudio.yandex.ru/docs/
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Iterable

from app.config import get_settings

log = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI, APIConnectionError, APIError, APITimeoutError
    _HAS_OPENAI = True
except ImportError:  # пакет openai ещё не установлен — деградируем тихо
    _HAS_OPENAI = False

    class APIError(Exception):
        pass

    class APITimeoutError(Exception):
        pass

    class APIConnectionError(Exception):
        pass

    AsyncOpenAI = None  # type: ignore[assignment]

_RETRYABLE = (APITimeoutError, APIConnectionError, APIError)


class YandexGPTUnavailable(RuntimeError):
    """Поднимается, когда YandexGPT не сконфигурирован или не ответил после ретраев.
    Вызывающий код обязан её ловить и решать, что делать (fallback или
    понятная ошибка пользователю/фронтенду — см. app/api/ai_routes.py)."""


class YandexGPTClient:
    def __init__(self) -> None:
        s = get_settings()
        self._folder_id = s.yandex_folder_id
        self._model_lite = s.yandex_model_lite
        self._model_pro = s.yandex_model_pro
        self._enabled = bool(_HAS_OPENAI and s.yandex_api_key and s.yandex_folder_id)

        self._cache_dir = s.data_dir / "ai_cache"
        self._cache_dir.mkdir(parents=True, exist_ok=True)

        self._client = None
        if self._enabled:
            self._client = AsyncOpenAI(
                api_key=s.yandex_api_key,
                base_url=s.yandex_base_url,
                timeout=60.0,
                default_headers={
                    "x-folder-id": s.yandex_folder_id,
                    "x-data-logging-enabled": "false",  # не хранить книги/диалоги на стороне Яндекса
                },
            )
        elif not _HAS_OPENAI:
            log.info("Пакет 'openai' не установлен — AI-функции отключены, работает TextRank-фолбэк.")
        else:
            log.info("YANDEX_API_KEY/YANDEX_FOLDER_ID не заданы — AI-функции отключены.")

    @property
    def enabled(self) -> bool:
        return self._enabled

    def _model_uri(self, tier: str) -> str:
        name = self._model_pro if tier == "pro" else self._model_lite
        return f"gpt://{self._folder_id}/{name}/latest"

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        tier: str = "lite",
        temperature: float = 0.4,
        max_tokens: int = 800,
        retries: int = 3,
    ) -> str:
        if not self._client:
            raise YandexGPTUnavailable("YandexGPT не сконфигурирован (нет ключа/папки/пакета openai)")

        delay = 0.8
        last_exc: Exception | None = None
        for attempt in range(1, retries + 1):
            try:
                resp = await self._client.chat.completions.create(
                    model=self._model_uri(tier),
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return (resp.choices[0].message.content or "").strip()
            except _RETRYABLE as e:
                last_exc = e
                log.warning("YandexGPT попытка %d/%d не удалась: %r", attempt, retries, e)
                if attempt < retries:
                    await asyncio.sleep(delay)
                    delay *= 2
        raise YandexGPTUnavailable(f"YandexGPT недоступен после {retries} попыток") from last_exc

    # ---- дисковый кэш для контента, ОДИНАКОВОГО для всех пользователей ----
    # (рекап главы, глоссарий термина, вопросы квиза — зависят только от
    # книги+диапазона страниц, не от того, КТО спрашивает). Экономит реальные
    # деньги на публичных книгах, которые читают многие. НЕ используй для
    # персонального диалога (обычный chat()).

    def _cache_path(self, namespace: str, parts: Iterable[str]) -> Path:
        h = hashlib.sha1("\x1f".join(parts).encode("utf-8")).hexdigest()[:16]
        return self._cache_dir / f"{namespace}_{h}.json"

    async def cached_chat(
        self,
        namespace: str,
        cache_parts: Iterable[str],
        messages: list[dict[str, str]],
        **kwargs: Any,
    ) -> str:
        path = self._cache_path(namespace, cache_parts)
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))["text"]
            except Exception:
                pass
        text = await self.chat(messages, **kwargs)
        try:
            path.write_text(json.dumps({"text": text}, ensure_ascii=False), encoding="utf-8")
        except Exception:
            log.exception("Не удалось записать AI-кэш в %s", path)
        return text


_client: YandexGPTClient | None = None


def get_yandex_client() -> YandexGPTClient:
    global _client
    if _client is None:
        _client = YandexGPTClient()
    return _client