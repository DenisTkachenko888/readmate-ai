from __future__ import annotations

from aiogram import Router, types, F
from aiogram.filters import Command, StateFilter
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from app.states import Reading

import httpx
import json
import ssl
import logging

from app.config import get_settings
from app.services.paginate import chunk_text
from app.services.providers.gutendex import search as g_search, pick_text_url
from app.services.clean import clean_gutenberg_text, normalize_plain_text

router = Router()

_TLS12 = ssl.create_default_context()
_TLS12.maximum_version = ssl.TLSVersion.TLSv1_2

log = logging.getLogger(__name__)

# --------------------------- helpers ---------------------------------


def _build_results_kb(results: list[tuple[str, str, str, str]]) -> InlineKeyboardMarkup:
    rows = []
    for src, rid, title, author in results[:12]:
        rows.append(
            [
                InlineKeyboardButton(
                    text=f"➕ {title} — {author}",
                    callback_data=f"add:{src}:{rid}",
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=rows)


async def _search_gutendex(msg: types.Message, query: str):
    # 1. Отправляем моментальный статус, чтобы закрыть проблему с ожиданием
    status_msg = await msg.answer(
        f"🔍 Ищу <b>{query}</b> в базе Gutenberg...\n<i>(API может отвечать 10-20 секунд ⏳)</i>", 
        parse_mode="HTML"
    )
    
    results: list[tuple[str, str, str, str]] = []
    try:
        g = await g_search(query, limit=10)
        for it in g:
            gid = it.get("id")
            title = it.get("title", "Untitled")
            author = ", ".join(a.get("name", "Unknown") for a in it.get("authors", [])) or "Unknown"
            results.append(("gutendex", str(gid), title, author))
    except Exception as e:
        log.exception("Gutendex search failed: %r", e)
        await status_msg.edit_text(f"⚠️ Ошибка поиска Gutenberg: {e!r}")
        return

    if not results:
        await status_msg.edit_text("Ничего не нашёл в Gutenberg. Попробуй другой запрос.")
        return

    # Заменяем статусное сообщение на готовую клавиатуру с результатами
    await status_msg.edit_text(
        "<b>Результаты поиска</b> — выбери, чтобы добавить в библиотеку.",
        reply_markup=_build_results_kb(results),
        parse_mode="HTML",
    )

def _save_book_json(book_id: str, title: str, author: str, pages: list[str], lang: str | None = None):
    s = get_settings()
    s.books_dir.mkdir(parents=True, exist_ok=True)
    payload = {"title": title, "author": author, "pages": pages}
    if lang:
        payload["lang"] = lang
    (s.books_dir / f"{book_id}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


# --------------------------- /browse ---------------------------------


@router.message(Command("browse"))
async def browse_all(msg: types.Message, state: FSMContext):
    await state.clear()  # Сбрасываем состояние чтения (выходим из книги)
    args = msg.text.strip().split(maxsplit=1)
    if len(args) < 2:
        await msg.answer("Использование: /browse &lt;запрос&gt;", parse_mode="HTML")
        return
    query = args[1]
    await _search_gutendex(msg, query)
# --------------------- добавление книги -------------------------------


@router.callback_query(lambda c: c.data and c.data.startswith("add:"))
async def add_book(cb: types.CallbackQuery):
    await cb.answer("Добавляю...")
    try:
        _, src, rid = cb.data.split(":", 2)
    except ValueError:
        await cb.message.answer("Некорректные данные кнопки.")
        return

    if src != "gutendex":
        await cb.message.answer("Этот источник временно отключён. Доступен только Gutenberg.")
        return

    gid = rid

    # Притворяемся браузером
    fake_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    # 1) Метаданные (сообщаем статус)
    status_msg = await cb.message.answer("⏳ Скачиваю метаданные книги...")
    try:
        async with httpx.AsyncClient(
            http2=False,
            timeout=60.0,         
            follow_redirects=True,
            trust_env=False,      # <--- КРИТИЧНО! Игнорируем мертвый прокси 127.0.0.1:8888
            verify=_TLS12,
            headers=fake_headers
        ) as client:
            r = await client.get(f"https://gutendex.com/books/{gid}")
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        log.exception("Gutendex metadata failed (gid=%s): %r", gid, e)
        await status_msg.edit_text(f"Не удалось получить метаданные книги ({type(e).__name__}): {e!r}")
        return
    
    lang = (data.get("languages") or ["en"])[0]
    title = data.get("title", "Untitled")
    author = ", ".join(a.get("name", "Unknown") for a in data.get("authors", [])) or "Unknown"

    formats = data.get("formats", {}) or {}
    url = pick_text_url(formats)
    if not url:
        await status_msg.edit_text("Не нашёл ссылку на текст (text/plain .txt) для этой книги.")
        return

    # 2) Скачиваем текст
    await status_msg.edit_text("⏳ Скачиваю текст книги (это может занять время)...")
    try:
        async with httpx.AsyncClient(
            http2=False,
            timeout=60.0,          
            follow_redirects=True,
            trust_env=False,      # <--- КРИТИЧНО! Игнорируем мертвый прокси 127.0.0.1:8888
            verify=_TLS12,
            headers=fake_headers
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            resp.encoding = resp.encoding or "utf-8"
            raw_text = resp.text
    except Exception as e:
        log.exception("Book download failed (gid=%s, url=%s): %r", gid, url, e)
        await status_msg.edit_text(f"Ошибка загрузки текста ({type(e).__name__}): {e!r}")
        return

    # 3) Чистка и нормализация
    await status_msg.edit_text("🧹 Очищаю текст от мусора и разбиваю на страницы...")
    txt = clean_gutenberg_text(raw_text)
    txt = normalize_plain_text(txt)

    s = get_settings()
    pages = chunk_text(txt, page_len=s.page_len)

    book_id = f"g_{gid}"
    _save_book_json(book_id, title, author, pages, lang=lang)

    kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="📖 Читать сейчас", callback_data=f"open:{book_id}")]]
    )
    
    await status_msg.delete()
    await cb.message.answer(
        f"✅ Добавил: <b>{title}</b>\n<i>{author}</i>\nID: <code>{book_id}</code>",
        reply_markup=kb,
        parse_mode="HTML",
    )

@router.message(StateFilter(None, Reading.reading), F.text & ~F.text.startswith("/"))
async def quick_plain_search(msg: types.Message, state: FSMContext):
    query = (msg.text or "").strip()
    if not query:
        return
    await state.clear()  # Очищаем состояние (выходим из книги)
    await _search_gutendex(msg, query)