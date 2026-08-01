"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PanelRightOpen } from "lucide-react";

import type { ReaderBook } from "@/lib/reader-data";
import type { FontSize, ReaderTheme } from "./reader-toolbar";
import { ReaderToolbar } from "./reader-toolbar";
import { AiPanel } from "./ai-panel";
import { TextSelectionMenu } from "./text-selection-menu";
import type { ReaderAction } from "./text-selection-menu";
import { Drawer, DrawerPopup } from "@/components/ui/drawer";

const fontSizeMap: Record<FontSize, string> = {
  small: "text-[15px] leading-[1.6]",
  medium: "text-[17px] leading-[1.7]",
  large: "text-[20px] leading-[1.8]",
};

export function ReaderView({ book }: { book: ReaderBook }) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>("dark");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const chapter = book.chapters[currentChapterIndex];
  const totalChapters = book.chapters.length;

  const handleAction = (action: ReaderAction, text: string) => {
    const truncated = text.length > 60 ? text.slice(0, 60) + "..." : text;
    const actionLabels: Record<ReaderAction, string> = {
      explain: "Объяснить",
      quote: "В цитаты",
      note: "Заметка",
      speak: "Озвучить",
    };
    toast.success(`${actionLabels[action]}: «${truncated}»`);
  };

  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-3.5rem)] flex-col transition-colors duration-300",
        readerTheme === "dark" && "bg-[#090713] text-[#f1f5f9]",
        readerTheme === "sepia" && "bg-[#f5e6c8] text-[#5b4636]"
      )}
    >
      <ReaderToolbar
        fontSize={fontSize}
        readerTheme={readerTheme}
        onFontSizeChange={setFontSize}
        onReaderThemeChange={setReaderTheme}
        currentChapter={chapter.title}
        bookTitle={book.title}
      />

      <div className="flex flex-1">
        <div
          className={cn("flex-1 overflow-y-auto px-4 py-6", "lg:px-8 lg:py-8")}
        >
          <article
            className={cn("mx-auto max-w-prose", fontSizeMap[fontSize])}
            style={{
              maxWidth: readerTheme === "dark" ? "65ch" : "68ch",
            }}
          >
            <header className="mb-8">
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  readerTheme === "sepia" && "text-[#3e2e1a]"
                )}
              >
                {chapter.title}
              </h1>
              <p
                className={cn(
                  "mt-2 text-sm",
                  readerTheme === "dark" && "text-white/50",
                  readerTheme === "sepia" && "text-[#7a6a4e]"
                )}
              >
                {book.author}
              </p>
            </header>

            <div
              className={cn(
                "space-y-5",
                readerTheme === "sepia"
                  ? "[&>p]:text-[#5b4636]"
                  : "[&>p]:text-[#e2e8f0]"
              )}
              style={{ userSelect: "text" }}
            >
              {chapter.content.split("\n\n").map((paragraph, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-justify",
                    readerTheme === "sepia" && "text-[#5b4636]"
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <nav className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
              <button
                onClick={() =>
                  setCurrentChapterIndex((i) => Math.max(0, i - 1))
                }
                disabled={currentChapterIndex === 0}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  readerTheme === "dark" &&
                    "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30",
                  readerTheme === "sepia" &&
                    "bg-[#d4c4a8] text-[#5b4636] hover:bg-[#c4b498] disabled:opacity-30"
                )}
              >
                ← Предыдущая
              </button>
              <span
                className={cn(
                  "text-xs",
                  readerTheme === "dark" && "text-white/30",
                  readerTheme === "sepia" && "text-[#7a6a4e]"
                )}
              >
                {currentChapterIndex + 1} / {totalChapters}
              </span>
              <button
                onClick={() =>
                  setCurrentChapterIndex((i) =>
                    Math.min(totalChapters - 1, i + 1)
                  )
                }
                disabled={currentChapterIndex === totalChapters - 1}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  readerTheme === "dark" &&
                    "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30",
                  readerTheme === "sepia" &&
                    "bg-[#d4c4a8] text-[#5b4636] hover:bg-[#c4b498] disabled:opacity-30"
                )}
              >
                Следующая →
              </button>
            </nav>
          </article>
        </div>

        <aside
          className={cn(
            "hidden w-80 shrink-0 border-l border-white/10 p-5",
            "lg:block"
          )}
        >
          <AiPanel book={book} readerTheme={readerTheme} />
        </aside>
      </div>

      <div className="lg:hidden">
        <Drawer open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
          <button
            onClick={() => setAiPanelOpen(true)}
            className={cn(
              "fixed bottom-6 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all",
              readerTheme === "dark" &&
                "bg-purple-600 text-white hover:bg-purple-500",
              readerTheme === "sepia" &&
                "bg-[#8b7355] text-[#f5e6c8] hover:bg-[#7a6348]"
            )}
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
          <DrawerPopup
            className={cn(
              readerTheme === "dark" && "bg-[#0d0a1a]",
              readerTheme === "sepia" && "bg-[#e8d5b8]"
            )}
          >
            <AiPanel book={book} readerTheme={readerTheme} />
          </DrawerPopup>
        </Drawer>
      </div>

      <TextSelectionMenu onAction={handleAction} />
    </div>
  );
}
