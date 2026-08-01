"use client";

import { onMessage, offMessage, postMessage } from "./channel";

function getUrlPayload() {
  return {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

function sendUrl() {
  postMessage({ type: "url", payload: getUrlPayload() });
}

function sendRouteChange() {
  postMessage({ type: "route-change", payload: getUrlPayload() });
}

export function init() {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    sendRouteChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    sendRouteChange();
  };

  window.addEventListener("popstate", sendRouteChange);

  const handleGetUrl = () => {
    sendUrl();
  };

  const handleNavigate = (message: { payload?: unknown }) => {
    const payload = message.payload as { url?: string } | undefined;
    if (payload?.url) {
      window.location.href = payload.url;
    }
  };

  onMessage("get-url", handleGetUrl);
  onMessage("navigate", handleNavigate);

  sendUrl();

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", sendRouteChange);
    offMessage("get-url");
    offMessage("navigate");
  };
}
