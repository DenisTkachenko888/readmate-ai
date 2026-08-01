"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PanelRightOpen, ChevronLeft, ChevronRight } from "lucide-react";

import { useReaderBook } from "@/lib/use-reader-book";
import { addBookmark } from "@/lib/backend-client";

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

export function ReaderView({ bookId, initialPage = 0 }: { bookId: string; initialPage?: number }) {
  const book = useReaderBook(bookId, initialPage);
  
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>("dark");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // JS-Магнит: идеально выравнивает страницу по границе колонок
  const snapToPage = useCallback(() => {
    if (contentRef.current) {
      const scrollAmount = contentRef.current.clientWidth + 32; // ширина + gap
      const currentScroll = contentRef.current.scrollLeft;
      const currentPage = Math.round(currentScroll / scrollAmount);
      const targetScroll = currentPage * scrollAmount;

      // Скроллим только если отклонение больше 2px (защита от бесконечного цикла)
      if (Math.abs(currentScroll - targetScroll) > 2) {
        contentRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    }
  }, []);

  // Слушаем скролл (тачпад/свайпы) и центрируем страницу после остановки
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      // Через 150мс после остановки скролла примагничиваем страницу
      scrollTimeout = setTimeout(() => {
        snapToPage();
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", snapToPage);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", snapToPage);
      clearTimeout(scrollTimeout);
    };
  }, [snapToPage]);

  // Выравнивание при смене шрифта (чтобы не застрять между страницами)
  useEffect(() => {
    const timer = setTimeout(snapToPage, 100);
    return () => clearTimeout(timer);
  }, [fontSize, snapToPage]);

  const handleBookmark = async () => {
    if (!book.isLive) {
      toast.success("Закладка сохранена (демо-режим)");
      return;
    }
    try {
      await addBookmark(bookId, book.pageNumber, `Глава ${book.pageNumber + 1}`);
      toast.success("Закладка успешно сохранена");
    } catch {
      toast.error("Не удалось сохранить закладку");
    }
  };

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

  // Перелистывание кнопками
  const scrollPrevPage = () => {
    if (contentRef.current) {
      const scrollAmount = contentRef.current.clientWidth + 32;
      const currentPage = Math.round(contentRef.current.scrollLeft / scrollAmount);
      contentRef.current.scrollTo({ left: (currentPage - 1) * scrollAmount, behavior: "smooth" });
    }
  };

  const scrollNextPage = () => {
    if (contentRef.current) {
      const scrollAmount = contentRef.current.clientWidth + 32;
      const currentPage = Math.round(contentRef.current.scrollLeft / scrollAmount);
      contentRef.current.scrollTo({ left: (currentPage + 1) * scrollAmount, behavior: "smooth" });
    }
  };

  if (book.error) {
    return (
      <div className="flex h-[calc(100dvh-65px)] items-center justify-center p-8 text-red-500 text-center bg-[#090713]">
        {book.error}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-[calc(100dvh-65px)] flex-col overflow-hidden transition-colors duration-300",
        readerTheme === "dark" && "bg-[#090713] text-[#f1f5f9]",
        readerTheme === "sepia" && "bg-[#f5e6c8] text-[#5b4636]"
      )}
    >
      <div className="shrink-0 z-10 relative">
        <ReaderToolbar
          fontSize={fontSize}
          readerTheme={readerTheme}
          onFontSizeChange={setFontSize}
          onReaderThemeChange={setReaderTheme}
          currentChapter={book.heading}
          bookTitle={book.bookTitle}
          onBookmark={handleBookmark}
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden relative">
          
          <div className="relative flex-1 min-h-0 group flex justify-center px-4 lg:px-12">
            
            <button
              onClick={scrollPrevPage}
              className={cn(
                "hidden lg:flex absolute left-0 top-0 bottom-0 w-16 z-10 items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
                readerTheme === "dark" ? "hover:bg-white/5 text-white/50 hover:text-white" : "hover:bg-black/5 text-black/30 hover:text-black"
              )}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            {/* Контейнер без CSS-снэппинга (всё контролирует наш JS-магнит) */}
            <div
              ref={contentRef}
              className="w-full max-w-[720px] h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <article
                className={cn("h-full py-8", fontSizeMap[fontSize])}
                style={{
                  columnWidth: "720px", // Браузер сам сузит её на смартфонах
                  columnGap: "32px",
                  height: "100%",
                  wordBreak: "break-word",
                }}
              >
                <header className="mb-8 break-inside-avoid">
                  <h1
                    className={cn(
                      "text-2xl font-bold tracking-tight",
                      readerTheme === "sepia" && "text-[#3e2e1a]"
                    )}
                  >
                    {book.heading}
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

                {book.loading ? (
                  <div className="space-y-4 pt-4 opacity-50 animate-pulse">
                    <div className={cn("h-4 w-full rounded", readerTheme === "dark" ? "bg-white/10" : "bg-black/10")} />
                    <div className={cn("h-4 w-[95%] rounded", readerTheme === "dark" ? "bg-white/10" : "bg-black/10")} />
                    <div className={cn("h-4 w-[90%] rounded", readerTheme === "dark" ? "bg-white/10" : "bg-black/10")} />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "space-y-5",
                      readerTheme === "sepia"
                        ? "[&>p]:text-[#5b4636]"
                        : "[&>p]:text-[#e2e8f0]"
                    )}
                    style={{ userSelect: "text" }}
                  >
                    {book.text.split("\n\n").map((paragraph, i) => (
                      <p
                        key={i}
                        className={cn(
                          "text-justify leading-relaxed",
                          readerTheme === "sepia" && "text-[#5b4636]"
                        )}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <button
              onClick={scrollNextPage}
              className={cn(
                "hidden lg:flex absolute right-0 top-0 bottom-0 w-16 z-10 items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
                readerTheme === "dark" ? "hover:bg-white/5 text-white/50 hover:text-white" : "hover:bg-black/5 text-black/30 hover:text-black"
              )}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          <div className={cn(
            "shrink-0 border-t px-4 py-3 border-white/10 bg-[#090713]/80 backdrop-blur-md z-10",
            readerTheme === "sepia" && "border-[#c4b498] bg-[#f5e6c8]/90"
          )}>
            <nav className="mx-auto max-w-[720px] flex items-center justify-between">
              <button
                onClick={book.goPrev}
                disabled={book.pageNumber === 0}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  readerTheme === "dark" &&
                    "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30",
                  readerTheme === "sepia" &&
                    "bg-[#d4c4a8] text-[#5b4636] hover:bg-[#c4b498] disabled:opacity-30"
                )}
              >
                ← Пред. глава
              </button>
              <span
                className={cn(
                  "text-xs font-medium tracking-wide uppercase",
                  readerTheme === "dark" && "text-white/40",
                  readerTheme === "sepia" && "text-[#7a6a4e]"
                )}
              >
                Глава {book.pageNumber + 1}
              </span>
              <button
                onClick={book.goNext}
                disabled={book.pageNumber >= book.totalPages - 1}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  readerTheme === "dark" &&
                    "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30",
                  readerTheme === "sepia" &&
                    "bg-[#d4c4a8] text-[#5b4636] hover:bg-[#c4b498] disabled:opacity-30"
                )}
              >
                След. глава →
              </button>
            </nav>
          </div>
        </div>

        <aside
          className={cn(
            "hidden w-80 shrink-0 border-l border-white/10 p-4 h-full min-h-0 overflow-hidden",
            "lg:block",
            readerTheme === "sepia" && "border-[#c4b498]"
          )}
        >
          <AiPanel 
            bookId={bookId} 
            page={book.pageNumber} 
            isLive={book.isLive} 
            bookTitle={book.bookTitle}
            contextTitle={book.contextTitle}
            contextIcon={book.contextIcon}
            contextItems={book.contextItems}
            readerTheme={readerTheme} 
          />
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
            <div className="h-[80dvh] flex flex-col overflow-hidden pb-4">
              <AiPanel 
                bookId={bookId} 
                page={book.pageNumber} 
                isLive={book.isLive} 
                bookTitle={book.bookTitle}
                contextTitle={book.contextTitle}
                contextIcon={book.contextIcon}
                contextItems={book.contextItems}
                readerTheme={readerTheme} 
              />
            </div>
          </DrawerPopup>
        </Drawer>
      </div>

      <TextSelectionMenu bookId={bookId} page={book.pageNumber} isLive={book.isLive} onAction={handleAction} />
    </div>
  );
}