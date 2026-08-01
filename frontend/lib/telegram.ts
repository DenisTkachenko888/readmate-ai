"use client";

/**
 * Тонкая обёртка над window.Telegram.WebApp.
 *
 * ВАЖНО: initDataUnsafe.user НЕ является доверенным источником личности сам
 * по себе — это просто то, что прислал клиент, его легко подделать в devtools.
 * Настоящая проверка происходит на сервере (frontend/lib/server/telegram-auth.ts),
 * которому мы передаём "сырую" строку initData, а не готовый объект user.
 * Здесь эта функция нужна только для (а) отправки initData на бэкенд и
 * (б) мгновенного оптимистичного UI (имя/аватар) до ответа сервера.
 */

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
  expand: () => void;
  ready: () => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
}

function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } })
    .Telegram?.WebApp;
  return tg ?? null;
}

/** Сырая строка initData — единственное, что должно уходить на сервер как "доказательство личности". */
export function getInitData(): string {
  return getWebApp()?.initData ?? "";
}

/** Для мгновенного (недоверенного) отображения имени/аватара, пока идёт запрос к серверу. */
export function getUnsafeUser() {
  return getWebApp()?.initDataUnsafe?.user ?? null;
}

export function isInsideTelegram(): boolean {
  return !!getWebApp()?.initData;
}

/**
 * Локальный dev-фолбэк: вне Telegram (обычный браузер на localhost) initData
 * пустая, а бэкенд-прокси в dev-режиме подставляет тестовый user_id (см.
 * frontend/app/api/backend/[...path]/route.ts и DEV_FAKE_TELEGRAM_ID) —
 * так фронтенд можно разрабатывать и без реального Telegram-контейнера.
 */
export function getHeaders(): HeadersInit {
  const initData = getInitData();
  return initData ? { "x-telegram-init-data": initData } : {};
}