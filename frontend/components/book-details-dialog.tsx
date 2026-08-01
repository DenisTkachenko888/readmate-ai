"use client";

import { useRef, useEffect, useState } from "react";
import {
  BookOpen,
  Headphones,
  MessageCircle,
  BookMarked,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useAudioPlayer } from "@/lib/audio-player-context";
import type { Book } from "@/lib/data";

function ActionButton({
  icon: Icon,
  label,
  onClick,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
}: {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { play } = useAudioPlayer();
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (open) {
      const showTimer = setTimeout(() => setIsLoading(true), 0);
      timerRef.current = setTimeout(() => setIsLoading(false), 500);
      return () => {
        clearTimeout(showTimer);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [open]);

  if (!book) return null;

  const handleRead = () => {
    onOpenChange(false);
    router.push(`/reader?book=${book.id}`);
  };

  const handleListen = () => {
    if (book.chapters.length > 0) {
      play({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        coverColor: book.coverColor,
        chapterTitle: book.chapters[0].title,
        chapterIndex: 0,
        totalChapters: book.chapters.length,
      });
    }
    onOpenChange(false);
  };

  const handleDiscuss = () => {
    toast.success(`Открываем чат с наставником по «${book.title}»`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">
          {book.title} — {book.author}
        </DialogTitle>

        {isLoading ? (
          <BookDetailsSkeleton />
        ) : (
          <BookDetailsContent
            book={book}
            handleRead={handleRead}
            handleListen={handleListen}
            handleDiscuss={handleDiscuss}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BookDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-28 w-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-1.5 flex-1 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function BookDetailsContent({
  book,
  handleRead,
  handleListen,
  handleDiscuss,
}: {
  book: Book;
  handleRead: () => void;
  handleListen: () => void;
  handleDiscuss: () => void;
}) {
  return (
    <>
      <div className="flex gap-4">
        <div
          className={`flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${book.coverColor} shadow-lg ring-1 ring-white/10`}
        >
          <BookOpen className="h-8 w-8 text-white/60" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="text-lg font-bold text-white leading-tight">
            {book.title}
          </h2>
          <p className="mt-0.5 text-sm text-purple-400">{book.author}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                style={{ width: `${book.progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-white/50">
              {book.progress}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
        <p className="text-sm leading-relaxed text-white/65">
          {book.description}
        </p>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5">
          <BookMarked className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white/80">Оглавление</h3>
        </div>
        <div className="space-y-1">
          {book.chapters.map((chapter, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
            >
              <span className="truncate text-sm text-white/60">
                {chapter.title}
              </span>
              <span className="ml-2 shrink-0 text-xs text-white/30">
                {chapter.pages} с.
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <ActionButton
          icon={BookOpen}
          label="Читать"
          onClick={handleRead}
          className="bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700"
        />
        <div className="flex gap-2">
          <ActionButton
            icon={Headphones}
            label="Слушать"
            onClick={handleListen}
            className="flex-1 border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
          />
          <ActionButton
            icon={MessageCircle}
            label="Обсудить с наставником"
            onClick={handleDiscuss}
            className="flex-1 border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-white/30">
        {book.progress === 100 ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            Прочитана
          </span>
        ) : book.progress > 0 ? (
          `Продолжить с ${book.chapters[Math.min(Math.floor(book.progress / 20), book.chapters.length - 1)]?.title ?? "начала"}`
        ) : (
          "Ещё не начата"
        )}
      </p>
    </>
  );
}
