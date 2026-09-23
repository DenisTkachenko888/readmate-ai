# app/api/routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from app.config import get_settings
from app.services.reading import list_books, load_book
from app.storage.factory import get_books_repository
from app.services.providers.gutendex import search as g_search
from app.features.tts import synthesize_parts
from app.api.auth import get_current_user

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


@router.get("/library", response_model=List[BookItem])
async def get_library(user_id: int = Depends(get_current_user)):
    """Возвращает список книг в библиотеке пользователя с его прогрессом."""
    s = get_settings()
    repo = get_books_repository()
    books = list_books(s.books_dir)

    result = []
    for b in books:
        current_page = await repo.get_page(user_id, b.id)
        result.append(
            BookItem(id=b.id, title=b.title, author=b.author, progress=current_page, total_pages=len(b.pages))
        )
    return result


@router.get("/books/{book_id}/page/{page_num}", response_model=PageResponse)
async def get_book_page(book_id: str, page_num: int, user_id: int = Depends(get_current_user)):
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

    await get_books_repository().set_page(user_id, book_id, safe_page)

    return PageResponse(
        book_id=book_id, title=book.title, page_number=safe_page, total_pages=total_pages, text=book.pages[safe_page]
    )


@router.get("/search")
async def search_books(query: str = Query(..., min_length=2), user_id: int = Depends(get_current_user)):
    """Поиск книг в Gutenberg (подготовка к добавлению в библиотеку). Защищено от спама извне."""
    try:
        results = await g_search(query, limit=10)
        return {"status": "ok", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------------------- bookmarks ---

class BookmarkBody(BaseModel):
    book_id: str
    page: int
    label: str = ""


@router.get("/bookmarks")
async def list_bookmarks(book_id: str = Query(...), user_id: int = Depends(get_current_user)):
    marks = await get_books_repository().list_bookmarks(user_id, book_id)
    return [{"page": m.page, "label": m.label} for m in marks]


@router.post("/bookmarks")
async def add_bookmark(body: BookmarkBody, user_id: int = Depends(get_current_user)):
    s = get_settings()
    book_path = s.books_dir / f"{body.book_id}.json"
    if not book_path.exists():
        raise HTTPException(status_code=404, detail="Книга не найдена")
    label = body.label or f"Страница {body.page + 1}"
    await get_books_repository().add_bookmark(user_id, body.book_id, body.page, label)
    return {"ok": True}


@router.delete("/bookmarks/{idx}")
async def delete_bookmark(idx: int, book_id: str = Query(...), user_id: int = Depends(get_current_user)):
    ok = await get_books_repository().remove_bookmark(user_id, book_id, idx)
    if not ok:
        raise HTTPException(status_code=404, detail="Закладка не найдена")
    return {"ok": True}


# ------------------------------------------------------------------ quotes ---

class QuoteBody(BaseModel):
    book_id: str
    page: int
    text: str
    note: Optional[str] = None


@router.get("/quotes")
async def list_quotes(book_id: str = Query(...), user_id: int = Depends(get_current_user)):
    quotes = await get_books_repository().list_quotes(user_id, book_id)
    return [{"page": q.page, "text": q.text, "note": q.note} for q in quotes]


@router.post("/quotes")
async def add_quote(body: QuoteBody, user_id: int = Depends(get_current_user)):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Пустая цитата")
    await get_books_repository().add_quote(user_id, body.book_id, body.page, body.text.strip(), body.note)
    return {"ok": True}


@router.delete("/quotes/{idx}")
async def delete_quote(idx: int, book_id: str = Query(...), user_id: int = Depends(get_current_user)):
    ok = await get_books_repository().remove_quote(user_id, book_id, idx)
    if not ok:
        raise HTTPException(status_code=404, detail="Цитата не найдена")
    return {"ok": True}


# --------------------------------------------------------------------- tts ---

@router.get("/books/{book_id}/page/{page_num}/audio")
async def get_page_audio(book_id: str, page_num: int, user_id: int = Depends(get_current_user)):
    """Синтезирует (или отдаёт уже закэшированную) озвучку страницы. Защищено авторизацией."""
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
