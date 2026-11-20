import { NextResponse } from "next/server";
import { bffKeyHeader } from "@/lib/server/bff-key";

// Fresh on every call, and not ISR: a route handler with `force-dynamic`
// writes nothing to the ISR cache, which Vercel Hobby caps (#3812).
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Spots left for EK Darts, counted live from Sanity by the BFF. The page is
 * static; its signup block reads this once on mount.
 */
export async function GET() {
  const bffUrl = process.env.KCVV_API_URL;
  const bffKey = bffKeyHeader();
  if (!bffUrl || !bffKey) {
    return NextResponse.json(
      { error: "Niet beschikbaar." },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const res = await fetch(`${bffUrl}/forms/darts/spots`, {
      headers: bffKey,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: NO_STORE });
  } catch (error) {
    console.error("[Darts spots API] Proxy error:", error);
    return NextResponse.json(
      { error: "Niet beschikbaar." },
      { status: 500, headers: NO_STORE },
    );
  }
}
