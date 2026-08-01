"""
AI Friend / AI Tutor — сердце ReadMateAI.

Строит «безопасный от спойлеров» контекст (кэшированный рекап «что было
раньше» + недавние страницы) и вызывает YandexGPT для всех AI-фич:
  - answer_question   — свободный диалог с ИИ-наставником (вкладка «Чат»)
  - recap_book        — «Пересказать» / «Что происходит?»
  - main_ideas         — «Главные мысли»
  - explain_simple     — «Объяснить проще» / объяснение выделенного отрывка
  - generate_terms     — «Термины»
  - generate_flashcards — «Flashcards»
  - generate_quiz / check_quiz_answer — «Проверить знания»
  - who_is             — «Кто это?» / справка по персонажу без спойлеров

Не зависит ни от aiogram, ни от FastAPI — можно звать и из Telegram-хендлеров,
и из REST-роутов (app/api/ai_routes.py), логика ровно одна и та же.

Если YandexGPT не сконфигурирован/недоступен — recap_book() тихо откатывается
на локальный TextRank; остальные функции пробрасывают YandexGPTUnavailable
дальше, вызывающий слой сам решает, как её показать пользователю.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, asdict

from app.services.reading import Book
from app.services.yandex.client import get_yandex_client, YandexGPTUnavailable
from app.services.yandex import prompts as P
from app.features.summarize import summarize as textrank_summarize

log = logging.getLogger(__name__)

RECAP_STRIDE = 10           # страниц между чекпоинтами рекапа
RECENT_WINDOW_CHARS = 8000  # сколько «сырых» символов недавних страниц шлём модели


@dataclass
class QuizQuestion:
    question: str
    answer: str
    explanation: str


@dataclass
class Flashcard:
    front: str
    back: str


def _checkpoint(page: int) -> int:
    return (page // RECAP_STRIDE) * RECAP_STRIDE


async def _story_so_far(book: Book, upto_page: int) -> str:
    """Рекурсивно строит и кэширует «рассказ о прочитанном» до чекпоинта <= upto_page.
    Каждый шаг сжимает (предыдущий рекап + один «страйд» новых страниц) в новый
    рекап, поэтому размер промпта не растёт с глубиной книги (см. план/README:
    рекап шарится между ВСЕМИ пользователями книги — считается один раз)."""
    client = get_yandex_client()
    checkpoint = _checkpoint(upto_page)
    if checkpoint <= 0:
        return ""

    prev_checkpoint = checkpoint - RECAP_STRIDE
    prev_recap = await _story_so_far(book, prev_checkpoint) if prev_checkpoint > 0 else ""

    stride_pages = book.pages[max(0, prev_checkpoint):checkpoint]
    stride_text = "\n\n".join(stride_pages).strip()
    if not stride_text:
        return prev_recap

    messages = [
        {
            "role": "system",
            "content": (
                "Сожми предыдущий рекап и новый фрагмент книги в ОДИН связный рекап "
                "не длиннее ~120 слов, по-русски, без домыслов и без забегания вперёд текста."
            ),
        },
        {
            "role": "user",
            "content": f"Предыдущий рекап:\n{prev_recap or '(пока пусто, это начало книги)'}"
            f"\n\nНовый фрагмент:\n{stride_text}",
        },
    ]
    try:
        return await client.cached_chat(
            "recap_checkpoint", [book.id, str(checkpoint)], messages, tier="lite", max_tokens=350,
        )
    except YandexGPTUnavailable:
        log.warning("YandexGPT недоступен для рекапа %s@%d — возвращаю предыдущий уровень", book.id, checkpoint)
        return prev_recap


def _recent_window(book: Book, current_page: int, checkpoint: int) -> str:
    window_pages = book.pages[checkpoint: current_page + 1]
    text = "\n\n".join(window_pages).strip()
    if len(text) > RECENT_WINDOW_CHARS:
        text = text[-RECENT_WINDOW_CHARS:]  # самый свежий хвост важнее старого начала окна
    return text


async def _build_context(book: Book, current_page: int) -> tuple[str, str]:
    """Возвращает (context_block_для_системного_сообщения, просто_recent+story_текст_для_action-промптов)."""
    checkpoint = _checkpoint(current_page)
    story_so_far = await _story_so_far(book, checkpoint)
    recent = _recent_window(book, current_page, checkpoint)
    current_text = book.pages[current_page] if 0 <= current_page < len(book.pages) else ""
    context_block = P.build_context_block(story_so_far, recent, current_text)
    flat_text = f"{story_so_far}\n\n{recent}".strip() if story_so_far else recent
    return context_block, flat_text


async def answer_question(
    book: Book, current_page: int, persona: str, question: str, history: list[dict[str, str]] | None = None,
) -> str:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("AI-наставник не настроен (нет YANDEX_API_KEY)")

    total = len(book.pages)
    system = P.build_system_prompt(
        book_title=book.title, book_author=book.author, persona=persona,
        current_page=current_page, total_pages=total,
    )
    context_block, _ = await _build_context(book, current_page)

    messages = [{"role": "system", "content": system}, {"role": "system", "content": context_block}]
    if history:
        messages.extend(history[-6:])  # ограничиваем глубину диалога — и цену, и риск расфокусировки
    messages.append({"role": "user", "content": question})

    return await client.chat(messages, tier="lite", temperature=0.5, max_tokens=500)


async def recap_book(book: Book, current_page: int) -> str:
    """«Пересказать» / «Что происходит?» — рекап без спойлеров, с общим кэшем на
    книгу+диапазон страниц (первый пользователь платит токенами, остальные — бесплатно).
    При недоступности YandexGPT — локальный TextRank по недавним страницам."""
    client = get_yandex_client()
    checkpoint = _checkpoint(current_page)
    try:
        if not client.enabled:
            raise YandexGPTUnavailable("нет ключа")
        story = await _story_so_far(book, checkpoint)
        recent = _recent_window(book, current_page, checkpoint)
        return await client.cached_chat(
            "recap_full", [book.id, str(current_page)],
            P.recap_prompt(f"{story}\n\n{recent}" if story else recent),
            tier="lite", max_tokens=350,
        )
    except YandexGPTUnavailable:
        fallback_text = book.pages[current_page] if 0 <= current_page < len(book.pages) else ""
        return textrank_summarize(fallback_text, max_sentences=3, lang="russian")


async def main_ideas(book: Book, current_page: int) -> str:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    _, flat = await _build_context(book, current_page)
    return await client.cached_chat(
        "main_ideas", [book.id, str(current_page)], P.main_ideas_prompt(flat), tier="lite", max_tokens=350,
    )


async def generate_terms(book: Book, current_page: int) -> str:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    _, flat = await _build_context(book, current_page)
    return await client.cached_chat(
        "terms", [book.id, str(current_page)], P.terms_prompt(flat), tier="lite", max_tokens=350,
    )


async def generate_flashcards(book: Book, current_page: int, n_cards: int = 6) -> list[Flashcard]:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    _, flat = await _build_context(book, current_page)
    raw = await client.cached_chat(
        "flashcards", [book.id, str(current_page), str(n_cards)],
        P.flashcards_prompt(flat, n_cards), tier="lite", max_tokens=600,
    )
    data = _parse_json(raw)
    return [Flashcard(front=c.get("front", "").strip(), back=c.get("back", "").strip()) for c in data.get("cards", [])]


async def generate_quiz(book: Book, current_page: int, n_questions: int = 3) -> list[QuizQuestion]:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    _, flat = await _build_context(book, current_page)
    raw = await client.cached_chat(
        "quiz", [book.id, str(current_page), str(n_questions)],
        P.quiz_prompt(flat, n_questions), tier="lite", max_tokens=700,
    )
    data = _parse_json(raw)
    return [
        QuizQuestion(question=q.get("question", "").strip(), answer=q.get("answer", "").strip(), explanation=q.get("explanation", "").strip())
        for q in data.get("questions", []) if q.get("question")
    ]


async def check_quiz_answer(*, question: str, expected: str, explanation: str, user_answer: str, persona: str) -> str:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    return await client.chat(P.check_answer_prompt(persona, question, expected, explanation, user_answer), tier="lite", max_tokens=300)


async def explain_passage(passage: str, mode: str = "simple") -> str:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    return await client.chat(P.explain_prompt(passage, mode), tier="lite", max_tokens=350)


async def who_is(book: Book, current_page: int, query: str) -> str:
    client = get_yandex_client()
    if not client.enabled:
        raise YandexGPTUnavailable("Недоступно без YandexGPT")
    _, flat = await _build_context(book, current_page)
    return await client.chat(P.who_is_prompt(query, flat), tier="lite", max_tokens=300)


def _parse_json(raw: str) -> dict:
    cleaned = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.M).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        log.warning("Не смог распарсить JSON от YandexGPT, отдаю пусто: %r", raw[:200])
        return {}