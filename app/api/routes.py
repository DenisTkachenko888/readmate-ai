# app/api/routes.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any

from app.config import get_settings
from app.services.reading import list_books, load_book
from app.storage.json_store import JsonUserBooksRepository
from app.services.providers.gutendex import search as g_search

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
async def get_library(user_id: int = Query(..., description="Telegram User ID")):
    """Возвращает список книг в библиотеке пользователя с его прогрессом."""
    s = get_settings()
    repo = JsonUserBooksRepository(s.user_books_file)
    books = list_books(s.books_dir)
    
    result = []
    for b in books:
        current_page = repo.get_page(user_id, b.id)
        result.append(
            BookItem(
                id=b.id,
                title=b.title,
                author=b.author,
                progress=current_page,
                total_pages=len(b.pages)
            )
        )
    return result

@router.get("/books/{book_id}/page/{page_num}", response_model=PageResponse)
async def get_book_page(book_id: str, page_num: int, user_id: int = Query(...)):
    """Отдает текст конкретной страницы и сохраняет прогресс пользователя."""
    s = get_settings()
    book_path = s.books_dir / f"{book_id}.json"
    
    if not book_path.exists():
        raise HTTPException(status_code=404, detail="Книга не найдена")
        
    book = load_book(book_path)
    if not book.pages or len(book.pages) == 0:
        raise HTTPException(status_code=404, detail="В книге нет страниц")
        
    total_pages = len(book.pages)
    safe_page = max(0, min(page_num, total_pages - 1))
    
    # Сохраняем прогресс чтения
    repo = JsonUserBooksRepository(s.user_books_file)
    repo.set_page(user_id, book_id, safe_page)
    
    return PageResponse(
        book_id=book_id,
        title=book.title,
        page_number=safe_page,
        total_pages=total_pages,
        text=book.pages[safe_page]
    )

@router.get("/search")
async def search_books(query: str = Query(..., min_length=2)):
    """Поиск книг в Gutenberg (подготовка к добавлению в библиотеку)."""
    try:
        results = await g_search(query, limit=10)
        return {"status": "ok", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))