import type { Match } from "@/lib/effect/schemas/match.schema";

/**
 * A minimal valid raw `Match` — the wire shape as it comes off the BFF,
 * before any adapter (`transformMatchToSchedule`, `transformMatchToCalendar`,
 * `mapMatchToUpcomingMatch`) turns it into a view-model. Overridable per
 * case, mirroring `createMatchDetail` in
 * `apps/web/src/app/(main)/wedstrijd/[matchId]/match-detail.fixtures.ts`.
 *
 * Shared by every match-domain adapter test (`transform.test.ts`,
 * `kalender/utils.test.ts`, `match.mapper.test.ts`) so all three build their
 * raw fixtures from one place instead of near-identical hand-copies that
 * agreed on shape only by convention (#2826).
 */
export function createMatch(overrides: Partial<Match> = {}): Match {
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
