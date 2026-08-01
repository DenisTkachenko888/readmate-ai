from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Any


class Book:
    def __init__(self, book_id: str, meta: Dict[str, Any], pages: List[str]):
        self.id = book_id
        self.title = meta.get("title", "Untitled")
        self.author = meta.get("author", "Unknown")
        self.lang = meta.get("lang")  # "en" / "ru" / etc.
        self.pages = pages


def load_book(book_path: Path) -> Book:
    data = json.loads(book_path.read_text(encoding="utf-8"))

    meta = {
        "title": data.get("title") or data.get("book_title") or "Untitled",
        "author": data.get("author") or data.get("book_author") or "Unknown",
        "lang": data.get("lang"),  # важно для TTS
    }

    pages = data.get("pages") or data.get("text_pages") or []
    if not isinstance(pages, list):
        pages = []

    # на всякий случай приводим все страницы к строкам
    pages = [str(p) for p in pages]

    return Book(book_id=book_path.stem, meta=meta, pages=pages)


def list_books(books_dir: Path) -> List[Book]:
    items: List[Book] = []
    for p in sorted(books_dir.glob("*.json")):
        try:
            items.append(load_book(p))
        except Exception:
            continue
    return items
