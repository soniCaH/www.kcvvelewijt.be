import { NextResponse } from "next/server";
import { bffKeyHeader } from "./bff-key";

/**
 * Forwards a form POST to `KCVV_API_URL{path}` and hands the BFF's status and
 * JSON back, so the form can render per-field messages from a 400 body.
 * `/api/membership` and `/api/darts`; `label` names the route in the log.
 */
export async function proxyFormPost(
  request: Request,
  path: string,
  label: string,
) {
  const bffUrl = process.env.KCVV_API_URL;
  const bffKey = bffKeyHeader();
  if (!bffUrl || !bffKey) {
    return NextResponse.json(
      { ok: false, error: "Het formulier is momenteel niet beschikbaar." },
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
    const res = await fetch(`${bffUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...bffKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    // Pass the BFF response through (incl. 400 field errors) so the form can
    // render per-field messages.
    const data = await res.json().catch(() => ({ ok: res.ok }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`[${label}] Proxy error:`, error);
    return NextResponse.json(
      { ok: false, error: "Je bericht kon niet worden verzonden." },
      { status: 500 },
    );
  }
}
