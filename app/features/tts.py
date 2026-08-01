from __future__ import annotations

import asyncio
import hashlib
import re
from pathlib import Path
from typing import List, Optional

import aiohttp

from app.config import get_settings


def _detect_lang(text: str) -> str:
    cyr = sum("а" <= ch.lower() <= "я" or ch.lower() == "ё" for ch in text)
    lat = sum("a" <= ch.lower() <= "z" for ch in text)
    return "ru" if cyr > lat else "en"


def _pick_voice(lang: Optional[str]) -> str:
    s = get_settings()
    lang = (lang or "").lower().strip()
    if not lang:
        return s.edge_voice_default
    if lang.startswith("ru"):
        return s.edge_voice_ru
    if lang.startswith("en"):
        return s.edge_voice_en
    return s.edge_voice_default


def _split_for_tts(text: str, max_chars: int) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []

    if len(text) <= max_chars:
        return [text]

    parts = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: List[str] = []
    buf = ""

    def flush():
        nonlocal buf
        if buf.strip():
            chunks.append(buf.strip())
        buf = ""

    for p in parts:
        if len(p) > max_chars:
            sentences = re.split(r"(?<=[.!?…])\s+", p)
            for s in sentences:
                if not s:
                    continue
                if len(buf) + len(s) + 1 <= max_chars:
                    buf = f"{buf} {s}".strip()
                else:
                    flush()
                    buf = s.strip()
        else:
            if len(buf) + len(p) + 2 <= max_chars:
                buf = (buf + "\n\n" + p).strip() if buf else p
            else:
                flush()
                buf = p
    flush()

    return chunks


async def synthesize_parts(
    text: str,
    out_dir: Path,
    basename: str,
    lang: Optional[str] = None,
    max_parts: int = 6,
    max_total_chars: int = 6000,
) -> List[Path]:
    s = get_settings()
    out_dir.mkdir(parents=True, exist_ok=True)

    if s.tts_backend.lower() != "edge":
        return []

    text = (text or "").strip()
    if not text:
        return []

    # общий лимит текста на запрос
    if max_total_chars and len(text) > max_total_chars:
        text = text[:max_total_chars].rstrip()

    if not lang:
        lang = _detect_lang(text)

    voice = _pick_voice(lang)

    try:
        import edge_tts
    except Exception:
        return []

    chunks = _split_for_tts(text, max_chars=s.tts_max_chars)
    if not chunks:
        return []

    # лимит частей mp3
    if max_parts and len(chunks) > max_parts:
        chunks = chunks[:max_parts]

    files: List[Path] = []
    voice_tag = re.sub(r"[^a-zA-Z0-9_-]+", "_", voice)

    # ретраи
    max_attempts = 3
    base_delay = 0.7  # 0.7s, 1.4s, 2.8s

    for i, chunk in enumerate(chunks, start=1):
        h = hashlib.sha1((voice + "\n" + chunk).encode("utf-8")).hexdigest()[:12]
        file = out_dir / f"{basename}_{voice_tag}_{i:02d}_{h}.mp3"
        if file.exists():
            files.append(file)
            continue

        last_exc: Exception | None = None
        for attempt in range(1, max_attempts + 1):
            try:
                communicate = edge_tts.Communicate(text=chunk, voice=voice)
                await communicate.save(str(file))
                files.append(file)
                last_exc = None
                break
            except (aiohttp.ClientError, OSError, TimeoutError) as e:
                last_exc = e
                await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

        # если конкретный чанк не смогли — НЕ падаем, просто прекращаем дальнейшие чанки
        if last_exc is not None:
            break

    return files
