from __future__ import annotations
import requests
from typing import List, Dict, Any, Optional
from app.utils.telegram import safe_cb_answer

def search(query: str, lang: str = "ru", limit: int = 5) -> List[Dict[str, Any]]:
    base = f"https://{lang}.wikisource.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "format": "json"
    }
    r = requests.get(base, params=params, timeout=30)
    r.raise_for_status()
    js = r.json()
    results = js.get("query", {}).get("search", [])
    # map to common structure
    out = []
    for it in results:
        out.append({
            "pageid": it.get("pageid"),
            "title": it.get("title"),
            "lang": lang,
        })
    return out

def get_page_text(pageid: int, lang: str = "ru") -> Optional[str]:
    base = f"https://{lang}.wikisource.org/w/api.php"
    params = {
        "action": "query",
        "prop": "extracts",
        "pageids": pageid,
        "explaintext": 1,
        "format": "json"
    }
    r = requests.get(base, params=params, timeout=30)
    r.raise_for_status()
    js = r.json()
    pages = js.get("query", {}).get("pages", {})
    page = next(iter(pages.values()), None)
    if not page: return None
    return page.get("extract")
