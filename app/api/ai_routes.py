# app/api/ai_routes.py
"""
REST-обвязка над app/features/tutor.py для фронтенда (AiPanel).

Все эндпоинты принимают user_id — но НЕ доверяют ему напрямую с фронтенда:
в проде user_id должен приходить уже провалидированным из Telegram initData
на уровне Next.js BFF-прокси (frontend/app/api/backend/[...path]/route.ts),
который подставляет trusted user_id в запрос к этому сервису. Здесь мы просто
используем его для персонализации/сохранения прогресса — конечная проверка
подлинности лежит на прокси-слое.
"""
from __future__ import annotations

import logging
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.config import get_settings
from app.services.reading import load_book
from app.storage.json_store import JsonUserBooksRepository
from app.services.yandex.client import YandexGPTUnavailable
from app.features import tutor as ai

log = logging.getLogger(__name__)
router = APIRouter()

ActionId = Literal["retell", "explain", "main-ideas", "quiz", "terms", "flashcards"]


def _load_book_or_404(book_id: str):
    s = get_settings()
    path = s.books_dir / f"{book_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Книга не найдена")
    book = load_book(path)
    if not book or not book.pages:
        raise HTTPException(status_code=404, detail="В книге нет текста")
    return book


def _safe_page(book, page: int) -> int:
    return max(0, min(page, len(book.pages) - 1))


def _repo() -> JsonUserBooksRepository:
    return JsonUserBooksRepository(get_settings().user_books_file)


# ---------------------------------------------------------------- persona ---

class PersonaBody(BaseModel):
    user_id: int
    book_id: str
    persona: str


@router.get("/persona")
async def get_persona(user_id: int = Query(...), book_id: str = Query(...)):
    return {"persona": _repo().get_persona(user_id, book_id)}


@router.post("/persona")
async def set_persona(body: PersonaBody):
    if body.persona not in ("teacher", "friend", "philosopher", "psychologist"):
        raise HTTPException(status_code=400, detail="Неизвестная роль наставника")
    _repo().set_persona(body.user_id, body.book_id, body.persona)
    return {"ok": True}


# -------------------------------------------------------------------- chat ---

class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatBody(BaseModel):
    user_id: int
    book_id: str
    page: int
    persona: str = "teacher"
    question: str
    history: list[ChatTurn] = Field(default_factory=list)


@router.post("/chat")
async def chat(body: ChatBody):
    book = _load_book_or_404(body.book_id)
    page = _safe_page(book, body.page)
    try:
        answer = await ai.answer_question(
            book, page, body.persona, body.question,
            history=[h.model_dump() for h in body.history],
        )
    except YandexGPTUnavailable as e:
        raise HTTPException(status_code=503, detail=f"AI-наставник временно недоступен: {e}")
    return {"answer": answer}


# ------------------------------------------------------------- quick actions ---

class ActionBody(BaseModel):
    user_id: int
    book_id: str
    page: int
    action: ActionId


class QuizQuestionOut(BaseModel):
    question: str
    answer: str
    explanation: str


class FlashcardOut(BaseModel):
    front: str
    back: str


class ActionResponse(BaseModel):
    kind: Literal["text", "quiz", "flashcards"]
    text: Optional[str] = None
    questions: Optional[list[QuizQuestionOut]] = None
    cards: Optional[list[FlashcardOut]] = None


@router.post("/action", response_model=ActionResponse)
async def run_action(body: ActionBody):
    book = _load_book_or_404(body.book_id)
    page = _safe_page(book, body.page)
    try:
        if body.action == "retell":
            text = await ai.recap_book(book, page)
            return ActionResponse(kind="text", text=text)
        if body.action == "main-ideas":
            text = await ai.main_ideas(book, page)
            return ActionResponse(kind="text", text=text)
        if body.action == "explain":
            # «Объяснить проще» из панели действий — упрощаем текущую страницу целиком
            text = await ai.explain_passage(book.pages[page], mode="simple")
            return ActionResponse(kind="text", text=text)
        if body.action == "terms":
            text = await ai.generate_terms(book, page)
            return ActionResponse(kind="text", text=text)
        if body.action == "quiz":
            questions = await ai.generate_quiz(book, page, n_questions=3)
            return ActionResponse(kind="quiz", questions=[QuizQuestionOut(**vars(q)) for q in questions])
        if body.action == "flashcards":
            cards = await ai.generate_flashcards(book, page, n_cards=6)
            return ActionResponse(kind="flashcards", cards=[FlashcardOut(**vars(c)) for c in cards])
    except YandexGPTUnavailable as e:
        raise HTTPException(status_code=503, detail=f"AI-функция временно недоступна: {e}")
    raise HTTPException(status_code=400, detail="Неизвестное действие")


# ----------------------------------------------------------------- who-is ---

class WhoIsBody(BaseModel):
    user_id: int
    book_id: str
    page: int
    query: str


@router.post("/whois")
async def whois(body: WhoIsBody):
    book = _load_book_or_404(body.book_id)
    page = _safe_page(book, body.page)
    try:
        answer = await ai.who_is(book, page, body.query)
    except YandexGPTUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Недоступно: {e}")
    return {"answer": answer}


# ------------------------------------------------------- explain selection ---

class ExplainBody(BaseModel):
    passage: str
    mode: Literal["simple", "example", "context"] = "simple"


@router.post("/explain")
async def explain(body: ExplainBody):
    if not body.passage.strip():
        raise HTTPException(status_code=400, detail="Пустой отрывок")
    try:
        text = await ai.explain_passage(body.passage, body.mode)
    except YandexGPTUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Недоступно: {e}")
    return {"text": text}


# --------------------------------------------------------------- quiz check ---

class QuizCheckBody(BaseModel):
    persona: str = "teacher"
    question: str
    answer: str
    explanation: str = ""
    user_answer: str


@router.post("/quiz/check")
async def quiz_check(body: QuizCheckBody):
    try:
        verdict = await ai.check_quiz_answer(
            question=body.question, expected=body.answer, explanation=body.explanation,
            user_answer=body.user_answer, persona=body.persona,
        )
    except YandexGPTUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Недоступно: {e}")
    return {"verdict": verdict}