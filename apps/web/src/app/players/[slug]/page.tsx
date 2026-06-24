import { notFound, permanentRedirect } from "next/navigation";

import { runPromise } from "@/lib/effect/runtime";
import { fetchPlayerRows, resolvePersonPsdId } from "@/lib/seo/legacy-redirect";

interface LegacyPlayerProps {
  params: Promise<{ slug: string }>;
}

/**
 * Legacy plural player URL `/players/<name-slug>`. Same resolution as
 * `/player/<name-slug>` — kept as a sibling shim rather than a cross-segment
 * re-export (importing through a `[slug]` literal path is bundler-fragile).
 * The old static `/players/:slug → /spelers/:slug` rename was removed because
 * it passed a name-slug to the psdId-keyed route and 404'd (#2227, SEO-7).
 */
export default async function LegacyPlayersRedirect({
  params,
}: LegacyPlayerProps) {
  const { slug } = await params;
  const rows = await runPromise(fetchPlayerRows());
  const psdId = resolvePersonPsdId(slug, rows);
  if (!psdId) notFound();
  permanentRedirect(`/spelers/${psdId}`);
}
