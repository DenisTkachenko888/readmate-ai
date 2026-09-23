import asyncio
import json

import pytest

from app.storage.json_store import JsonStorageError, JsonUserBooksRepository


def run(coro):
    return asyncio.run(coro)


def test_page_round_trip(tmp_path):
    repo = JsonUserBooksRepository(tmp_path / "user_books.json")

    run(repo.set_page(42, "book-1", 7))

    assert run(repo.get_page(42, "book-1")) == 7
    payload = json.loads((tmp_path / "user_books.json").read_text(encoding="utf-8"))
    assert payload["42"]["book-1"]["page"] == 7


def test_bookmarks_quotes_and_persona_round_trip(tmp_path):
    repo = JsonUserBooksRepository(tmp_path / "user_books.json")

    run(repo.set_persona(42, "book-1", "friend"))
    run(repo.add_bookmark(42, "book-1", 3, "Important"))
    run(repo.add_quote(42, "book-1", 4, "A quote", "A note"))

    assert run(repo.get_persona(42, "book-1")) == "friend"
    assert run(repo.list_bookmarks(42, "book-1"))[0].label == "Important"
    quote = run(repo.list_quotes(42, "book-1"))[0]
    assert quote.text == "A quote"
    assert quote.note == "A note"


def test_remove_book_cleans_user_state(tmp_path):
    repo = JsonUserBooksRepository(tmp_path / "user_books.json")
    run(repo.set_page(42, "book-1", 2))

    assert run(repo.remove_book(42, "book-1")) is True
    assert run(repo.remove_book(42, "book-1")) is False
    assert json.loads((tmp_path / "user_books.json").read_text(encoding="utf-8")) == {}


def test_corrupted_json_is_not_treated_as_empty_storage(tmp_path):
    path = tmp_path / "user_books.json"
    path.write_text("{broken json", encoding="utf-8")
    repo = JsonUserBooksRepository(path)

    with pytest.raises(JsonStorageError):
        run(repo.get_page(42, "book-1"))

    assert path.read_text(encoding="utf-8") == "{broken json"
