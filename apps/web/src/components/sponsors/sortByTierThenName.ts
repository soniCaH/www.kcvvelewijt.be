import type { Sponsor } from "./Sponsors";

const TIER_ORDER = { hoofdsponsor: 0, sponsor: 1, sympathisant: 2 } as const;

/**
 * Orders sponsors by tier (hoofdsponsor → sponsor → sympathisant; untiered
 * sorts with the `sponsor` tier) then alphabetically by name (nl locale).
 * Shared by the homepage `<SponsorsBlock>` and the `/sponsors` page so both
 * surfaces present sponsors in the same order.
 */
export function sortByTierThenName(a: Sponsor, b: Sponsor): number {
  const ta = TIER_ORDER[a.tier ?? "sponsor"] ?? 1;
  const tb = TIER_ORDER[b.tier ?? "sponsor"] ?? 1;
  if (ta !== tb) return ta - tb;
  return a.name.localeCompare(b.name, "nl");
}
