"use client";

import { useEffect } from "react";
import { init as initChannel } from "@/lib/bridge/channel";
import { init as initPing } from "@/lib/bridge/ping";
import { init as initErrors } from "@/lib/bridge/errors";
import { init as initInspector } from "@/lib/bridge/inspector";
import { init as initRouter } from "@/lib/bridge/router";
import { InspectorOverlay } from "./inspector-overlay";

export function BridgeProvider() {
  useEffect(() => {
    const cleanups = [
      initChannel(),
      initPing(),
      initErrors(),
      initInspector(),
      initRouter(),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return <InspectorOverlay />;
}
