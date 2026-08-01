from __future__ import annotations

import ssl
import httpx
from typing import List, Dict, Any, Optional

API = "https://gutendex.com/books/"

_TLS12 = ssl.create_default_context()
_TLS12.maximum_version = ssl.TLSVersion.TLSv1_2  # фикс WinError 10054/121 на некоторых сетях/Windows


async def search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    async with httpx.AsyncClient(
        http2=False,
        timeout=60.0,          
        follow_redirects=True,
        trust_env=True,       
        verify=_TLS12,
    ) as client:
        r = await client.get(API, params={"search": query})
        r.raise_for_status()   
        data = r.json()       
        
    return data.get("results", [])[:limit] 

def pick_text_url(formats: dict) -> Optional[str]:
    if not isinstance(formats, dict):
        return None

    for k, v in formats.items():
        if isinstance(v, str) and "text/plain" in k and "utf-8" in k.lower():
            return v

    for k, v in formats.items():
        if isinstance(v, str) and "text/plain" in k:
            return v

    for v in formats.values():
        if isinstance(v, str) and v.lower().endswith(".txt"):
            return v

    return None
