"use client";

import { AArrowDown, AArrowUp, Moon, Sun, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export type FontSize = "small" | "medium" | "large";
export type ReaderTheme = "dark" | "sepia";

interface ReaderToolbarProps {
  fontSize: FontSize;
  readerTheme: ReaderTheme;
  onFontSizeChange: (size: FontSize) => void;
  onReaderThemeChange: (theme: ReaderTheme) => void;
  currentChapter: string;
  bookTitle: string;
  onBookmark?: () => void; // <-- Добавили пропс для закладки
}

const fontSizes: { key: FontSize; label: string }[] = [
  { key: "small", label: "Мелкий" },
  { key: "medium", label: "Средний" },
  { key: "large", label: "Крупный" },
];

const themes: { key: ReaderTheme; label: string; icon: React.ElementType }[] = [
  { key: "dark", label: "Тёмная", icon: Moon },
  { key: "sepia", label: "Сепия", icon: Sun },
];

export function ReaderToolbar({
  fontSize,
  readerTheme,
  onFontSizeChange,
  onReaderThemeChange,
  currentChapter,
  bookTitle,
  onBookmark,
}: ReaderToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#090713]/80 px-4 py-3 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white/50">
          {bookTitle}
        </p>
        <p className="truncate text-sm text-white/80">{currentChapter}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
          {fontSizes.map((s) => (
            <button
              key={s.key}
              onClick={() => onFontSizeChange(s.key)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                fontSize === s.key
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {s.key === "small" && <AArrowDown className="h-3 w-3" />}
              {s.key === "large" && <AArrowUp className="h-3 w-3" />}
              {s.key === "medium" && (
                <span className="text-xs font-bold">Aa</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => onReaderThemeChange(t.key)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                readerTheme === t.key
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <t.icon className="h-3 w-3" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Новая кнопка закладки в едином стиле */}
        {onBookmark && (
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
            <button
              onClick={onBookmark}
              title="Добавить закладку"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/40 transition-colors hover:text-white/70"
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}