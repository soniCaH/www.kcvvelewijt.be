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
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
