# app/api/routes.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from app.config import get_settings
from app.services.reading import list_books, load_book
from app.storage.json_store import JsonUserBooksRepository
from app.services.providers.gutendex import search as g_search
from app.features.tts import synthesize_parts

router = APIRouter()


class BookItem(BaseModel):
    id: str
    title: str
    author: str
    progress: int
    total_pages: int


class PageResponse(BaseModel):
    book_id: str
    title: str
    page_number: int
    total_pages: int
    text: str


def _repo() -> JsonUserBooksRepository:
    return JsonUserBooksRepository(get_settings().user_books_file)


@router.get("/library", response_model=List[BookItem])
async def get_library(user_id: int = Query(..., description="Telegram User ID")):
    """Возвращает список книг в библиотеке пользователя с его прогрессом."""
    s = get_settings()
    repo = _repo()
    books = list_books(s.books_dir)

    result = []
    for b in books:
        current_page = repo.get_page(user_id, b.id)
        result.append(
            BookItem(id=b.id, title=b.title, author=b.author, progress=current_page, total_pages=len(b.pages))
        )
    return result


@router.get("/books/{book_id}/page/{page_num}", response_model=PageResponse)
async def get_book_page(book_id: str, page_num: int, user_id: int = Query(...)):
    """Отдаёт текст конкретной страницы и сохраняет прогресс пользователя."""
    s = get_settings()
    book_path = s.books_dir / f"{book_id}.json"

    if not book_path.exists():
        raise HTTPException(status_code=404, detail="Книга не найдена")

    book = load_book(book_path)
    if not book.pages or len(book.pages) == 0:
        raise HTTPException(status_code=404, detail="В книге нет страниц")

    total_pages = len(book.pages)
    safe_page = max(0, min(page_num, total_pages - 1))

    _repo().set_page(user_id, book_id, safe_page)

    return PageResponse(
        book_id=book_id, title=book.title, page_number=safe_page, total_pages=total_pages, text=book.pages[safe_page]
    )


@router.get("/search")
async def search_books(query: str = Query(..., min_length=2)):
    """Поиск книг в Gutenberg (подготовка к добавлению в библиотеку)."""
    try:
        results = await g_search(query, limit=10)
        return {"status": "ok", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------------------- bookmarks ---

class BookmarkBody(BaseModel):
    user_id: int
    book_id: str
    page: int
    label: str = ""


@router.get("/bookmarks")
async def list_bookmarks(user_id: int = Query(...), book_id: str = Query(...)):
    marks = _repo().list_bookmarks(user_id, book_id)
    return [{"page": m.page, "label": m.label} for m in marks]


@router.post("/bookmarks")
async def add_bookmark(body: BookmarkBody):
    s = get_settings()
    book_path = s.books_dir / f"{body.book_id}.json"
    if not book_path.exists():
        raise HTTPException(status_code=404, detail="Книга не найдена")
    label = body.label or f"Страница {body.page + 1}"
    _repo().add_bookmark(body.user_id, body.book_id, body.page, label)
    return {"ok": True}


@router.delete("/bookmarks/{idx}")
async def delete_bookmark(idx: int, user_id: int = Query(...), book_id: str = Query(...)):
    ok = _repo().remove_bookmark(user_id, book_id, idx)
    if not ok:
        raise HTTPException(status_code=404, detail="Закладка не найдена")
    return {"ok": True}


# ------------------------------------------------------------------ quotes ---

class QuoteBody(BaseModel):
    user_id: int
    book_id: str
    page: int
    text: str
    note: Optional[str] = None


@router.get("/quotes")
async def list_quotes(user_id: int = Query(...), book_id: str = Query(...)):
    quotes = _repo().list_quotes(user_id, book_id)
    return [{"page": q.page, "text": q.text, "note": q.note} for q in quotes]


@router.post("/quotes")
async def add_quote(body: QuoteBody):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Пустая цитата")
    _repo().add_quote(body.user_id, body.book_id, body.page, body.text.strip(), body.note)
    return {"ok": True}


@router.delete("/quotes/{idx}")
async def delete_quote(idx: int, user_id: int = Query(...), book_id: str = Query(...)):
    ok = _repo().remove_quote(user_id, book_id, idx)
    if not ok:
        raise HTTPException(status_code=404, detail="Цитата не найдена")
    return {"ok": True}


# --------------------------------------------------------------------- tts ---

@router.get("/books/{book_id}/page/{page_num}/audio")
async def get_page_audio(book_id: str, page_num: int):
    """Синтезирует (или отдаёт уже закэшированную) озвучку страницы и
    возвращает список URL-частей относительно /audio — их нужно проиграть
    по очереди. Генерация "ленивая": первый запрос на страницу может занять
    пару секунд, все следующие — мгновенные (файлы уже на диске)."""
    s = get_settings()
    book_path = s.books_dir / f"{book_id}.json"
    if not book_path.exists():
        raise HTTPException(status_code=404, detail="Книга не найдена")
    book = load_book(book_path)
    safe_page = max(0, min(page_num, len(book.pages) - 1))
    text = book.pages[safe_page]

    out_dir = s.data_dir / "tts_cache"
    basename = f"{book_id}_{safe_page}"
    files = await synthesize_parts(
        text, out_dir, basename,
        max_parts=s.tts_max_parts, max_total_chars=s.tts_max_total_chars,
    )
    if not files:
        raise HTTPException(status_code=503, detail="Озвучка временно недоступна (TTS-бэкенд выключен или сбой сети)")
    return {"parts": [f"/audio/{f.name}" for f in files]}