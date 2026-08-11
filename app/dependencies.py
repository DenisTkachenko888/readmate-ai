from app.config import get_settings
from app.storage.base import BaseBooksRepository
from app.storage.json_store import JsonUserBooksRepository

_repo_instance: BaseBooksRepository | None = None

def get_repository() -> BaseBooksRepository:
    global _repo_instance
    if _repo_instance is None:
        settings = get_settings()
        # В будущем здесь будет if settings.use_dynamodb: return DynamoDbRepository(...)
        _repo_instance = JsonUserBooksRepository(settings.user_books_file)
    return _repo_instance