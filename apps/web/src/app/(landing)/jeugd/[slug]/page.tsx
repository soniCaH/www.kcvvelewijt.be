import type { Metadata } from "next";
import { Effect } from "effect";
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
/**
 * #2963: this route has no not-found metadata of its own, so an unknown age
 * token inherited the root layout's indexable metadata. A resolver either
 * redirects or 404s, so static noindex metadata is always correct here; no
 * second read is needed.
 *
 * **This route no longer soft-404s (#2791).** The earlier note here said
 * `(landing)`'s `loading.tsx` flushed the shell, and its 200, before
 * `notFound()` could run. That was true until #2791 moved that file into the
 * `(home)` route group and `jeugd/loading.tsx` into `jeugd/(index)`: nothing
 * above `/jeugd/[slug]` is a Suspense boundary now, and neither layout in the
 * chain carries one, so an unknown age token returns a real **404** rather
 * than a 200. That is the outcome #2968 wants, arrived at sideways — it is
 * not a licence to assume the other `#2963` sites moved with it. Every one of
 * them still sits under its own `loading.tsx` and still soft-404s.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LegacyYouthRedirect({
  params,
}: LegacyYouthProps) {
  const { slug } = await params;
  // Subject read: this route exists only to resolve the redirect target, so a
  // failed read takes the page down with it (#2864).
  const rows = await runPromise(fetchYouthTeamRows().pipe(Effect.orDie));
  const target = resolveYouthSlug(slug, rows);
  if (!target) notFound();
  permanentRedirect(`/ploegen/${target}`);
}
