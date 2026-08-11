from __future__ import annotations
import json
import os
import asyncio
import aiofiles
from pathlib import Path
from typing import List, Optional

from pydantic import ValidationError
from app.models import UserBooks, UserBookState, Bookmark, Quote
from app.storage.base import BaseBooksRepository

class JsonUserBooksRepository(BaseBooksRepository):
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._lock = asyncio.Lock()  # Блокировка для предотвращения Race Condition

    async def _read(self) -> UserBooks:
        if not self.file_path.exists() or self.file_path.stat().st_size == 0:
            return UserBooks()
        try:
            async with aiofiles.open(self.file_path, mode='r', encoding="utf-8") as f:
                raw = await f.read()
                
            obj = json.loads(raw or "{}")
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

    async def _write(self, model: UserBooks) -> None:
        raw_payload = {
            str(uid): {bid: state.model_dump() for bid, state in books.items()}
            for uid, books in model.data.items()
        }
        tmp = self.file_path.with_suffix(".json.tmp")
        
        async with aiofiles.open(tmp, mode='w', encoding="utf-8") as f:
            await f.write(json.dumps(raw_payload, ensure_ascii=False, indent=2))
            
        os.replace(tmp, self.file_path)

    async def get_page(self, user_id: int, book_id: str) -> int:
        async with self._lock:
            data = (await self._read()).data
            return data.get(str(user_id), {}).get(book_id, UserBookState()).page

    async def set_page(self, user_id: int, book_id: str, page: int) -> None:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            if suid not in model.data:
                model.data[suid] = {}
            state = model.data[suid].get(book_id, UserBookState())
            state.page = page
            model.data[suid][book_id] = state
            await self._write(model)

    async def remove_book(self, user_id: int, book_id: str) -> bool:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            if suid in model.data and book_id in model.data[suid]:
                del model.data[suid][book_id]
                await self._write(model)
                return True
            return False

    # ----   (AI Friend/Tutor persona) ----
    async def get_persona(self, user_id: int, book_id: str) -> str:
        async with self._lock:
            data = (await self._read()).data
            return data.get(str(user_id), {}).get(book_id, UserBookState()).persona_style

    async def set_persona(self, user_id: int, book_id: str, persona: str) -> None:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            if suid not in model.data:
                model.data[suid] = {}
            state = model.data[suid].get(book_id, UserBookState())
            state.persona_style = persona
            model.data[suid][book_id] = state
            await self._write(model)

    # ----   (Bookmarks) ----
    async def add_bookmark(self, user_id: int, book_id: str, page: int, label: str) -> None:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            if suid not in model.data:
                model.data[suid] = {}
            state = model.data[suid].get(book_id, UserBookState())
            state.bookmarks.append(Bookmark(page=page, label=label))
            model.data[suid][book_id] = state
            await self._write(model)

    async def list_bookmarks(self, user_id: int, book_id: str) -> List[Bookmark]:
        async with self._lock:
            data = (await self._read()).data
            return data.get(str(user_id), {}).get(book_id, UserBookState()).bookmarks

    async def remove_bookmark(self, user_id: int, book_id: str, idx: int) -> bool:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            state = model.data.get(suid, {}).get(book_id)
            if not state or idx < 0 or idx >= len(state.bookmarks):
                return False
            state.bookmarks.pop(idx)
            await self._write(model)
            return True

    # ----   (Quotes) ----
    async def add_quote(self, user_id: int, book_id: str, page: int, text: str, note: Optional[str] = None) -> None:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            if suid not in model.data:
                model.data[suid] = {}
            state = model.data[suid].get(book_id, UserBookState())
            state.quotes.append(Quote(page=page, text=text, note=note))
            model.data[suid][book_id] = state
            await self._write(model)

    async def list_quotes(self, user_id: int, book_id: str) -> List[Quote]:
        async with self._lock:
            data = (await self._read()).data
            return data.get(str(user_id), {}).get(book_id, UserBookState()).quotes

    async def remove_quote(self, user_id: int, book_id: str, idx: int) -> bool:
        async with self._lock:
            model = await self._read()
            suid = str(user_id)
            state = model.data.get(suid, {}).get(book_id)
            if not state or idx < 0 or idx >= len(state.quotes):
                return False
            state.quotes.pop(idx)
            await self._write(model)
            return True