import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/server/telegram-auth";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function proxy(req: NextRequest, path: string[]) {
  const initData = req.headers.get("x-telegram-init-data");
  const auth = resolveUserId(initData);
  
  if ("error" in auth) {
    return NextResponse.json({ detail: auth.error }, { status: auth.status });
  }

  const search = new URLSearchParams(req.nextUrl.search);
  search.set("user_id", String(auth.userId));

  const targetUrl = `${BACKEND_URL}/api/${path.join("/")}?${search.toString()}`;

  // Формируем заголовки, бережно сохраняя x-telegram-init-data для FastAPI
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (initData) {
    headers["x-telegram-init-data"] = initData;
  }

  const init: RequestInit = {
    method: req.method,
    headers: headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const bodyText = await req.text();
    if (bodyText) {
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