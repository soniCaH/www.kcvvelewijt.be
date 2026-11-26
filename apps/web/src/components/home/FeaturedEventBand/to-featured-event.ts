/**
 * `EventVM` → `<FeaturedEventBand>` props. Lives beside the band rather than in
 * the landing page so it can be unit-tested without pulling the page graph in
 * (see `first-teams.ts` for the same split on the match side).
 */
import type { EventVM } from "@/lib/repositories/event.repository";
import type { FeaturedEventBandEvent } from "./FeaturedEventBand";

export const toFeaturedEventBandEvent = (
  event: EventVM | null,
): FeaturedEventBandEvent | null => {
  if (!event || !event.dateStart) return null;
  const isExternalLink = event.href && event.href !== "#" && event.href !== "";
  return {
    title: event.title,
    slug: event.slug,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd ?? null,
    // #2392: the CMS venue used to stop here, so the band's "Kantine" default
    // overwrote every editor-set location instead of only filling the blanks.
    location: event.location ?? null,
    coverImage: event.coverImageUrl
      ? { url: event.coverImageUrl, alt: event.title }
      : null,
    externalLink: isExternalLink ? { url: event.href, label: null } : null,
  };
};
