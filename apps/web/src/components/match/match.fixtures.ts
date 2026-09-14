import type { Match } from "@/lib/effect/schemas/match.schema";

/**
 * A minimal valid raw `Match` — the wire shape as it comes off the BFF,
 * before any adapter (`transformMatchToSchedule`, `transformMatchToCalendar`,
 * `mapMatchToUpcomingMatch`) turns it into a view-model. Overridable per
 * case, mirroring `createMatchDetail` in
 * `apps/web/src/app/(main)/wedstrijd/[matchId]/match-detail.fixtures.ts`.
 *
 * Named `createRawMatch`, not `createMatch` — `match-display.test.ts:23`
 * already has an unrelated local `createMatch` returning a structural
 * `MinimalMatch` (`{ home_team, away_team, status }`), not this wire shape.
 * Both live in the match domain and both would read as
 * `createMatch({ status: "finished" })` at the call site, so the name
 * collision is a real trap for a future reader/agent who assumes they're
 * the same thing. Do not rename `match-display.test.ts`'s local one to
 * match — that file is a different, narrower consumer and out of scope
 * here.
 *
 * Built from today's three consumers (`transform.test.ts`,
 * `kalender/utils.test.ts` via its suite-local `createTestMatch` wrapper,
 * `match.mapper.test.ts`) — do not read this list as exhaustive. A fourth
 * hand-copied raw-`Match` literal, `fixtureMatch()` in
 * `apps/web/src/app/(main)/ploegen/[slug]/TeamDetail.stories.tsx`
 * (#2636 competitive-block gate stories), was found during #2826 review and
 * deliberately left un-migrated: those stories back live VR baselines, and
 * this branch shipped in a parallel wave where a baseline capture from one
 * branch can overwrite another's. Left for a later, non-wave branch.
 *
 * **Defaults are a public contract, not an implementation detail — widen
 * with care.** `transform.test.ts` asserts three *absences* against a bare
 * `createRawMatch()`: `is_placeholder` (normalizes to `kind: "match"` when
 * absent, #2688), `is_home` (leaves `isHome` undefined when absent) and
 * `competitionType` (leaves it undefined when absent). None of those three
 * keys may be added to the defaults below without checking those tests
 * first — doing so makes them vacuously pass or fail, and a vacuous test is
 * worse than a failing one because nothing flags it. If a future consumer
 * needs one of those three set, pass it as an override at the call site,
 * don't add it here.
 */
export function createRawMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 123,
    date: new Date("2025-02-15T15:00:00"),
    time: "15:00",
    home_team: {
      id: 1,
      name: "KCVV Elewijt",
      logo: "https://example.com/kcvv.png",
      score: 2,
    },
    away_team: {
      id: 2,
      name: "FC Opponent",
      logo: "https://example.com/opponent.png",
      score: 1,
    },
    status: "finished",
    competition: "3e Nationale",
    ...overrides,
  } as Match;
}
