import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { urlSearchParamPreviewPathname } from "@sanity/preview-url-secret";
import { toSamePath } from "@/lib/sanity/preview-path";

/**
 * Turns preview mode off (#3619). No secret: leaving preview mode must always
 * work. Redirects to the same-site path it was given, else the homepage.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = toSamePath(url.searchParams.get(urlSearchParamPreviewPathname));

  (await draftMode()).disable();
  return NextResponse.redirect(new URL(path ?? "/", url), 307);
}
