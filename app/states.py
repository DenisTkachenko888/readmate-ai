from aiogram.fsm.state import State, StatesGroup
from app.utils.telegram import safe_cb_answer

class Reading(StatesGroup):
    reading = State()
    awaiting_page = State() 
    awaiting_quote_text = State()
    awaiting_quote_note = State()

class Search(StatesGroup):
    choosing_source = State()
    entering_query = State()
