/**
 * Legacy Gatsby → Next URL resolution (#2227).
 *
 * The old Gatsby site keyed player/staff profiles by a name-slug
 * (`/player/<firstname-lastname>`, `/staff/<…>`) and youth teams by a bare age
 * token (`/jeugd/u9`). The new routes key players/staff by `psdId`
 * (`/spelers/<psdId>`, `/staf/<psdId>`) and teams by a CMS slug
 * (`/ploegen/kcvve-u9-groen`), so a static prefix redirect 404s. These helpers
 * resolve the legacy form to the current one at request time.
 *
 * Queries are plain strings (not `defineQuery`) on purpose: they are
 * redirect-only and intentionally kept out of the generated `sanity.types`
 * surface.
 */
import { fetchGroq } from "@/lib/sanity/fetch-groq";
import { SANITY_TAGS, SANITY_LIST_REVALIDATE } from "@/lib/sanity/cache-tags";
import { slugify } from "@/lib/utils/slugify";

// ─── Pure slug logic ─────────────────────────────────────────────────────────

/**
 * Slugify a person's name the way the legacy site keyed profile URLs:
 * `"${firstName} ${lastName}"` through the shared `slugify`
 * (`lib/utils/slugify.ts` — dependency-free on purpose; this file is not).
 */
export function nameToSlug(firstName: string, lastName: string): string {
  return slugify(`${firstName} ${lastName}`);
}

export interface PersonRow {
  psdId: string | null;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Resolve a legacy person name-slug to a `psdId`. Falls back to treating the
 * slug as a `psdId` directly (covers any `/players/<psdId>` style link).
 * Returns `null` when nothing matches.
 */
export function resolvePersonPsdId(
  slug: string,
  rows: readonly PersonRow[],
): string | null {
  const target = slug.toLowerCase();
  for (const row of rows) {
    if (!row.psdId) continue;
    if (nameToSlug(row.firstName ?? "", row.lastName ?? "") === target) {
      return row.psdId;
    }
  }
  return rows.some((row) => row.psdId === slug) ? slug : null;
}

export interface YouthTeamRow {
  slug: string | null;
  age: string | null;
}

/**
 * Resolve a legacy youth token (e.g. `"u9"`, `"u8-wit"`) to a current team
 * slug. Youth slugs drifted to `"kcvve-u9-groen"` form after migration, so the
 * old `/jeugd/u9` pass-through 404s. Strategy:
 *   1. pass through a token that is already a current slug;
 *   2. otherwise match on age (the structured `age` field, or the age token
 *      appearing as a slug segment) and pick deterministically — a colour
 *      match (`wit`/`groen`) first, else the first team of that age by slug
 *      order. Ambiguous one-to-many cases (a single old URL now split into
 *      colour teams) thus resolve to a stable team rather than 404.
 * Returns `null` when no youth team of that age exists.
 */
export function resolveYouthSlug(
  token: string,
  rows: readonly YouthTeamRow[],
): string | null {
  const lower = token.toLowerCase();
  const teams = rows.filter((row): row is YouthTeamRow & { slug: string } =>
    Boolean(row.slug),
  );

  if (teams.some((team) => team.slug === lower)) return lower;

  const ageToken = lower.match(/^u\d+/)?.[0];
  if (!ageToken) return null;
  const age = ageToken.toUpperCase();
  const segment = new RegExp(`(^|-)${ageToken}(-|$)`);

  const ofAge = teams
    .filter(
      (team) => team.age?.toUpperCase() === age || segment.test(team.slug),
    )
    // Deterministic code-unit order (localeCompare may ignore hyphens by locale).
    .sort((a, b) => Number(a.slug > b.slug) - Number(a.slug < b.slug));
  if (ofAge.length === 0) return null;

  const colour = lower.match(/wit|groen/)?.[0];
  if (colour) {
    const match = ofAge.find((team) => team.slug.includes(colour));
    if (match) return match.slug;
  }
  return ofAge[0].slug;
}

// ─── Cached Sanity reads ─────────────────────────────────────────────────────
// Mappings change rarely (PSD-synced) → 24h tag-bounded cache, same as the
// repository list reads.

const PLAYER_ROWS_QUERY = `*[_type == "player" && defined(psdId) && psdId != ""]{ psdId, firstName, lastName }`;
const STAFF_ROWS_QUERY = `*[_type == "staffMember" && defined(psdId) && psdId != "" && archived != true]{ psdId, firstName, lastName }`;
const YOUTH_TEAMS_QUERY = `*[_type == "team" && archived != true && defined(slug.current) && age match "U*"]{ "slug": slug.current, age }`;

export const fetchPlayerRows = () =>
  fetchGroq<PersonRow[]>(PLAYER_ROWS_QUERY, undefined, {
    revalidate: SANITY_LIST_REVALIDATE,
    tags: [SANITY_TAGS.players],
  });

export const fetchStaffRows = () =>
  fetchGroq<PersonRow[]>(STAFF_ROWS_QUERY, undefined, {
    revalidate: SANITY_LIST_REVALIDATE,
    tags: [SANITY_TAGS.staff],
  });

export const fetchYouthTeamRows = () =>
  fetchGroq<YouthTeamRow[]>(YOUTH_TEAMS_QUERY, undefined, {
    revalidate: SANITY_LIST_REVALIDATE,
    tags: [SANITY_TAGS.teams],
  });
