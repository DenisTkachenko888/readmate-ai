"use client";

import { postMessage } from "./channel";

export function init() {
  const handleError = (event: ErrorEvent) => {
    postMessage({
      type: "error",
      payload: {
        kind: "runtime",
        message: event.message,
        stack: event.error?.stack,
        source: `${event.filename}:${event.lineno}:${event.colno}`,
      },
    });
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    postMessage({
      type: "error",
      payload: {
        kind: "promise",
        message: String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
      },
    });
  };

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  const createConsoleInterceptor =
    (level: "log" | "warn" | "error" | "info") =>
    (...args: unknown[]) => {
      originalConsole[level].apply(console, args);
      postMessage({
        type: "console",
        payload: {
          level,
          args: args.map((arg) =>
            typeof arg === "object" ? String(arg) : arg
          ),
        },
      });
    };

  console.log = createConsoleInterceptor("log");
  console.warn = createConsoleInterceptor("warn");
  console.error = createConsoleInterceptor("error");
  console.info = createConsoleInterceptor("info");

  const overlayObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          const isOverlay =
            node.matches?.("[data-nextjs-dialog]") ||
            node.matches?.("[data-nextjs-toast]") ||
            node.querySelector?.("[data-nextjs-dialog]") ||
            node.querySelector?.("[data-nextjs-toast]");

          if (isOverlay) {
            const text = node.textContent || "";
            if (text.includes("error") || text.includes("Error")) {
              postMessage({
                type: "error",
                payload: {
                  kind: "overlay",
                  message: text.slice(0, 5000),
                },
              });
            }
          }
        }
      }
    }
  });

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  overlayObserver.observe(document.body, { childList: true, subtree: true });

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    overlayObserver.disconnect();
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
  };
}
