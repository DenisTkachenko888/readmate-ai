"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bot,
  Sparkles,
  GraduationCap,
  MessageCircle,
  Heart,
  Brain,
  Send,
  BookOpen,
  RotateCcw,
  FileText,
  Lightbulb,
  TestTube,
  Bookmark,
  Library,
  Users,
  Code,
  Globe,
  MessageSquare,
  MessageCircleOff,
} from "lucide-react";

import type { ReaderTheme } from "./reader-toolbar";

type MentorRole = "teacher" | "friend" | "psychologist" | "philosopher";

interface MentorOption {
  id: MentorRole;
  label: string;
  icon: typeof GraduationCap;
  color: string;
  description: string;
}

const mentors: MentorOption[] = [
  {
    id: "teacher",
    label: "Преподаватель",
    icon: GraduationCap,
    color: "text-blue-400",
    description: "Строгий и логичный",
  },
  {
    id: "friend",
    label: "Друг",
    icon: MessageCircle,
    color: "text-green-400",
    description: "Поддержит и обсудит",
  },
  {
    id: "psychologist",
    label: "Психолог",
    icon: Heart,
    color: "text-pink-400",
    description: "Разберет мотивы",
  },
  {
    id: "philosopher",
    label: "Философ",
    icon: Brain,
    color: "text-amber-400",
    description: "Зрит в корень",
  },
];

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const quickActions = [
  { id: "retell", label: "Пересказ", icon: RotateCcw },
  { id: "explain", label: "Объяснить", icon: FileText },
  { id: "main-ideas", label: "Главные мысли", icon: Lightbulb },
  { id: "quiz", label: "Проверка", icon: TestTube },
  { id: "terms", label: "Термины", icon: Bookmark },
  { id: "flashcards", label: "Flashcards", icon: Library },
];

const contextIcons: Record<string, typeof Users> = {
  users: Users,
  code: Code,
  globe: Globe,
};

export function AiPanel({
  bookId,
  page,
  isLive,
  bookTitle,
  contextTitle,
  contextIcon,
  contextItems,
  readerTheme = "dark",
}: {
  bookId: string;
  page: number;
  isLive: boolean;
  bookTitle: string;
  contextTitle?: string;
  contextIcon?: string;
  contextItems?: { title: string; description: string }[];
  readerTheme?: ReaderTheme;
}) {
  const [role, setRole] = useState<MentorRole>("teacher");
  const [tab, setTab] = useState<"chat" | "actions" | "context">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const welcomeAddedRef = useRef(false);

  useEffect(() => {
    if (!welcomeAddedRef.current) {
      welcomeAddedRef.current = true;
      const timer = setTimeout(() => {
        setMessages([
          {
            role: "assistant",
            text: `Привет! Я твой AI-наставник. Сейчас у меня роль: ${mentors.find((m) => m.id === role)?.label}. Чем могу помочь по книге «${bookTitle}»?`,
          },
        ]);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [role, bookTitle]);

  const text = readerTheme === "dark" ? "text-white" : "text-[#3e2e1a]";
  const textMuted = readerTheme === "dark" ? "text-white/50" : "text-[#7a6a4e]";
  const border =
    readerTheme === "dark" ? "border-white/10" : "border-[#c4b498]";
  const cardBg = readerTheme === "dark" ? "bg-white/[0.04]" : "bg-[#d4c4a8]/50";
  const inputBg =
    readerTheme === "dark" ? "bg-white/[0.06]" : "bg-[#d4c4a8]/70";
  const accent = readerTheme === "dark" ? "text-purple-400" : "text-[#7a6348]";
  const cardHover =
    readerTheme === "dark" ? "hover:bg-white/[0.08]" : "hover:bg-[#c4b498]/70";

  const ContextIcon = contextIcon
    ? contextIcons[contextIcon]
    : undefined;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const textStr = input.trim();
    if (!textStr || isAiThinking) return;

    setMessages((prev) => [...prev, { role: "user", text: textStr }]);
    setInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: getMockResponse(textStr, role, bookTitle),
        },
      ]);
      setIsAiThinking(false);
    }, 800);
  };

  const handleQuickAction = (id: string) => {
    const label = quickActions.find((a) => a.id === id)?.label || id;
    toast.success(`Действие: ${label}`);
    setTab("chat");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Действие: ${label} (книга: ${bookTitle}, страница: ${page + 1})` },
    ]);
    setIsAiThinking(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: getMockActionResponse(id, bookTitle),
        },
      ]);
      setIsAiThinking(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex h-full flex-col", text)}>
      {/* Header */}
      <div className={cn("mb-3 flex items-center gap-2 border-b pb-3", border)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
          <Bot className="h-4 w-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">AI-Наставник</h3>
          <p className={cn("text-xs", textMuted)}>Задай вопрос по тексту</p>
        </div>
      </div>

      {/* Role selector */}
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {mentors.map((m) => {
          const Icon = m.icon;
          const active = role === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setRole(m.id);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    text: `Роль изменена на: ${m.label}. Чем займёмся?`,
                  },
                ]);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                active ? cn(cardBg, m.color) : cn(textMuted, cardHover)
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab bar */}
      <div
        className={cn(
          "mb-3 flex gap-0 rounded-lg border p-0.5",
          border,
          cardBg
        )}
      >
        {[
          { id: "chat" as const, label: "Чат", icon: MessageSquare },
          { id: "actions" as const, label: "Действия", icon: Sparkles },
          { id: "context" as const, label: "Контекст", icon: BookOpen },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                active
                  ? cn(
                      readerTheme === "dark"
                        ? "bg-purple-600/30 text-purple-300"
                        : "bg-[#8b7355]/40 text-[#3e2e1a]"
                    )
                  : textMuted
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {tab === "chat" && (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <EmptyChatState readerTheme={readerTheme} />
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user" ? "bg-purple-500/20" : cardBg
                      )}
                    >
                      {msg.role === "user" ? (
                        <MessageCircle className="h-3.5 w-3.5 text-purple-400" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-purple-400" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? cn(
                              "bg-purple-600/20",
                              readerTheme === "dark"
                                ? "text-purple-200"
                                : "text-[#3e2e1a]"
                            )
                          : cardBg
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {isAiThinking && <TypingIndicator cardBg={cardBg} />}
              <div ref={chatEndRef} />
            </div>

            <div className={cn("mt-3 flex gap-2 border-t pt-3", border)}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Спроси что-нибудь..."
                className={cn(
                  "flex-1 rounded-xl px-3.5 py-2 text-xs outline-none transition-all placeholder:text-white/30",
                  inputBg,
                  text
                )}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all disabled:opacity-40",
                  readerTheme === "dark"
                    ? "bg-purple-600 text-white hover:bg-purple-500"
                    : "bg-[#8b7355] text-[#f5e6c8] hover:bg-[#7a6348]"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {tab === "actions" && (
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl p-3.5 text-center transition-all",
                    cardBg,
                    cardHover
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15">
                    <Icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {tab === "context" && (
          <div className="space-y-2">
            {contextTitle && (
              <h4
                className={cn(
                  "mb-2 flex items-center gap-1.5 text-xs font-semibold",
                  accent
                )}
              >
                {ContextIcon && <ContextIcon className="h-3.5 w-3.5" />}
                {contextTitle}
              </h4>
            )}
            {contextItems?.map((item, i) => (
              <div key={i} className={cn("rounded-xl p-3", cardBg)}>
                <p className="text-xs font-medium">{item.title}</p>
                <p className={cn("mt-1 text-xs leading-relaxed", textMuted)}>
                  {item.description}
                </p>
              </div>
            ))}
            {(!contextItems || contextItems.length === 0) && (
              <div className="flex flex-col items-center py-8 text-center">
                <BookOpen className={cn("mb-2 h-8 w-8", textMuted)} />
                <p className={cn("text-xs", textMuted)}>
                  Нет контекста для этой страницы
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getMockResponse(
  text: string,
  role: MentorRole,
  bookTitle: string
): string {
  const roleStyles: Record<MentorRole, string> = {
    teacher: `Отличный вопрос по книге «${bookTitle}». Если рассуждать логически, ответ кроется в предыдущих главах...`,
    friend: `О, хорошая мысль! Мне тоже кажется, что это интересный момент...`,
    psychologist: `Интересно, почему ты обратил внимание именно на это? Возможно, это резонирует с твоим личным опытом...`,
    philosopher: `В контексте «${bookTitle}» этот вопрос открывает глубокий смысл. Суть не в том, что написано, а в том, что скрыто...`,
  };
  return roleStyles[role];
}

function getMockActionResponse(actionId: string, bookTitle: string): string {
  const responses: Record<string, string> = {
    retell: `Краткий пересказ книги «${bookTitle}»: всё начинается спокойно, затем возникает конфликт, герои преодолевают трудности и приходят к неожиданному финалу.`,
    explain: `Автор книги «${bookTitle}» использует метафоры для описания сложных концепций. Это помогает лучше понять суть.`,
    "main-ideas": `Главные мысли книги «${bookTitle}»:\n1. Важность осознанного выбора.\n2. Влияние окружения на личность.\n3. Необходимость постоянного развития.`,
    quiz: `Проверка знаний по книге «${bookTitle}»:\n1. Как звали главного героя?\n2. В чём заключался его основной конфликт?\n3. Какой выбор он сделал в конце?`,
    terms: `Ключевые термины из «${bookTitle}»: все они объяснены в контексте сюжета и помогают глубже понять мир произведения.`,
    flashcards: `Карточки по книге «${bookTitle}» сгенерированы. Карточка 1: Вопрос... Ответ... Карточка 2: Термин... Определение...`,
  };
  return (
    responses[actionId] ||
    `Выполнено действие "${actionId}" для книги «${bookTitle}». Результат моковый.`
  );
}

function EmptyChatState({ readerTheme }: { readerTheme: ReaderTheme }) {
  const textMuted = readerTheme === "dark" ? "text-white/50" : "text-[#7a6a4e]";
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <MessageCircleOff className={cn("mb-2 h-8 w-8", textMuted)} />
      <p className={cn("text-xs font-medium", textMuted)}>
        Здесь пока пусто
      </p>
      <p className={cn("mt-1 text-xs", textMuted, "opacity-60")}>
        Выдели текст или задай вопрос
      </p>
    </div>
  );
}

function TypingIndicator({ cardBg }: { cardBg: string }) {
  return (
    <div className="flex gap-2">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          cardBg
        )}
      >
        <Bot className="h-3.5 w-3.5 text-purple-400" />
      </div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-2xl px-3.5 py-3",
          cardBg
        )}
      >
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400/60 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400/60 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
