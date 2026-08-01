import "server-only";
import crypto from "node:crypto";

/**
 * Проверка подлинности Telegram WebApp initData на сервере.
 *
 * Это единственное место во всём стеке, которому разрешено решать "кто это".
 * Всё остальное (frontend компоненты, сам FastAPI) получает уже
 * провалидированный numeric user_id и ему доверяет — но user_id туда
 * попадает ТОЛЬКО отсюда, никогда напрямую из тела запроса браузера.
 *
 * Алгоритм — ровно тот, что описан в официальной документации Telegram
 * (Validating data received via the Mini App):
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // initData старше суток considered протухшей

export interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

export interface AuthResult {
  ok: boolean;
  user?: TelegramUser;
  reason?: string;
}

export function validateInitData(initData: string, botToken: string): AuthResult {
  if (!initData) return { ok: false, reason: "empty initData" };
  if (!botToken) return { ok: false, reason: "TELEGRAM_BOT_TOKEN не задан на сервере" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "no hash in initData" };
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "hash mismatch" };
  }

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    return { ok: false, reason: "initData истёк, перезапусти Mini App" };
  }

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, reason: "no user in initData" };
  try {
    const user = JSON.parse(userRaw) as TelegramUser;
    if (!user.id) return { ok: false, reason: "user.id missing" };
    return { ok: true, user };
  } catch {
    return { ok: false, reason: "user field is not valid JSON" };
  }
}

/**
 * Достаёт доверенный user_id из заголовка запроса. В деве (вне Telegram, без
 * initData) можно разрешить фейковый ID через DEV_FAKE_TELEGRAM_ID, чтобы не
 * гонять реальный Telegram ради локальной разработки — но ТОЛЬКО когда
 * NODE_ENV !== "production".
 */
export function resolveUserId(initData: string | null): { userId: number } | { error: string; status: number } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";

  if (!initData) {
    if (process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_TELEGRAM_ID) {
      return { userId: Number(process.env.DEV_FAKE_TELEGRAM_ID) };
    }
    return { error: "Нет initData — открой приложение из Telegram", status: 401 };
  }

  const result = validateInitData(initData, botToken);
  if (!result.ok || !result.user) {
    return { error: result.reason ?? "invalid initData", status: 401 };
  }
  return { userId: result.user.id };
}