"use client";

import { useCallback, useEffect, useState } from "react";
import { getReaderBook } from "@/lib/reader-data";
import { getBookPage, BackendError } from "@/lib/backend-client";

/**
 * Одна точка входа для ReaderView, которая работает одинаково для:
 *  - 3 демо-книг из lib/reader-data.ts (мгновенно, без сети — подстраховка
 *    для питча/демо, если бэкенд вдруг недоступен в моменте показа);
 *  - любой реальной книги из app/books/*.json на бэкенде (id вида "g_1661"),
 *    подгружаемой постранично через /api/backend/books/{id}/page/{n}.
 *
 * Реальная страница запрашивается по одной — так же, как в Telegram-боте —
 * и каждый запрос попутно сохраняет прогресс на бэкенде (см. app/api/routes.py
 * get_book_page). Отдельного вызова "сохранить прогресс" поэтому не нужно.
 */
export interface ReaderBookState {
  isLive: boolean;
  loading: boolean;
  error: string | null;
  bookTitle: string;
  author: string;
  heading: string; // заголовок главы (демо) или "Страница N из M" (реальная книга)
  text: string;
  pageNumber: number; // 0-based
  totalPages: number;
  contextTitle?: string;
  contextIcon?: string;
  contextItems?: { title: string; description: string }[];
  goNext: () => void;
  goPrev: () => void;
}

export function useReaderBook(bookId: string, initialPage: number = 0): ReaderBookState {
  const mock = getReaderBook(bookId);
  const isLive = !mock;

  const [pageNumber, setPageNumber] = useState(Math.max(0, initialPage));
  const [loading, setLoading] = useState(isLive);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<{ title: string; text: string; totalPages: number } | null>(null);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    setLoading(true);
    getBookPage(bookId, pageNumber)
      .then((res) => {
        if (cancelled) return;
        setLive({ title: res.title, text: res.text, totalPages: res.total_pages });
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof BackendError ? e.message : "Не удалось загрузить страницу");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, pageNumber, isLive]);

  const totalPages = isLive ? live?.totalPages ?? 0 : mock!.chapters.length;

  const goNext = useCallback(() => {
    setPageNumber((p) => Math.min(Math.max(totalPages - 1, 0), p + 1));
  }, [totalPages]);
  const goPrev = useCallback(() => setPageNumber((p) => Math.max(0, p - 1)), []);

  if (!isLive && mock) {
    const chapter = mock.chapters[pageNumber];
    return {
      isLive: false,
      loading: false,
      error: null,
      bookTitle: mock.title,
      author: mock.author,
      heading: chapter.title,
      text: chapter.content,
      pageNumber,
      totalPages,
      contextTitle: mock.contextTitle,
      contextIcon: mock.contextIcon,
      contextItems: mock.contextItems,
      goNext,
      goPrev,
    };
  }

  return {
    isLive: true,
    loading,
    error,
    bookTitle: live?.title ?? "Загрузка…",
    author: "",
    heading: totalPages ? `Страница ${pageNumber + 1} из ${totalPages}` : "Загрузка…",
    text: live?.text ?? "",
    pageNumber,
    totalPages,
    goNext,
    goPrev,
  };
}