import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { urlSearchParamPreviewPathname } from "@sanity/preview-url-secret";
import { toSameOriginUrl } from "@/lib/sanity/preview-path";

/**
 * Turns preview mode off (#3619). No secret: leaving preview mode must always
 * work. Redirects to the same-site path it was given, else the homepage.
 */
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const target = toSameOriginUrl(
    url.searchParams.get(urlSearchParamPreviewPathname),
    url,
  );

  (await draftMode()).disable();
  return NextResponse.redirect(target ?? new URL("/", url), 307);
};
