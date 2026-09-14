import type { CompetitionType, MatchStatus } from "@kcvv/api-contract";

/**
 * The club's own ground, spelled once (#2491). Truthful, geocodable as an
 * ICS `LOCATION`, and a valid schema.org `Place` name — the form a parent
 * driving there actually needs (#2398). The single source for a MATCH
 * venue in `apps/api`; every read path stamps a fixture's `venue` by
 * calling {@link resolveVenue} rather than restating the string.
 *
 * Not the only spelling of this street address anywhere in `apps/api` —
 * `apps/api/src/forms/membership-emails.ts` carries the same address in a
 * membership-signup email footer, unrelated page copy in a different
 * domain (predates #2491, deliberately left alone by it). That is a
 * different fact ("where the club's postal address is") from this one
 * ("where a match is played"); the two happen to coincide today only
 * because the club plays at its own registered address.
 */
export const CLUB_VENUE = "Sportpark Elewijt, Driesstraat 32, 1982 Elewijt";

/**
 * The fields {@link resolveVenue} needs to tell a genuine fixture apart from
 * a pitch-reservation placeholder or an unconfirmed tournament fixture.
 * Mirrors the "match" branch of `matchRowKind()`
 * (`apps/web/src/lib/utils/match-display.ts`) without importing across the
 * app boundary — `apps/api` and `apps/web` share no runtime code, only the
 * `@kcvv/api-contract` types this shape is built from.
 */
export interface VenueFixtureContext {
  isPlaceholder?: boolean;
  competitionType?: CompetitionType;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}

const PLAYED_OR_STOPPED_STATUSES = new Set<MatchStatus>([
  "finished",
  "forfeited",
  "stopped",
]);

/**
 * Whether `fixture` is a genuine match rather than a pitch-reservation
 * placeholder (#2606) or a tournament fixture with no result yet (#2696,
 * #2802 review). Being listed as the home side says nothing about whether an
 * unconfirmed reservation or tournament entry is actually played at the
 * club's own pitch, so neither claims the venue.
 */
function isRealFixture(fixture: VenueFixtureContext): boolean {
  if (fixture.isPlaceholder) return false;
  if (fixture.competitionType !== "tournament") return true;
  return (
    PLAYED_OR_STOPPED_STATUSES.has(fixture.status) &&
    typeof fixture.homeScore === "number" &&
    typeof fixture.awayScore === "number"
  );
}

/**
 * The single place a fixture's `venue` is decided in the BFF (#2491). The
 * club's ground when — and only when — `isHome` resolved to exactly `true`
 * (never mere truthiness: `undefined` means neither derivation resolved,
 * and a match whose home/away side is unknown must not claim our ground)
 * and `fixture` is a genuine match ({@link isRealFixture}). `undefined`
 * otherwise — never an empty string — so every consumer's existing
 * "render only when present" gate (the ICS `LOCATION` line, the JSON-LD
 * `Place`, `MatchHero`, the homepage caption) keeps working unchanged.
 *
 * Every BFF read path calls this rather than hardcoding `venue: undefined`
 * or re-deriving home/away from a team name.
 */
export function resolveVenue(
  isHome: boolean | undefined,
  fixture: VenueFixtureContext,
): string | undefined {
  return isHome === true && isRealFixture(fixture) ? CLUB_VENUE : undefined;
}
