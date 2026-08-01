"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, MessageSquareText, ScrollText, Volume2 } from "lucide-react";

export type ReaderAction = "explain" | "quote" | "note" | "speak";

interface TextSelectionMenuProps {
  bookId: string;
  page: number;
  isLive: boolean;
  onAction: (action: ReaderAction, text: string) => void;
}

const actions: {
  id: ReaderAction;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "explain", label: "Объяснить", icon: MessageSquareText },
  { id: "quote", label: "В цитаты", icon: ScrollText },
  { id: "note", label: "Заметка", icon: BookOpen },
  { id: "speak", label: "Озвучить", icon: Volume2 },
];

export function TextSelectionMenu({ bookId, page, isLive, onAction }: TextSelectionMenuProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!text || text.length === 0) {
      hideTimerRef.current = setTimeout(() => setVisible(false), 200);
      return;
    }

    const range = selection?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    const menuWidth = 280;

    const x = Math.max(
      8,
      Math.min(
        rect.left + rect.width / 2 - menuWidth / 2,
        window.innerWidth - menuWidth - 8
      )
    );
    const y = rect.top - 8;

    setPosition({ x, y });
    setSelectedText(text);
    setVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleScroll = () => setVisible(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[100] flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0d0a1a]/95 px-2 py-1.5 shadow-2xl backdrop-blur-xl",
        "animate-in fade-in slide-in-from-bottom-2 duration-200"
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => {
            onAction(action.id, selectedText);
            setVisible(false);
          }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-purple-500/20 hover:text-purple-300 active:bg-purple-500/30"
        >
          <action.icon className="h-3.5 w-3.5" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}