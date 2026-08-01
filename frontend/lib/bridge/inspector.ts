"use client";

import { onMessage, offMessage, postMessage } from "./channel";

interface InspectorState {
  active: boolean;
  hoveredElement: HTMLElement | null;
  selectedElement: HTMLElement | null;
}

let state: InspectorState = {
  active: false,
  hoveredElement: null,
  selectedElement: null,
};

const listeners = new Set<(state: InspectorState) => void>();

export function getState(): InspectorState {
  return state;
}

export function subscribe(callback: (state: InspectorState) => void) {
  listeners.add(callback);
  callback(state);
  return () => listeners.delete(callback);
}

function setState(patch: Partial<InspectorState>) {
  state = { ...state, ...patch };
  listeners.forEach((cb) => cb(state));
}

function computeSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;

  const path: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.className) {
      const classes = current.className
        .split(" ")
        .filter((c) => c.trim() && !c.startsWith("hover-"));
      if (classes.length) {
        selector += `.${classes.join(".")}`;
      }
    }

    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (s) => s.tagName === current!.tagName
        )
      : [];
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

function computeXPath(el: HTMLElement): string {
  const segments: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    segments.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
  }

  return "/" + segments.join("/");
}

export function init() {
  const handleMouseMove = (e: MouseEvent) => {
    if (!state.active) return;
    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;
    if (el && el !== state.hoveredElement) {
      setState({ hoveredElement: el });
      const selector = computeSelector(el);
      postMessage({
        type: "inspector-hovered",
        payload: { selector, tagName: el.tagName.toLowerCase() },
      });
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (!state.active) return;
    e.preventDefault();
    e.stopPropagation();

    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    postMessage({
      type: "element-selected",
      payload: {
        selector: computeSelector(el),
        xpath: computeXPath(el),
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.slice(0, 200) || undefined,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      },
    });

    setState({ active: false, selectedElement: el, hoveredElement: null });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && state.active) {
      setState({ active: false, hoveredElement: null });
    }
  };

  const handleToggleInspector = (message: { payload?: unknown }) => {
    const payload = message.payload as { enabled?: boolean } | undefined;
    const enabled = payload?.enabled ?? true;
    setState({ active: enabled, hoveredElement: null, selectedElement: null });
  };

  onMessage("toggle-inspector", handleToggleInspector);

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("click", handleClick, true);
  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("click", handleClick, true);
    window.removeEventListener("keydown", handleKeyDown);
    offMessage("toggle-inspector");
  };
}
