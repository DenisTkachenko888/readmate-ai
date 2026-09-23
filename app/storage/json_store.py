from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import List, Optional

import aiofiles
from pydantic import ValidationError

from app.models import Bookmark, Quote, UserBooks, UserBookState
from app.storage.base import BaseBooksRepository


class JsonStorageError(RuntimeError):
    """Raised when persisted user data cannot be read or validated safely."""


class JsonUserBooksRepository(BaseBooksRepository):
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._lock = asyncio.Lock()

    async def _read(self) -> UserBooks:
        if not self.file_path.exists() or self.file_path.stat().st_size == 0:
            return UserBooks()

        try:
            async with aiofiles.open(self.file_path, mode="r", encoding="utf-8") as f:
                raw = await f.read()
            obj = json.loads(raw or "{}")
        except (OSError, json.JSONDecodeError) as exc:
            raise JsonStorageError(f"Cannot read user storage: {self.file_path}") from exc

        data_dict = obj
        while isinstance(data_dict, dict) and "data" in data_dict and len(data_dict) == 1:
            data_dict = data_dict["data"]

        if not isinstance(data_dict, dict):
            raise JsonStorageError("User storage root must be a JSON object")

        try:
            parsed_data: dict[str, dict[str, UserBookState]] = {}
            for uid, books in data_dict.items():
                if not isinstance(books, dict):
                    raise JsonStorageError(f"Invalid books collection for user {uid!r}")
                parsed_data[str(uid)] = {
                    str(book_id): UserBookState.model_validate(state)
                    for book_id, state in books.items()
                }
            return UserBooks(data=parsed_data)
        except ValidationError as exc:
            raise JsonStorageError("User storage contains invalid data") from exc

    async def _write(self, model: UserBooks) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        raw_payload = {
            str(uid): {bid: state.model_dump() for bid, state in books.items()}
            for uid, books in model.data.items()
        }
        tmp = self.file_path.with_suffix(self.file_path.suffix + ".tmp")

        try:
            async with aiofiles.open(tmp, mode="w", encoding="utf-8") as f:
                await f.write(json.dumps(raw_payload, ensure_ascii=False, indent=2))
            os.replace(tmp, self.file_path)
        except OSError as exc:
            try:
                tmp.unlink(missing_ok=True)
            except OSError:
                pass
            raise JsonStorageError(f"Cannot write user storage: {self.file_path}") from exc

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
                if not model.data[suid]:
                    del model.data[suid]
                await self._write(model)
                return True
            return False

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
            return list(data.get(str(user_id), {}).get(book_id, UserBookState()).bookmarks)

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

    async def add_quote(
        self,
        user_id: int,
        book_id: str,
        page: int,
        text: str,
        note: Optional[str] = None,
    ) -> None:
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
            return list(data.get(str(user_id), {}).get(book_id, UserBookState()).quotes)

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
