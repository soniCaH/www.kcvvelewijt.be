import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const bffUrl = process.env.KCVV_API_URL;
  if (!bffUrl) {
    return NextResponse.json(
      { ok: false, error: "Feedback service not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${bffUrl}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ ok: res.ok }, { status: res.status });
  } catch (error) {
    console.error("[Feedback API] Proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}