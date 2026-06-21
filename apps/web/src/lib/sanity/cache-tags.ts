/**
 * Content-tag names shared by repository list reads (Scope B) and the
 * `/api/revalidate` Sanity webhook (Scope E). Single source of truth so the
 * two sides cannot drift — a repo tagging `players` and a webhook revalidating
 * `player` would silently never invalidate.
 */
export const SANITY_TAGS = {
  players: "players",
  teams: "teams",
  sponsors: "sponsors",
  staff: "staff",
  articles: "articles",
  banners: "banners",
  galleries: "galleries",
} as const;

/**
 * Time-based safety net (seconds) for tagged list caches. On-demand
 * invalidation via `revalidateTag` (Scope E) is the primary freshness
 * mechanism; this only bounds staleness if a webhook is ever missed.
 */
export const SANITY_LIST_REVALIDATE = 60 * 60 * 24; // 24h
