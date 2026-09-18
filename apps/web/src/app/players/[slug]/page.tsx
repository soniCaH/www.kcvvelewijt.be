import { Effect } from "effect";
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
  // Subject read: this route exists only to resolve the redirect target, so a
  // failed read takes the page down with it (#2864).
  const rows = await runPromise(fetchPlayerRows().pipe(Effect.orDie));
  const psdId = resolvePersonPsdId(slug, rows);
  if (!psdId) notFound();
  permanentRedirect(`/spelers/${psdId}`);
}
