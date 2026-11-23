import { NextResponse } from "next/server";
import { bffKeyHeader } from "./bff-key";

const NO_STORE = { "Cache-Control": "no-store" };

const call = async (opts: {
  path: string;
  label: string;
  method: "GET" | "POST";
  body?: unknown;
  noStore?: boolean;
}) => {
  const headers = opts.noStore ? NO_STORE : undefined;
  const bffUrl = process.env.KCVV_API_URL;
  const bffKey = bffKeyHeader();
  if (!bffUrl || !bffKey) {
    return NextResponse.json(
      { ok: false, error: "Het formulier is momenteel niet beschikbaar." },
      { status: 503, headers },
    );
  }

  try {
    const res = await fetch(`${bffUrl}${opts.path}`, {
      method: opts.method,
      headers: {
        ...(opts.method === "POST"
          ? { "Content-Type": "application/json" }
          : {}),
        ...bffKey,
      },
      ...(opts.method === "POST" ? { body: JSON.stringify(opts.body) } : {}),
      ...(opts.noStore ? { cache: "no-store" as const } : {}),
      signal: AbortSignal.timeout(10_000),
    });
    // Pass the BFF response through (incl. 400 field errors) so the form can
    // render per-field messages.
    const data = await res.json().catch(() => ({ ok: res.ok }));
    return NextResponse.json(data, { status: res.status, headers });
  } catch (error) {
    console.error(`[${opts.label}] Proxy error:`, error);
    return NextResponse.json(
      { ok: false, error: "Je bericht kon niet worden verzonden." },
      { status: 500, headers },
    );
  }
};

const UNPARSABLE = Symbol("unparsable");

/**
 * Forwards a form POST to `KCVV_API_URL{path}` and hands the BFF's status and
 * JSON back, so the form can render per-field messages from a 400 body.
 * `/api/membership` and `/api/darts`; `label` names the route in the log.
 */
export const proxyFormPost = async (
  request: Request,
  path: string,
  label: string,
) => {
  const body: unknown = await request.json().catch(() => UNPARSABLE);
  if (body === UNPARSABLE) {
    return NextResponse.json(
      { ok: false, error: "Ongeldige aanvraag." },
      { status: 400 },
    );
  }
  return call({ path, label, method: "POST", body });
};

/**
 * Forwards a GET to `KCVV_API_URL{path}`, uncached on both hops. The same
 * not-configured and failure answers as `proxyFormPost`. `/api/darts/spots`.
 */
export const proxyFormGet = (path: string, label: string) =>
  call({ path, label, method: "GET", noStore: true });
