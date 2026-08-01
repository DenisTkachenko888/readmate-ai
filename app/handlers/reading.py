from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.exceptions import TelegramBadRequest
from app.config import get_settings
from app.storage.json_store import JsonUserBooksRepository
from app.services.reading import load_book
from app.keyboards.common import nav, main_menu
from app.states import Reading
from app.features.summarize import summarize
from app.features.tts import synthesize_parts
from aiogram.types import FSInputFile
from app.utils.telegram import safe_cb_answer
from pathlib import Path
import html
import logging

router = Router()
log = logging.getLogger(__name__)

def _book_path(book_id: str) -> Path | None:
    s = get_settings()
    p = s.books_dir / f"{book_id}.json"
    return p if p.exists() else None

def _compose_page_text(book, page: int, total: int) -> str:
    title = html.escape(book.title)
    author = html.escape(book.author)
    body = html.escape(book.pages[page] or "—")
    return f"<b>{title}</b> — {author}\n\n{body}"

def _pick_voice(lang: str | None) -> str:
    s = get_settings()
    lang = (lang or "").lower()
    if lang.startswith("ru"):
        return getattr(s, "edge_voice_ru", "ru-RU-SvetlanaNeural")
    if lang.startswith("en"):
        return getattr(s, "edge_voice_en", "en-US-JennyNeural")
    return getattr(s, "edge_voice_default", "en-US-JennyNeural")

async def _edit_or_send_reading(bot, chat_id: int, msg_id: int | None, text: str, kb):
    """
    Если msg_id есть — редактируем его. Если редактировать нельзя — отправляем новое
    и возвращаем его id.
    """
    if msg_id:
        try:
            await bot.edit_message_text(
                chat_id=chat_id,
                message_id=msg_id,
                text=text,
                reply_markup=kb,
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
            return msg_id
        except TelegramBadRequest as e:
            # message is not modified / message to edit not found / etc.
            pass

    sent = await bot.send_message(chat_id, text, reply_markup=kb, parse_mode="HTML", disable_web_page_preview=True)
    return sent.message_id

async def _render_page(cb_or_msg, state: FSMContext, book_id: str, page: int, total: int):
    page = max(0, min(page, max(total - 1, 0)))
    book_path = _book_path(book_id)
    
    if not book_path:
        txt = "<b>Ошибка:</b> Файл книги не найден."
        bot = cb_or_msg.message.bot if isinstance(cb_or_msg, types.CallbackQuery) else cb_or_msg.bot
        chat_id = cb_or_msg.message.chat.id if isinstance(cb_or_msg, types.CallbackQuery) else cb_or_msg.chat.id
        await _edit_or_send_reading(bot, chat_id, None, txt, main_menu())
        if isinstance(cb_or_msg, types.CallbackQuery):
            await safe_cb_answer(cb_or_msg, "Книга не найдена", show_alert=True)
        return

    book = load_book(book_path)
    if not book or not getattr(book, "pages", None) or len(book.pages) == 0:
        txt = f"<b>{html.escape(book.title if book else 'Книга')}</b>\n<i>В этой книге нет доступных страниц для чтения.</i>"
        bot = cb_or_msg.message.bot if isinstance(cb_or_msg, types.CallbackQuery) else cb_or_msg.bot
        chat_id = cb_or_msg.message.chat.id if isinstance(cb_or_msg, types.CallbackQuery) else cb_or_msg.chat.id
        mid = await _edit_or_send_reading(bot, chat_id, None, txt, main_menu())
        await state.update_data(reading_msg_id=mid, page=0)
        if isinstance(cb_or_msg, types.CallbackQuery):
            await safe_cb_answer(cb_or_msg, "Текст книги пуст", show_alert=True)
        return

    # Сохраняем прогресс только если страницы действительно есть
    repo = JsonUserBooksRepository(get_settings().user_books_file)
    user_id = cb_or_msg.from_user.id
    repo.set_page(user_id, book_id, page)
    await state.update_data(page=page)

    text = _compose_page_text(book, page, total)
    kb = nav(page, total)
    
    data = await state.get_data()
    msg_id = data.get("reading_msg_id")
    bot = cb_or_msg.message.bot if isinstance(cb_or_msg, types.CallbackQuery) else cb_or_msg.bot
    chat_id = cb_or_msg.message.chat.id if isinstance(cb_or_msg, types.CallbackQuery) else cb_or_msg.chat.id
    
    new_msg_id = await _edit_or_send_reading(bot, chat_id, msg_id, text, kb)
    if new_msg_id != msg_id:
        await state.update_data(reading_msg_id=new_msg_id)
    if isinstance(cb_or_msg, types.CallbackQuery):
        await safe_cb_answer(cb_or_msg)

@router.callback_query(lambda c: c.data and c.data.startswith("open:"))
async def open_from_list(cb: types.CallbackQuery, state: FSMContext):
    book_id = cb.data.split(":",1)[1]
    path = _book_path(book_id)
    if not path:
        await safe_cb_answer(cb, "Файл книги не найден", show_alert=True)
        return

    book = load_book(path)
    if not book or not getattr(book, "pages", None):
        await safe_cb_answer(cb, "У книги нет страниц", show_alert=True)
        return

    total = len(book.pages)

    repo = JsonUserBooksRepository(get_settings().user_books_file)
    page = max(0, min(repo.get_page(cb.from_user.id, book_id), total - 1))

    await state.update_data(book_id=book_id, total=total, page=page, reading_msg_id=None)
    await state.set_state(Reading.reading)
    await _render_page(cb, state, book_id, page, total)

@router.callback_query(Reading.reading, F.data.in_({"prev_page","next_page"}))
async def turn_page(cb: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    book_id = data.get("book_id")
    total = int(data.get("total", 0))
    if not book_id or total <= 0:
        await safe_cb_answer(cb, "Ошибка состояния")
        return

    # первичный источник правды — FSM; если в ней нет — читаем из repo
    repo = JsonUserBooksRepository(get_settings().user_books_file)
    current = data.get("page")
    if current is None:
        current = repo.get_page(cb.from_user.id, book_id)
    if current is None:
        current = 0

    if cb.data == "prev_page":
        new_page = max(0, current - 1)
        if new_page == current:
            await safe_cb_answer(cb, "Вы на первой странице")
            return
    else:
        new_page = min(total - 1, current + 1)
        if new_page == current:
            await safe_cb_answer(cb, "Вы на последней странице")
            return

    await _render_page(cb, state, book_id, new_page, total)

@router.callback_query(Reading.reading, F.data.startswith("jump:"))
async def jump_pages(cb: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    book_id = data.get("book_id")
    total = int(data.get("total", 0))
    if not book_id or total <= 0:
        await safe_cb_answer(cb, "Ошибка состояния")
        return

    try:
        delta = int(cb.data.split(":", 1)[1])
    except Exception:
        await safe_cb_answer(cb)
        return

    repo = JsonUserBooksRepository(get_settings().user_books_file)
    current = data.get("page")
    if current is None:
        current = repo.get_page(cb.from_user.id, book_id)
    if current is None:
        current = 0

    new_page = max(0, min(total - 1, current + delta))
    if new_page == current:
        await safe_cb_answer(cb, "Дальше некуда")
        return

    await _render_page(cb, state, book_id, new_page, total)

@router.callback_query(Reading.reading, F.data == "goto")
async def goto_prompt(cb: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    total = int(data.get("total") or 0)

    await state.set_state(Reading.awaiting_page)

    if total > 0:
        text = (
            f"Введи номер страницы от 1 до {total}.\n\n"
            "Также можно:\n"
            "• 50% — перейти к указанному проценту книги\n"
            "• начало / конец / середина\n"
            "Или /cancel для отмены."
        )
    else:
        text = "Введи номер страницы (1…N) или /cancel"

    await cb.message.answer(text)
    await safe_cb_answer(cb)

@router.message(Reading.awaiting_page, F.text)
async def goto_receive_number(msg: types.Message, state: FSMContext):
    raw = (msg.text or "").strip().lower()

    # отмена
    if raw.startswith("/cancel"):
        await state.set_state(Reading.reading)
        await msg.answer("Отмена. Возвращаемся к чтению.")
        return

    # достаём контекст чтения
    data = await state.get_data()
    book_id = data.get("book_id")
    total = int(data.get("total") or 0)
    current = int(data.get("page", 0) or 0)  # 0-индексация

    if not book_id or total <= 0:
        await msg.answer("Ошибка состояния: нет открытой книги.")
        await state.set_state(Reading.reading)
        return

    target_index: int | None = None  # 0-индексация

    # --- 1. Спец-слова: начало / конец / середина ---
    if raw in {"начало", "start"}:
        target_index = 0
    elif raw in {"конец", "end"}:
        target_index = total - 1
    elif raw in {"середина", "middle"}:
        target_index = max(0, total // 2)

    # --- 2. Процент, например "50%" ---
    elif raw.endswith("%") and raw[:-1].strip().isdigit():
        percent = int(raw[:-1].strip())
        percent = max(1, min(percent, 100))
        approx = int(round((percent / 100) * total)) - 1
        target_index = max(0, min(total - 1, approx))

    # --- 3. Обычное целое число страницы ---
    elif raw.isdigit():
        page_num = int(raw)
        if page_num < 1:
            await msg.answer("Номер страницы должен быть ≥ 1. Попробуй снова или /cancel")
            return
        if page_num > total:
            await msg.answer(
                f"В книге только {total} страниц(ы). "
                f"Введи число от 1 до {total} или /cancel."
            )
            return
        target_index = page_num - 1

    else:
        await msg.answer(
            "Непонятный формат.\n"
            "Примеры: 10, 50%, начало, конец, середина или /cancel."
        )
        return

    # страховка
    target_index = max(0, min(total - 1, target_index))

    # по желанию: удаляем сообщение с вводом, чтобы не мусорило
    try:
        await msg.delete()
    except TelegramBadRequest:
        pass

    # обратно в режим чтения
    await state.set_state(Reading.reading)
    await state.update_data(book_id=book_id, total=total, page=target_index)

    # перерисовываем страницу (тот же механизм, что у листания)
    await _render_page(msg, state, book_id, target_index, total)

# Нейтральный обработчик для «неактивной» центральной кнопки
@router.callback_query(Reading.reading, F.data == "noop")
async def noop(cb: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    page = int(data.get("page", 0))
    total = int(data.get("total", 0))
    await safe_cb_answer(cb, f"{page+1}/{total}")

@router.callback_query(Reading.reading, F.data == "summarize")
async def on_summarize(cb: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    book_id = data.get("book_id")
    page = int(data.get("page", 0))
    book = load_book(_book_path(book_id))
    try:
        page_text = book.pages[page] if 0 <= page < len(book.pages) else ""
    except Exception:
        page_text = ""
    if not page_text.strip():
        await safe_cb_answer(cb, "Страница пуста", show_alert=True)
        return
    try:
        summary = summarize(page_text, max_sentences=3, lang="russian")
    except Exception:
        await safe_cb_answer(cb, "Пересказ временно недоступен", show_alert=True)
        return
    # показываем как отдельное сообщение, чтобы не портить страницу
    await cb.message.answer(f"🧠 <b>Кратко:</b>\n{html.escape(summary)}", parse_mode="HTML")
    await safe_cb_answer(cb)

@router.callback_query(Reading.reading, F.data == "tts")
async def on_tts(cb: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()

    # анти-даблклик: если уже генерим — не запускаем второй раз
    if data.get("tts_busy"):
        await safe_cb_answer(cb, "⏳ Уже озвучиваю…", show_alert=False)
        return

    await state.update_data(tts_busy=True)

    try:
        book_id = data.get("book_id")
        page = int(data.get("page", 0))

        book = load_book(_book_path(book_id))
        pages = getattr(book, "pages", []) or []
        if not pages:
            await safe_cb_answer(cb, "Текст не найден", show_alert=True)
            return

        total_pages = len(pages)

        # сколько страниц озвучивать
        s = get_settings()
        tts_pages = int(getattr(s, "tts_pages", 10))  # добавим в Settings ниже
        tts_pages = max(1, min(tts_pages, 20))        # жёсткий предел 1..20

        start = page
        end = min(total_pages, page + tts_pages)      # [start, end)
        block_pages = pages[start:end]

        # если пусто
        block_text = "\n\n".join(p for p in block_pages if str(p).strip()).strip()
        if not block_text:
            await safe_cb_answer(cb, "Пустой текст", show_alert=True)
            return

        out_dir = Path(get_settings().data_dir) / "tts_cache"
        lang = getattr(book, "lang", None)

        # ВАЖНО: synthesize_parts может кидать исключения (сеть), ловим тут
        try:
            files = await synthesize_parts(
                text=block_text,
                out_dir=out_dir,
                basename=f"{book_id}_{page}_{end-1}",
                lang=lang,
            )
        except Exception as e:
            log.exception("TTS failed: %r", e)
            await safe_cb_answer(cb, "⚠️ Озвучка временно недоступна (сеть). Попробуй позже.", show_alert=True)
            return

        if not files:
            await safe_cb_answer(cb, "⚠️ Не удалось озвучить (пустой результат).", show_alert=True)
            return

        # mp3 отправляем как AUDIO
        for i, f in enumerate(files, start=1):
            caption = f"🎧 {html.escape(book.title)} — стр. {start+1}-{end}/{total_pages}"
            if len(files) > 1:
                caption += f" ({i}/{len(files)})"
            await cb.message.answer_audio(audio=FSInputFile(f), caption=caption)

        await safe_cb_answer(cb)

    finally:
        # обязательно снимаем busy даже при ошибке
        await state.update_data(tts_busy=False)

@router.callback_query(Reading.reading, F.data == "bookmark")
async def bookmark_stub(cb: types.CallbackQuery, state: FSMContext):
    await safe_cb_answer(cb, "🔖 Закладки появятся в следующей версии", show_alert=True)

@router.callback_query(Reading.reading, F.data == "quote")
async def quote_stub(cb: types.CallbackQuery, state: FSMContext):
    await safe_cb_answer(cb, "💬 Цитаты появятся в следующей версии", show_alert=True)
