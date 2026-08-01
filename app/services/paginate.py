from __future__ import annotations
from typing import List
from app.utils.telegram import safe_cb_answer

def chunk_text(text: str, page_len: int = 800) -> List[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    parts = []
    cur = []
    cur_len = 0
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        if cur_len + len(para) + 2 > page_len and cur:
            parts.append("\n\n".join(cur))
            cur = [para]
            cur_len = len(para)
        else:
            cur.append(para)
            cur_len += len(para) + 2
    if cur:
        parts.append("\n\n".join(cur))
    return parts or [text]
