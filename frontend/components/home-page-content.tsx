"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  Lightbulb,
  BookOpen,
  Library,
  TrendingUp,
  ArrowRight,
  BookHeart,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { books, recentlyReadIds, aiInsights, categories } from "@/lib/data";
import { BookDetailsDialog } from "@/components/book-details-dialog";
import { EmptyState } from "@/components/empty-state";
import { HomePageSkeleton } from "@/components/home-page-skeleton";

function BookCard({
  book,
  onClick,
}: {
  book: (typeof books)[number];
  onClick: () => void;
}) {
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div
        className={`relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br ${book.coverColor} shadow-lg shadow-black/20 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/80 transition-all"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-white/70">
            {book.progress}%
          </span>
        </div>
      </div>
      <h3 className="truncate text-sm font-semibold text-white">
        {book.title}
      </h3>
      <p className="truncate text-xs text-white/50">{book.author}</p>
    </div>
  );
}

function InsightCard({ insight }: { insight: (typeof aiInsights)[number] }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 backdrop-blur-xl transition-colors hover:border-purple-500/25">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
        <Lightbulb className="h-4 w-4 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-white/80">{insight.text}</p>
        <p className="mt-1.5 text-xs text-purple-400/60">{insight.bookTitle}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  actionLabel,
}: {
  icon: React.ElementType;
  title: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {actionLabel && (
        <button className="flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function HomePageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<
    (typeof books)[number] | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const openBookDialog = useCallback((book: (typeof books)[number]) => {
    setSelectedBook(book);
    setDialogOpen(true);
  }, []);

  const filteredBooks = useMemo(() => {
    let result = books;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q)
      );
    }

    if (activeCategory) {
      result = result.filter((book) => book.category === activeCategory);
    }

    return result;
  }, [searchQuery, activeCategory]);

  const recentBooks = useMemo(() => {
    let result = recentlyReadIds
      .map((id) => books.find((b) => b.id === id)!)
      .filter(Boolean);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery]);

  if (isLoading) return <HomePageSkeleton />;

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-8 pb-24">
      {/* Greeting */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Продолжим чтение? 👋
        </h1>
        <p className="mt-1.5 text-sm text-white/50">
          Ваша персональная AI-библиотека
        </p>
      </div>

      {/* Search */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск книг и авторов..."
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-white/30 focus-visible:ring-purple-500/50"
          />
        </div>
      </div>

      {/* AI Insights */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <SectionHeader icon={Lightbulb} title="AI-инсайты" />
        <div className="space-y-3">
          {aiInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Recently Read */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <SectionHeader
          icon={TrendingUp}
          title="Недавно читали"
          actionLabel={recentBooks.length > 0 ? "Все" : undefined}
        />
        {recentBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-5 gap-3">
              {recentBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => openBookDialog(book)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={BookHeart}
            title="Вы ещё не читали книги"
            description="Начните с библиотеки — выберите книгу и погрузитесь в чтение"
          />
        )}

        <BookDetailsDialog
          book={selectedBook}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>

      {/* Library */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <SectionHeader
          icon={Library}
          title="Библиотека"
          actionLabel={searchQuery || activeCategory ? "Сбросить" : undefined}
        />

        {!searchQuery && (
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
              >
                <Badge
                  variant={activeCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-xs transition-all ${
                    activeCategory === cat
                      ? "border-purple-500/30 bg-purple-500/20 text-purple-300"
                      : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  {cat}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => openBookDialog(book)}
              />
            ))}
          </div>
        ) : (
          <GlassCard className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
              <BookOpen className="h-6 w-6 text-white/30" />
            </div>
            <p className="text-sm text-white/50">
              {searchQuery
                ? "Ничего не найдено. Попробуйте изменить запрос."
                : "В этой категории пока нет книг."}
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
