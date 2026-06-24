import { notFound, permanentRedirect } from "next/navigation";

import { runPromise } from "@/lib/effect/runtime";
import {
  fetchYouthTeamRows,
  resolveYouthSlug,
} from "@/lib/seo/legacy-redirect";

interface LegacyYouthProps {
  params: Promise<{ slug: string }>;
}

/**
 * Legacy Gatsby youth URL `/jeugd/<age-token>` (e.g. `/jeugd/u9`, `/jeugd/u8-wit`).
 * Youth team slugs drifted to `kcvve-u9-groen` form post-migration, so the old
 * static `/jeugd/:slug → /ploegen/:slug` pass-through 404'd; it was removed in
 * favour of this age-based resolver (#2227, SEO-8). 308 to the resolved
 * `/ploegen/<slug>`; 404 when no youth team of that age exists.
 */
export default async function LegacyYouthRedirect({
  params,
}: LegacyYouthProps) {
  const { slug } = await params;
  const rows = await runPromise(fetchYouthTeamRows());
  const target = resolveYouthSlug(slug, rows);
  if (!target) notFound();
  permanentRedirect(`/ploegen/${target}`);
}
