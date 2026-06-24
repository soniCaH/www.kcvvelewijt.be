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
  const rows = await runPromise(fetchStaffRows());
  const psdId = resolvePersonPsdId(slug, rows);
  if (!psdId) notFound();
  permanentRedirect(`/staf/${psdId}`);
}
