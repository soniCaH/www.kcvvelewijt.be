import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_IP_HEADER } from "@kcvv/api-contract";
import { bffKeyHeader } from "./bff-key";

/**
 * Forwards a visitor's POST body to `KCVV_API_URL{path}` and hands the BFF's
 * status and JSON back. A server-side proxy avoids CORS and keeps the BFF URL
 * out of the client bundle. `/api/search` and `/api/search/team-guess` (#3559).
 */
export async function proxyPostToBff(request: NextRequest, path: string) {
  const bffUrl = process.env.KCVV_API_URL;
  const bffKey = bffKeyHeader();
  if (!bffUrl || !bffKey) {
    return NextResponse.json(
      { error: "Search service not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as unknown;
    // The worker rate-limits per visitor (#3468) but only sees Vercel's IP.
    // Vercel overwrites x-vercel-forwarded-for, so a client cannot spoof it.
    const clientIp =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const res = await fetch(`${bffUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...bffKey,
        ...(clientIp ? { [CLIENT_IP_HEADER]: clientIp } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    // Read the body once: `res.json()` consumes it, so a `res.text()` fallback
    // after a failed parse would throw "Body is unusable".
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: text || "Unknown error from search service" };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`[Search API] BFF proxy error on ${path}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
