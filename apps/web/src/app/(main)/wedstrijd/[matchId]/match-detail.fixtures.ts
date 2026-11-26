import type { MatchDetail } from "@/lib/effect/schemas/match.schema";

/**
 * A minimal valid `MatchDetail`, overridable per case. Shared by
 * `utils.test.ts` and `apps/web/src/app/__tests__/failed-read-boundaries.test.ts`
 * so both `/wedstrijd/[matchId]` suites build the same base fixture instead of
 * two hand-copies of the same literal shape.
 */
export const createMatchDetail = (
  overrides: Partial<MatchDetail> = {},
): MatchDetail => {
  return {
    id: 12345,
    date: new Date("2025-12-07T15:00:00"),
    home_team: { id: 1, name: "KCVV Elewijt" },
    away_team: { id: 2, name: "KFC Turnhout" },
    status: "scheduled",
    hasReport: false,
    ...overrides,
  } as MatchDetail;
};
