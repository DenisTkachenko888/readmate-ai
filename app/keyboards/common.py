from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

def main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔎 Найти книгу", callback_data="browse")]
    ])

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

def _progress_bar(page: int, total: int, width: int = 10) -> str:
    if total <= 0:
        return "░" * width
    filled = int(round((page + 1) / total * width))
    return "▓" * filled + "░" * (width - filled)

def nav(page: int, total: int) -> InlineKeyboardMarkup:
    percent = int(((page + 1) / max(total, 1)) * 100)
    bar = _progress_bar(page, total)
    center = f"{page+1}/{total} • {percent}%"

    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⏮ −10", callback_data="jump:-10"),
            InlineKeyboardButton(text="⬅️ −1", callback_data="prev_page"),
            InlineKeyboardButton(text=center, callback_data="noop"),
            InlineKeyboardButton(text="+1 ➡️", callback_data="next_page"),
            InlineKeyboardButton(text="+10 ⏭", callback_data="jump:+10"),
        ],
        [
            InlineKeyboardButton(text=f"{bar}", callback_data="noop"),
        ],
        [
            InlineKeyboardButton(text="🔢 Перейти к странице", callback_data="goto"),
            InlineKeyboardButton(text="🔖 Закладка", callback_data="bookmark"),
            InlineKeyboardButton(text="💬 Цитата", callback_data="quote"),
        ],
        [
            InlineKeyboardButton(text="🧠 Пересказ", callback_data="summarize"),
            InlineKeyboardButton(text="🔉 Слушать", callback_data="tts"),
        ],
    ])

def books_list(items: list[tuple[str, str]]) -> InlineKeyboardMarkup:
    rows = []
    for bid, title in items:
        rows.append([InlineKeyboardButton(text=f"📖 {title}", callback_data=f"open:{bid}")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
