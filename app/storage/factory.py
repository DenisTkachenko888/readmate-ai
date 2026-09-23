from functools import lru_cache

from app.config import get_settings
from app.storage.base import BaseBooksRepository
from app.storage.json_store import JsonUserBooksRepository


@lru_cache(maxsize=1)
def get_books_repository() -> BaseBooksRepository:
    """Return the process-wide repository used by API routes and bot handlers.

    Keeping repository construction in one place gives the JSON backend one shared
    asyncio.Lock today and lets us replace JSON with PostgreSQL later without
    rewriting every caller.
    """
    return JsonUserBooksRepository(get_settings().user_books_file)


def reset_books_repository_cache() -> None:
    """Clear the cached repository instance (mainly useful in tests)."""
    get_books_repository.cache_clear()
