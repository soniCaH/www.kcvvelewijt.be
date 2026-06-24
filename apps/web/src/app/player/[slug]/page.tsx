import { notFound, permanentRedirect } from "next/navigation";

import { runPromise } from "@/lib/effect/runtime";
import { fetchPlayerRows, resolvePersonPsdId } from "@/lib/seo/legacy-redirect";

interface LegacyPlayerProps {
  params: Promise<{ slug: string }>;
}

/**
 * Legacy Gatsby player profile URL (`/player/<name-slug>`, also reached via the
 * old plural `/players/<name-slug>`). Resolve the name-slug to a `psdId` and
 * 308 to the canonical `/spelers/<psdId>` route; 404 when the person is gone.
 * `permanentRedirect` emits a 308 — the SEO-equivalent of the AC's "301", and
 * consistent with every `permanent: true` rename in next.config.
 */
export default async function LegacyPlayerRedirect({
  params,
}: LegacyPlayerProps) {
  const { slug } = await params;
  const rows = await runPromise(fetchPlayerRows());
  const psdId = resolvePersonPsdId(slug, rows);
  if (!psdId) notFound();
  permanentRedirect(`/spelers/${psdId}`);
}
