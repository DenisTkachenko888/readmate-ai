"use client";

import { useEffect } from "react";

export function TelegramInit() {
  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        (window as unknown as Record<string, unknown>).Telegram
      ) {
        const tg = (window as unknown as Record<string, unknown>)
          .Telegram as Record<string, unknown>;
        const webApp = tg.WebApp as Record<string, unknown>;
        if (typeof webApp?.expand === "function") {
          (webApp.expand as () => void)();
        }
      }
    } catch {
      // Telegram SDK not available
    }
  }, []);

  return null;
}
