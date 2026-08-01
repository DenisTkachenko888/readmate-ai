import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/server/telegram-auth";

export const runtime = "nodejs"; // нужен node:crypto для проверки initData

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Единая прокси-точка браузер -> Next.js -> FastAPI.
 *
 * Зачем она вообще нужна, а не звать FastAPI из браузера напрямую:
 *  1. Безопасность: сюда приходит "сырой" initData, здесь (и только здесь)
 *     он проверяется по HMAC и превращается в доверенный user_id. Ни браузер,
 *     ни FastAPI сами по себе НЕ должны решать "чей это user_id".
 *  2. Инфраструктура: в Docker/проде фронтенд и бэкенд обычно в разных
 *     сетях/доменах — прокси через same-origin /api/backend/* снимает CORS
 *     и не требует светить адрес FastAPI в браузере.
 *
 * frontend/lib/backend-client.ts — единственное место на клиенте, которое
 * должно знать про путь /api/backend/*; остальной код зовёт его функции.
 */
async function proxy(req: NextRequest, path: string[]) {
  const auth = resolveUserId(req.headers.get("x-telegram-init-data"));
  if ("error" in auth) {
    return NextResponse.json({ detail: auth.error }, { status: auth.status });
  }

  const search = new URLSearchParams(req.nextUrl.search);
  search.set("user_id", String(auth.userId)); // всегда доверенный ID, что бы ни прислал клиент

  const targetUrl = `${BACKEND_URL}/api/${path.join("/")}?${search.toString()}`;

  const init: RequestInit = {
    method: req.method,
    headers: { "content-type": "application/json" },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const bodyText = await req.text();
    if (bodyText) {
      // user_id тоже дублируем в теле для POST-эндпоинтов, которые читают его из body
      try {
        const parsed = JSON.parse(bodyText);
        parsed.user_id = auth.userId;
        init.body = JSON.stringify(parsed);
      } catch {
        init.body = bodyText;
      }
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (err) {
    console.error("Backend unreachable:", err);
    return NextResponse.json(
      { detail: "Бэкенд недоступен. Проверь, что FastAPI-сервис запущен и BACKEND_URL указывает на него." },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data, { status: upstream.status });
  }
  const text = await upstream.text();
  return new NextResponse(text, { status: upstream.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}