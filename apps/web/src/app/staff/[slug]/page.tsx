import { Effect } from "effect";
import { notFound, permanentRedirect } from "next/navigation";

import { runPromise } from "@/lib/effect/runtime";
import { fetchStaffRows, resolvePersonPsdId } from "@/lib/seo/legacy-redirect";

interface LegacyStaffProps {
  params: Promise<{ slug: string }>;
}

/**
 * Legacy Gatsby staff profile URL `/staff/<name-slug>`. Resolve the name-slug
 * to a `psdId` and 308 to the canonical `/staf/<psdId>` route; 404 when gone.
 * The old static `/staff/:slug → /staf/:slug` rename was removed because it
 * passed a name-slug to the psdId-keyed route and 404'd (#2227, SEO-7).
 */
export default async function LegacyStaffRedirect({
  params,
}: LegacyStaffProps) {
  const { slug } = await params;
  // Subject read: this route exists only to resolve the redirect target, so a
  // failed read takes the page down with it (#2864).
  const rows = await runPromise(fetchStaffRows().pipe(Effect.orDie));
  const psdId = resolvePersonPsdId(slug, rows);
  if (!psdId) notFound();
  permanentRedirect(`/staf/${psdId}`);
}
