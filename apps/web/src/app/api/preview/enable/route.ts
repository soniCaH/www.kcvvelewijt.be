import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import {
  urlSearchParamPreviewPathname,
  validatePreviewUrl,
} from "@sanity/preview-url-secret";
import { sanityClient } from "@/lib/sanity/client";
import { toSamePath } from "@/lib/sanity/preview-path";

/**
 * Turns on preview mode (#3619). The Studio's "Voorbeeld" action opens this
 * URL in a new tab with a short-lived, per-user secret it just wrote to the
 * dataset; we check that secret with the server-side read token, set Next's
 * draft-mode cookie (HttpOnly, host-scoped) and redirect to the page.
 *
 * Same secret-checked shape as `/api/revalidate`: 503 when the server is not
 * configured, 401 for a missing/wrong/expired secret. 400 for a target that
 * is not a path on this site, so the endpoint is never an open redirect.
 */
export async function GET(request: Request) {
  const { projectId, token } = sanityClient.config();
  if (!projectId || !token) {
    return NextResponse.json(
      { ok: false, error: "Preview not configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const path = toSamePath(url.searchParams.get(urlSearchParamPreviewPathname));
  if (!path) {
    return NextResponse.json(
      { ok: false, error: "Invalid redirect target" },
      { status: 400 },
    );
  }

  const { isValid } = await validatePreviewUrl(sanityClient, request.url);
  if (!isValid) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired preview secret" },
      { status: 401 },
    );
  }

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, url), 307);
}
