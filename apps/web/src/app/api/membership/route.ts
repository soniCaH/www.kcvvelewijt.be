import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const bffUrl = process.env.KCVV_API_URL;
  if (!bffUrl) {
    return NextResponse.json(
      { ok: false, error: "Inschrijvingen zijn momenteel niet beschikbaar." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ongeldige aanvraag." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${bffUrl}/forms/membership`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    // Pass the BFF response through (incl. 400 field errors) so the form can
    // render per-field messages.
    const data = await res.json().catch(() => ({ ok: res.ok }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Membership API] Proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Inschrijving kon niet worden verzonden." },
      { status: 500 },
    );
  }
}
