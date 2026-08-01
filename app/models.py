from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Dict, List
from app.utils.telegram import safe_cb_answer

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

class UserBooks(BaseModel):
    data: Dict[str, Dict[str, UserBookState]] = {}
