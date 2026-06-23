import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const limit = searchParams.get("limit") ?? "3";

  if (!id) {
    return NextResponse.json([]);
  }

  const bffUrl = process.env.KCVV_API_URL;
  if (!bffUrl) {
    return NextResponse.json([], { status: 503 });
  }

  try {
    const res = await fetch(
      `${bffUrl}/related?id=${encodeURIComponent(id)}&limit=${encodeURIComponent(limit)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return NextResponse.json([]);
    // Public, CDN-cacheable: related content shifts slowly; SWR keeps it warm.
    // Only the success path is cached — the [] fallbacks stay uncached so a
    // transient BFF blip isn't pinned for 5 min.
    return NextResponse.json(await res.json(), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[related] fetch failed:", err);
    return NextResponse.json([]);
  }
}
