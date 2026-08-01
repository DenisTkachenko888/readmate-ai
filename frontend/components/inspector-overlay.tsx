"use client";

import { useEffect, useState } from "react";
import { subscribe, getState } from "@/lib/bridge/inspector";

export function InspectorOverlay() {
  const [inspectorState, setInspectorState] = useState(getState);

  useEffect(() => {
    const unsubscribe = subscribe(setInspectorState);
    return () => {
      unsubscribe();
    };
  }, []);

  if (!inspectorState.active || !inspectorState.hoveredElement) {
    return null;
  }

  const rect = inspectorState.hoveredElement.getBoundingClientRect();

  return (
    <div
      style={{
        position: "fixed",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        pointerEvents: "none",
        zIndex: 999999,
        boxShadow: "0 0 0 2px #3b82f6, 0 0 0 4px rgba(59,130,246,0.3)",
      }}
    />
  );
}
