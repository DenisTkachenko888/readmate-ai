export const BRIDGE_VERSION = 1;

export interface BridgeMessage<T = unknown> {
  version: number;
  type: string;
  payload?: T;
}

export interface PingPayload {
  secret: string;
}

export interface UrlPayload {
  href: string;
  pathname: string;
  search: string;
  hash: string;
}

export interface ToggleInspectorPayload {
  enabled: boolean;
}

export interface NavigatePayload {
  url: string;
}

export interface ErrorPayload {
  kind: "runtime" | "promise" | "console" | "overlay";
  message: string;
  stack?: string;
  source?: string;
}

export interface ConsolePayload {
  level: "log" | "warn" | "error" | "info";
  args: unknown[];
}

export interface ElementSelectedPayload {
  selector: string;
  xpath: string;
  tagName: string;
  text?: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface InspectorHoveredPayload {
  selector: string;
  tagName: string;
}

export type BridgePayload =
  | PingPayload
  | UrlPayload
  | ToggleInspectorPayload
  | NavigatePayload
  | ErrorPayload
  | ConsolePayload
  | ElementSelectedPayload
  | InspectorHoveredPayload;

export function isValidMessage(
  data: unknown
): data is BridgeMessage<BridgePayload> {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    typeof msg.version === "number" &&
    msg.version === BRIDGE_VERSION &&
    typeof msg.type === "string"
  );
}
