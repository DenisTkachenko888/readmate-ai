import { getHeaders } from "@/lib/telegram";

/**
 * Единственное место на клиенте, которое знает про /api/backend/*.
 * Компоненты (AiPanel, ReaderView, домашняя страница) зовут только эти
 * функции — если однажды поменяется прокси/бэкенд, чинить нужно только тут.
 */

const BASE = "/api/backend";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...getHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new BackendError(body.detail ?? `Ошибка запроса (${res.status})`, res.status);
  }
  return res.json();
}

export class BackendError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// ------------------------------------------------------------- библиотека ---

export interface LibraryBookItem {
  id: string;
  title: string;
  author: string;
  progress: number;
  total_pages: number;
}

export function getLibrary() {
  return call<LibraryBookItem[]>(`/library`);
}

export interface BookPage {
  book_id: string;
  title: string;
  page_number: number;
  total_pages: number;
  text: string;
}

export function getBookPage(bookId: string, pageNum: number) {
  return call<BookPage>(`/books/${bookId}/page/${pageNum}`);
}

export function getPageAudioParts(bookId: string, pageNum: number) {
  return call<{ parts: string[] }>(`/books/${bookId}/page/${pageNum}/audio`);
}

// --------------------------------------------------------------- закладки ---

export interface BookmarkItem {
  page: number;
  label: string;
}

export function listBookmarks(bookId: string) {
  return call<BookmarkItem[]>(`/bookmarks?book_id=${encodeURIComponent(bookId)}`);
}

export function addBookmark(bookId: string, page: number, label: string) {
  return call<{ ok: true }>(`/bookmarks`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId, page, label }),
  });
}

// ------------------------------------------------------------------ цитаты ---

export interface QuoteItem {
  page: number;
  text: string;
  note: string | null;
}

export function listQuotes(bookId: string) {
  return call<QuoteItem[]>(`/quotes?book_id=${encodeURIComponent(bookId)}`);
}

export function addQuote(bookId: string, page: number, text: string, note?: string) {
  return call<{ ok: true }>(`/quotes`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId, page, text, note }),
  });
}

// --------------------------------------------------------------- наставник ---

export type MentorRole = "teacher" | "friend" | "philosopher" | "psychologist";

export function getPersona(bookId: string) {
  return call<{ persona: MentorRole }>(`/ai/persona?book_id=${encodeURIComponent(bookId)}`);
}

export function setPersona(bookId: string, persona: MentorRole) {
  return call<{ ok: true }>(`/ai/persona`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId, persona }),
  });
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function aiChat(bookId: string, page: number, persona: MentorRole, question: string, history: ChatTurn[]) {
  return call<{ answer: string }>(`/ai/chat`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId, page, persona, question, history }),
  });
}

export type QuickActionId = "retell" | "explain" | "main-ideas" | "quiz" | "terms" | "flashcards";

export interface QuizQuestion {
  question: string;
  answer: string;
  explanation: string;
}
export interface Flashcard {
  front: string;
  back: string;
}
export interface ActionResult {
  kind: "text" | "quiz" | "flashcards";
  text?: string;
  questions?: QuizQuestion[];
  cards?: Flashcard[];
}

export function aiAction(bookId: string, page: number, action: QuickActionId) {
  return call<ActionResult>(`/ai/action`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId, page, action }),
  });
}

export function aiWhoIs(bookId: string, page: number, query: string) {
  return call<{ answer: string }>(`/ai/whois`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId, page, query }),
  });
}

export function aiExplainSelection(passage: string, mode: "simple" | "example" | "context" = "simple") {
  return call<{ text: string }>(`/ai/explain`, {
    method: "POST",
    body: JSON.stringify({ passage, mode }),
  });
}

export function aiQuizCheck(
  persona: MentorRole,
  question: string,
  answer: string,
  explanation: string,
  userAnswer: string
) {
  return call<{ verdict: string }>(`/ai/quiz/check`, {
    method: "POST",
    body: JSON.stringify({ persona, question, answer, explanation, user_answer: userAnswer }),
  });
}