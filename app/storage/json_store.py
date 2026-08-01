from __future__ import annotations

import json
from pathlib import Path
from typing import List
from pydantic import ValidationError

from app.models import UserBooks, UserBookState, Bookmark, Quote


class JsonUserBooksRepository:
    def __init__(self, file_path: Path):
        self.file_path = file_path

    def _read(self) -> UserBooks:
        if not self.file_path.exists() or self.file_path.stat().st_size == 0:
            return UserBooks()
        try:
            raw = self.file_path.read_text(encoding="utf-8")
            obj = json.loads(raw or "{}")

            # Безопасно разворачиваем случайно созданные рекурсивные ключи "data"
            data_dict = obj
            while isinstance(data_dict, dict) and "data" in data_dict and len(data_dict) == 1:
                data_dict = data_dict["data"]

            parsed_data = {}
            if isinstance(data_dict, dict):
                for uid, books in data_dict.items():
                    if isinstance(books, dict):
                        parsed_data[str(uid)] = {
                            bid: UserBookState(**state) if isinstance(state, dict) else UserBookState()
                            for bid, state in books.items()
                        }
            return UserBooks(data=parsed_data)
        except (json.JSONDecodeError, ValidationError, Exception):
            return UserBooks()

    def _write(self, model: UserBooks) -> None:
        # Пишем плоский словарь {uid: {book_id: state}} без лишней обертки "data"
        raw_payload = {
            str(uid): {bid: state.model_dump() for bid, state in books.items()}
            for uid, books in model.data.items()
        }
        self.file_path.write_text(
            json.dumps(raw_payload, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    def get_page(self, user_id: int, book_id: str) -> int:
        data = self._read().data
        return data.get(str(user_id), {}).get(book_id, UserBookState()).page

    def set_page(self, user_id: int, book_id: str, page: int) -> None:
        model = self._read()
        suid = str(user_id)
        if suid not in model.data:
            model.data[suid] = {}
        state = model.data[suid].get(book_id, UserBookState())
        state.page = page
        model.data[suid][book_id] = state
        self._write(model)

    def remove_book(self, user_id: int, book_id: str) -> bool:
        """Удаляет прогресс по конкретной книге у пользователя."""
        model = self._read()
        suid = str(user_id)
        if suid in model.data and book_id in model.data[suid]:
            del model.data[suid][book_id]
            self._write(model)
            return True
        return False

    # ---- Закладки (Bookmarks) ----

    def add_bookmark(self, user_id: int, book_id: str, page: int, label: str) -> None:
        model = self._read()
        suid = str(user_id)
        if suid not in model.data:
            model.data[suid] = {}
        state = model.data[suid].get(book_id, UserBookState())
        state.bookmarks.append(Bookmark(page=page, label=label))
        model.data[suid][book_id] = state
        self._write(model)

    def list_bookmarks(self, user_id: int, book_id: str) -> List[Bookmark]:
        data = self._read().data
        return data.get(str(user_id), {}).get(book_id, UserBookState()).bookmarks

    def remove_bookmark(self, user_id: int, book_id: str, idx: int) -> bool:
        model = self._read()
        suid = str(user_id)
        state = model.data.get(suid, {}).get(book_id)
        if not state or idx < 0 or idx >= len(state.bookmarks):
            return False
        state.bookmarks.pop(idx)
        self._write(model)
        return True

    # ---- Цитаты (Quotes) ----

    def add_quote(self, user_id: int, book_id: str, page: int, text: str, note: str | None = None) -> None:
        model = self._read()
        suid = str(user_id)
        if suid not in model.data:
            model.data[suid] = {}
        state = model.data[suid].get(book_id, UserBookState())
        state.quotes.append(Quote(page=page, text=text, note=note))
        model.data[suid][book_id] = state
        self._write(model)

    def list_quotes(self, user_id: int, book_id: str) -> List[Quote]:
        data = self._read().data
        return data.get(str(user_id), {}).get(book_id, UserBookState()).quotes

    def remove_quote(self, user_id: int, book_id: str, idx: int) -> bool:
        model = self._read()
        suid = str(user_id)
        state = model.data.get(suid, {}).get(book_id)
        if not state or idx < 0 or idx >= len(state.quotes):
            return False
        state.quotes.pop(idx)
        self._write(model)
        return True