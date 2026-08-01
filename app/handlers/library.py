# app/handlers/library.py
from __future__ import annotations

from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from pathlib import Path
from typing import List
import json

from app.config import get_settings
from app.services.reading import list_books
from app.utils.telegram import safe_cb_answer

router = Router()

# ---------- helpers ----------

def _truncate(s: str, max_len: int = 48) -> str:
    s = s.strip()
    return s if len(s) <= max_len else s[: max_len - 1] + "…"

def _books_dir() -> Path:
    s = get_settings()
    s.books_dir.mkdir(parents=True, exist_ok=True)
    return s.books_dir

def _book_file(book_id: str) -> Path:
    return _books_dir() / f"{book_id}.json"

def _kb_empty() -> InlineKeyboardMarkup:
    # Кнопка «Найти книгу» — используем callback_data="browse"
    # (у тебя уже есть обработчик этой коллбэки или /browse)
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔎 Найти книгу", callback_data="browse")]
    ])

def _kb_mybooks(items: List[tuple[str, str, str]]) -> InlineKeyboardMarkup:
    rows = []
    for bid, title, author in items:
        label = f"{_truncate(title)} — {_truncate(author, 28)}"
        rows.append([
            InlineKeyboardButton(text=f"📖 {label}", callback_data=f"open:{bid}"),
            InlineKeyboardButton(text="🗑 Удалить", callback_data=f"del:{bid}")
        ])
    return InlineKeyboardMarkup(inline_keyboard=rows)

async def _render_list_in_place(cb_or_msg: types.CallbackQuery | types.Message) -> None:
    """Редактируем текущее сообщение (если CallbackQuery) или отправляем новое (если /mybooks)."""
    books = list_books(_books_dir())

    if not books:
        text = "📚 <b>Мои книги</b>\nПока пусто. Вы можете добавить первую книгу с помощью поиска."
        if isinstance(cb_or_msg, types.CallbackQuery):
            try:
                await cb_or_msg.message.edit_text(text, reply_markup=_kb_empty(), parse_mode="HTML")
            except Exception:
                await cb_or_msg.message.answer(text, reply_markup=_kb_empty(), parse_mode="HTML")
            await safe_cb_answer(cb_or_msg)
        else:
            await cb_or_msg.answer(text, reply_markup=_kb_empty(), parse_mode="HTML")
        return

    items = [(b.id, b.title, b.author) for b in books]
    kb = _kb_mybooks(items)
    text = "📚 <b>Мои книги</b>\nВыберите книгу, чтобы открыть, или удалите ненужные."
    if isinstance(cb_or_msg, types.CallbackQuery):
        try:
            await cb_or_msg.message.edit_text(text, reply_markup=kb, parse_mode="HTML")
        except Exception:
            await cb_or_msg.message.answer(text, reply_markup=kb, parse_mode="HTML")
        await safe_cb_answer(cb_or_msg)
    else:
        await cb_or_msg.answer(text, reply_markup=kb, parse_mode="HTML")

# ---------- commands ----------

@router.message(Command("mybooks"))
async def mybooks_cmd(msg: types.Message):
    # Первое отображение — отправляем новое сообщение
    await _render_list_in_place(msg)

# Дополнительная “системная” коллбэка, чтобы можно было вернуться к списку
@router.callback_query(F.data == "mybooks")
async def mybooks_cb(cb: types.CallbackQuery):
    await _render_list_in_place(cb)

# ---------- delete flow (всё в одном сообщении) ----------

@router.callback_query(F.data.startswith("del:"))
async def confirm_delete(cb: types.CallbackQuery):
    """Показываем подтверждение удаления — редактируя текущее сообщение."""
    book_id = cb.data.split(":", 1)[1]
    file = _book_file(book_id)

    if not file.exists():
        await safe_cb_answer(cb, "Книга уже удалена.")
        await _render_list_in_place(cb)
        return

    try:
        meta = json.loads(file.read_text(encoding="utf-8"))
        title = meta.get("title", book_id)
        author = meta.get("author", "")
        human = f"{title} — {author}" if author else title
    except Exception:
        human = book_id

    text = f"🗑 Удалить книгу:\n<b>{_truncate(human, 90)}</b>?"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Да, удалить", callback_data=f"delcfm:{book_id}"),
            InlineKeyboardButton(text="↩️ Назад", callback_data="mybooks"),
        ]
    ])
    try:
        await cb.message.edit_text(text, reply_markup=kb, parse_mode="HTML")
    except Exception:
        await cb.message.answer(text, reply_markup=kb, parse_mode="HTML")
    await safe_cb_answer(cb)

@router.callback_query(F.data.startswith("delcfm:"))
async def delete_book(cb: types.CallbackQuery):
    """Удаляем и сразу показываем обновлённый список — в том же сообщении."""
    book_id = cb.data.split(":", 1)[1]
    file = _book_file(book_id)

    if file.exists():
        try:
            file.unlink()
        except Exception as e:
            await safe_cb_answer(cb, f"Ошибка удаления: {e}")
            return

    # Попытка подчистить пользовательские данные (если есть методы в репозитории)
    try:
        from app.storage.json_store import JsonUserBooksRepository
        repo = JsonUserBooksRepository(get_settings().user_books_file)
        if hasattr(repo, "purge_book"):
            repo.purge_book(cb.from_user.id, book_id)
        elif hasattr(repo, "remove_book"):
            repo.remove_book(cb.from_user.id, book_id)
        elif hasattr(repo, "set_page"):
            repo.set_page(cb.from_user.id, book_id, 0)
    except Exception:
        pass

    # Показываем список снова (тем же сообщением)
    await _render_list_in_place(cb)
