"use client";

import {
  BRIDGE_VERSION,
  isValidMessage,
  type BridgeMessage,
  type BridgePayload,
} from "./types";

interface MessageHandler {
  (message: BridgeMessage<BridgePayload>): void;
}

let parentWindow: Window | null = null;
let secret: string | null = null;
let isReady = false;
const handlers = new Map<string, MessageHandler>();

export function isBridgeReady(): boolean {
  return isReady;
}

export function getParentWindow(): Window | null {
  return parentWindow;
}

export function getSecret(): string | null {
  return secret;
}

export function postMessage(
  message: Omit<BridgeMessage<BridgePayload>, "version">
) {
  if (!parentWindow) {
    return;
  }
  parentWindow.postMessage({ ...message, version: BRIDGE_VERSION }, "*");
}

export function onMessage(type: string, handler: MessageHandler) {
  handlers.set(type, handler);
}

export function offMessage(type: string) {
  handlers.delete(type);
}

function handleMessage(event: MessageEvent) {
  if (!event.source || event.source === window) {
    return;
  }

  const data = event.data;
  if (!isValidMessage(data)) {
    return;
  }

  if (!isReady && data.type === "ping") {
    const payload = data.payload as { secret?: string };
    if (typeof payload?.secret === "string") {
      parentWindow = event.source as Window;
      secret = payload.secret;
      isReady = true;
    }
  }

  if (isReady && data.type === "ping") {
    const payload = data.payload as { secret?: string };
    if (payload?.secret === secret) {
      postMessage({ type: "ping", payload: { secret: secret } });
    }
  }

  const handler = handlers.get(data.type);
  if (handler) {
    handler(data as BridgeMessage<BridgePayload>);
  }
}

export function init() {
  window.addEventListener("message", handleMessage);
  return () => {
    window.removeEventListener("message", handleMessage);
    parentWindow = null;
    secret = null;
    isReady = false;
    handlers.clear();
  };
}
