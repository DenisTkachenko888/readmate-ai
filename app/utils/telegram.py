from aiogram.exceptions import TelegramBadRequest

async def safe_cb_answer(cb, text: str | None = None, **kwargs):
    try:
        await cb.answer(text or "", **kwargs)
    except TelegramBadRequest:
        # устаревший callback — просто игнорируем
        pass
