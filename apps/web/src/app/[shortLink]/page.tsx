import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { findShortLink } from "@/lib/server/short-links";
import { sendShortLinkClick } from "@/lib/server/short-link-click";

/**
 * Short links (#3573): a one-word path (`/stage`) the board points at a target
 * in the Studio. This is the only top-level dynamic segment, so it receives
 * exactly the one-segment paths no real route owns; `RESERVED_SHORT_LINK_NAMES`
 * (and its test) keep the Studio from naming a link after a real page.
 *
 * Rendered per request, on purpose. Left static, Next would cache the first
 * answer per name: later hits would skip `after()` and go uncounted, and a
 * deleted link would keep redirecting until the cache turned over. The lookup
 * itself is cheap: `findShortLink` reads one cached list, never Sanity per
 * request.
 *
 * Do NOT add a `loading.tsx` or any `Suspense` boundary in this segment or
 * above it: once the shell streams, `notFound()` would answer `200` (a soft
 * 404) and `redirect()` a meta-refresh instead of a `307`. The root layout has
 * none. `page.test.ts` pins the statuses; the e2e spec pins the 404.
 */
export const dynamic = "force-dynamic";

export default async function ShortLinkPage({
  params,
}: {
  params: Promise<{ shortLink: string }>;
}) {
  const { shortLink } = await params;
  const link = await findShortLink(shortLink);
  if (!link) notFound();

  // Only known names are counted, so bots on random paths never reach GA4.
  after(() => sendShortLinkClick(link.name));
  redirect(link.target);
}
