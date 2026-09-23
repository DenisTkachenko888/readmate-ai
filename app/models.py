from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class Bookmark(BaseModel):
    page: int
    label: str


class Quote(BaseModel):
    page: int
    text: str
    note: str | None = None


class UserBookState(BaseModel):
    page: int = 0
    bookmarks: List[Bookmark] = Field(default_factory=list)
    quotes: List[Quote] = Field(default_factory=list)
    persona_style: str = "teacher"  # teacher | friend | philosopher | psychologist


class UserBooks(BaseModel):
    data: Dict[str, Dict[str, UserBookState]] = Field(default_factory=dict)
