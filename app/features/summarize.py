from __future__ import annotations
import re, math
import nltk
import networkx as nx
from nltk.tokenize import sent_tokenize, word_tokenize

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

def summarize(text: str, max_sentences: int = 3, lang: str = "russian") -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return "Нет текста для пересказа."
    try:
        sents = [s for s in sent_tokenize(text, language=lang) if len(s.split()) > 3]
    except Exception:
        sents = [s for s in sent_tokenize(text) if len(s.split()) > 3]
    if len(sents) <= max_sentences:
        return " ".join(sents)

    words = [word_tokenize(s.lower()) for s in sents]
    def overlap(a, b):
        sa, sb = set(a), set(b)
        inter = len(sa & sb)
        denom = math.log(1+len(sa)) + math.log(1+len(sb))
        return inter / denom if denom else 0.0

    g = nx.Graph(); g.add_nodes_from(range(len(sents)))
    for i in range(len(sents)):
        for j in range(i+1, len(sents)):
            w = overlap(words[i], words[j])
            if w > 0: g.add_edge(i, j, weight=w)
    scores = nx.pagerank(g, weight="weight")
    top = sorted(range(len(sents)), key=lambda i: scores.get(i,0), reverse=True)[:max_sentences]
    top.sort()
    return " ".join(sents[i] for i in top)
