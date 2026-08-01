"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function getOnlineStatus() {
  return navigator.onLine;
}

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    () => true
  );

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-red-600/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Нет подключения к интернету. Некоторые функции могут быть недоступны.
      </span>
    </div>
  );
}
