import type { Sponsor } from "./Sponsors";

// Marquee selection order. NOTE this deliberately differs from
// `sortByTierThenName` (which buckets untiered sponsors WITH `sponsor`): the
// 7.d2 lock + PRD Phase 2 put untiered sponsors LAST for the "In de kijker"
// pick.
const TIER_RANK = { hoofdsponsor: 0, sponsor: 1, sympathisant: 2 } as const;
const UNTIERED_RANK = 3;

function rank(sponsor: Sponsor): number {
  return sponsor.tier ? TIER_RANK[sponsor.tier] : UNTIERED_RANK;
}

/**
 * Picks the single sponsor to feature in the `/sponsors` hero marquee
 * ("In de kijker"). The pool is the sponsors flagged `featured`; within the
 * pool the winner is the highest tier first
 * (`hoofdsponsor` → `sponsor` → `sympathisant` → untiered last), then `name`
 * (`localeCompare("nl")`).
 *
 * Returns `null` when no sponsor is featured — the hero then collapses to a
 * full-width headline (7.d2 lock). The selected sponsor still appears in its
 * tier grid below; deliberate double-emphasis, no dedup.
 */
export function selectFeaturedSponsor(sponsors: Sponsor[]): Sponsor | null {
  const featured = sponsors.filter((sponsor) => sponsor.featured === true);
  if (featured.length === 0) return null;

  return featured.reduce((best, candidate) => {
    const bestRank = rank(best);
    const candidateRank = rank(candidate);
    if (candidateRank !== bestRank) {
      return candidateRank < bestRank ? candidate : best;
    }
    return candidate.name.localeCompare(best.name, "nl") < 0 ? candidate : best;
  });
}
