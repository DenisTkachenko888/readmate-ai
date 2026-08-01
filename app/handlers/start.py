from aiogram import Router, types, F
from aiogram.filters import CommandStart
from app.keyboards.common import main_menu
from app.utils.telegram import safe_cb_answer

router = Router()

WELCOME = (
    "<b>📖 ReadMateAI</b>\n"
    "Умная читалка в Telegram: находит книги, разбивает на страницы, сохраняет прогресс, "
    "делает закладки и цитаты, пересказывает и может озвучить текст.\n\n"
    "Нажми «Найти книгу», чтобы начать."
)

@router.message(CommandStart())
async def start(msg: types.Message):
    await msg.answer(WELCOME, reply_markup=main_menu(), parse_mode="HTML")

@router.callback_query(F.data == "browse")
async def on_browse_click(cb: types.CallbackQuery):
    await cb.message.answer("Напиши название или автора — поищу в Gutenberg.")
    await cb.answer()
