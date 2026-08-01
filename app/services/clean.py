from __future__ import annotations
import re
from html import unescape

# ---- Gutenberg .txt ---------------------------------------------------------

_RE_START = re.compile(r"^\s*\*{3}\s*START OF.*?$", re.I | re.M)
_RE_END   = re.compile(r"^\s*\*{3}\s*END OF.*?$",   re.I | re.M)
_ILLUSTRATION_LINE = re.compile(r"^\s*\[(illustration|image|фото|рисунок)[^\]]*\]\s*$", re.I | re.M)

def clean_gutenberg_text(text: str) -> str:
    """
    Чистит plain-text Gutenberg от лицензии/служебных блоков и мусора.
    """
    t = text.replace("\r\n", "\n").replace("\r", "\n")

    # вырезать лицензионные блоки
    start = _RE_START.search(t)
    end   = _RE_END.search(t)
    if start and end and start.start() < end.start():
        t = t[start.end():end.start()]
    else:
        # fallback — убираем явные упоминания license
        t = re.sub(r"project gutenberg.*?license.*", "", t, flags=re.I | re.S)

    # page breaks / хвостовые пробелы / лишние пустые строки
    t = re.sub(r"\f", "\n", t)
    t = re.sub(r"[ \t]+$", "", t, flags=re.M)
    t = re.sub(r"\n{3,}", "\n\n", t)
    t = re.sub(r"[ \t]{2,}", " ", t)
    t = _strip_illustrations(t)

    return t.strip()

# ---- HTML -> текст (на всякий случай) --------------------------------------

def html_to_text_generic(html: str) -> str:
    """
    Простой, быстрый очиститель HTML, без внешних зависимостей.
    Убираем <head>/<style>/<script>, теги, сжимаем пустые строки.
    """
    # вырезать head/style/script
    html = re.sub(r"(?is)<(head|style|script)\b.*?</\1>", "", html)
    # убрать все теги
    txt = re.sub(r"(?s)<[^>]+>", "", html)
    # html entities
    txt = unescape(txt)
    # унификация переводов строк
    txt = txt.replace("\r\n", "\n").replace("\r", "\n")
    # сжать пустые строки и пробелы
    txt = re.sub(r"[ \t]+$", "", txt, flags=re.M)
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    txt = re.sub(r"[ \t]{2,}", " ", txt)
    return txt.strip()

# ---- Общая нормализация для любого plain text ------------------------------

def normalize_plain_text(text: str) -> str:
    """
    Мини-«полировка» для уже текстовых источников (Wikisource plaintext, и т.п.).
    """
    t = text.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"[ \t]+$", "", t, flags=re.M)
    t = re.sub(r"\n{3,}", "\n\n", t)
    t = re.sub(r"[ \t]{2,}", " ", t)
    t = _strip_illustrations(t)

    return t.strip()

def _strip_illustrations(t: str) -> str:
    return _ILLUSTRATION_LINE.sub("", t)
