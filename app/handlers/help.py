from aiogram import Router, types
from aiogram.filters import Command
from app.utils.telegram import safe_cb_answer


router = Router()

HELP = (
    "<b>Помощь</b>\n\n"
    "• /start — приветствие и меню\n"
    "• /browse &lt;запрос&gt; — поиск по всем источникам\n"
    "• /read &lt;book_id&gt; — открыть локальную книгу\n"
    "• /mybooks — показать локальные книги\n\n"
    "Советы:\n"
    "— Используй кнопки навигации во время чтения.\n"
    "— Добавляй закладки и цитаты, потом их можно экспортировать.\n"
    "— Нажми «Пересказ», чтобы быстро вспомнить главные мысли, и «Слушать», чтобы услышать аудиоверсию."
)

@router.message(Command("help"))
async def help_cmd(msg: types.Message):
    await msg.answer(HELP, parse_mode="HTML")
