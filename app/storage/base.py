from abc import ABC, abstractmethod
from typing import List, Optional
from app.models import Bookmark, Quote

class BaseBooksRepository(ABC):
    """
    Абстрактный интерфейс для работы с пользовательской библиотекой.
    """
    @abstractmethod
    async def get_page(self, user_id: int, book_id: str) -> int:
        pass

    @abstractmethod
    async def set_page(self, user_id: int, book_id: str, page: int) -> None:
        pass

    @abstractmethod
    async def remove_book(self, user_id: int, book_id: str) -> bool:
        pass

    @abstractmethod
    async def get_persona(self, user_id: int, book_id: str) -> str:
        pass

    @abstractmethod
    async def set_persona(self, user_id: int, book_id: str, persona: str) -> None:
        pass

    @abstractmethod
    async def add_bookmark(self, user_id: int, book_id: str, page: int, label: str) -> None:
        pass

    @abstractmethod
    async def list_bookmarks(self, user_id: int, book_id: str) -> List[Bookmark]:
        pass

    @abstractmethod
    async def remove_bookmark(self, user_id: int, book_id: str, idx: int) -> bool:
        pass

    @abstractmethod
    async def add_quote(self, user_id: int, book_id: str, page: int, text: str, note: Optional[str] = None) -> None:
        pass

    @abstractmethod
    async def list_quotes(self, user_id: int, book_id: str) -> List[Quote]:
        pass

    @abstractmethod
    async def remove_quote(self, user_id: int, book_id: str, idx: int) -> bool:
        pass