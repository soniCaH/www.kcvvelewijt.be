import { describe, it, expect } from "vitest";
import type { Match, OpponentHistory } from "@kcvv/api-contract";
import {
  buildOpponentPageData,
  matchCountLabel,
  type SquadHistoryResult,
} from "./opponent-data";

const CLUB_ID = 11001;

const A_TEAM = { psdId: "1", squadLabel: "A-ploeg" };
const B_TEAM = { psdId: "2", squadLabel: "B-ploeg" };

function match(p: {
  id: number;
  date: string;
  homeId?: number;
  homeName?: string;
  homeLogo?: string;
  awayId?: number;
  awayName?: string;
}): Match {
  return {
    id: p.id,
    date: new Date(p.date),
    home_team: {
      id: p.homeId ?? 1235,
      name: p.homeName ?? "KCVV Elewijt",
      logo: p.homeLogo,
    },
    away_team: { id: p.awayId ?? CLUB_ID, name: p.awayName ?? "Opponent FC" },
    status: "finished",
    competition: "3e Provinciale A",
    competitionType: "league",
    is_home: true,
  } as unknown as Match;
}

function history(p: {
  wins: number;
  draws: number;
  losses: number;
  matches: Match[];
  opponentName?: string;
  opponentLogo?: string;
}): OpponentHistory {
  return {
    opponent: {
      id: CLUB_ID,
      name: p.opponentName ?? "Opponent FC",
      logo: p.opponentLogo,
    },
    summary: {
      wins: p.wins,
      draws: p.draws,
      losses: p.losses,
      goalsFor: p.wins * 2,
      goalsAgainst: p.losses,
    },
    matches: p.matches,
  } as unknown as OpponentHistory;
}

describe("buildOpponentPageData", () => {
  it("keeps each squad's summary unreduced — no figure is summed across squads", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 4,
          draws: 0,
          losses: 2,
          matches: [match({ id: 1, date: "2026-02-14" })],
        }),
      },
      {
        team: B_TEAM,
        history: history({
          wins: 3,
          draws: 0,
          losses: 2,
          matches: [match({ id: 2, date: "2026-02-15" })],
        }),
      },
    ];

    const data = buildOpponentPageData(CLUB_ID, results);

    expect(data?.sections).toHaveLength(2);
    expect(data?.sections[0]!.summary).toEqual({
      wins: 4,
      draws: 0,
      losses: 2,
      goalsFor: 8,
      goalsAgainst: 2,
    });
    expect(data?.sections[1]!.summary).toEqual({
      wins: 3,
      draws: 0,
      losses: 2,
      goalsFor: 6,
      goalsAgainst: 2,
    });
  });

  it("regression: the two summaries sum to the previous single card's 7-0-4 (#2463)", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 4,
          draws: 0,
          losses: 2,
          matches: [match({ id: 1, date: "2026-02-14" })],
        }),
      },
      {
        team: B_TEAM,
        history: history({
          wins: 3,
          draws: 0,
          losses: 2,
          matches: [match({ id: 2, date: "2026-02-15" })],
        }),
      },
    ];

    const data = buildOpponentPageData(CLUB_ID, results)!;
    const totalWins = data.sections.reduce((s, x) => s + x.summary.wins, 0);
    const totalLosses = data.sections.reduce((s, x) => s + x.summary.losses, 0);
    expect(totalWins).toBe(7);
    expect(totalLosses).toBe(4);
  });

  it("labels each section with the squad's canonical display name, passed through as-is", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 1,
          draws: 0,
          losses: 0,
          matches: [match({ id: 1, date: "2026-02-14" })],
        }),
      },
      {
        team: B_TEAM,
        history: history({
          wins: 1,
          draws: 0,
          losses: 0,
          matches: [match({ id: 2, date: "2026-02-14" })],
        }),
      },
    ];

    const data = buildOpponentPageData(CLUB_ID, results);

    expect(data?.sections[0]!.squadLabel).toBe("A-ploeg");
    expect(data?.sections[1]!.squadLabel).toBe("B-ploeg");
  });

  it("drops a squad that 404'd (history: null) — no section, not an empty one", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 1,
          draws: 0,
          losses: 0,
          matches: [match({ id: 1, date: "2026-02-14" })],
        }),
      },
      { team: B_TEAM, history: null },
    ];

    const data = buildOpponentPageData(CLUB_ID, results);

    expect(data?.sections).toHaveLength(1);
    expect(data?.sections[0]!.squadLabel).toBe("A-ploeg");
  });

  it("drops a squad whose read succeeded with zero matches", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 1,
          draws: 0,
          losses: 0,
          matches: [match({ id: 1, date: "2026-02-14" })],
        }),
      },
      {
        team: B_TEAM,
        history: history({ wins: 0, draws: 0, losses: 0, matches: [] }),
      },
    ];

    const data = buildOpponentPageData(CLUB_ID, results);

    expect(data?.sections).toHaveLength(1);
  });

  it("returns null when no squad has any history — the route's notFound() case", () => {
    const results: SquadHistoryResult[] = [
      { team: A_TEAM, history: null },
      { team: B_TEAM, history: null },
    ];

    expect(buildOpponentPageData(CLUB_ID, results)).toBeNull();
  });

  it("returns null when both squads succeed with zero matches", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({ wins: 0, draws: 0, losses: 0, matches: [] }),
      },
      {
        team: B_TEAM,
        history: history({ wins: 0, draws: 0, losses: 0, matches: [] }),
      },
    ];

    expect(buildOpponentPageData(CLUB_ID, results)).toBeNull();
  });

  it("derives opponent name/logo from the newest match across all squads", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 1,
          draws: 0,
          losses: 0,
          opponentName: "Old Name FC",
          matches: [
            match({
              id: 1,
              date: "2020-01-01",
              awayName: "Old Name FC",
            }),
          ],
        }),
      },
      {
        team: B_TEAM,
        history: history({
          wins: 1,
          draws: 0,
          losses: 0,
          opponentName: "New Name FC",
          matches: [
            match({
              id: 2,
              date: "2026-06-01",
              awayName: "New Name FC",
              awayId: CLUB_ID,
            }),
          ],
        }),
      },
    ];

    const data = buildOpponentPageData(CLUB_ID, results);
    expect(data?.opponentName).toBe("New Name FC");
  });

  it("sorts each section's own matches newest-first", () => {
    const results: SquadHistoryResult[] = [
      {
        team: A_TEAM,
        history: history({
          wins: 2,
          draws: 0,
          losses: 0,
          matches: [
            match({ id: 1, date: "2024-01-01" }),
            match({ id: 2, date: "2026-01-01" }),
          ],
        }),
      },
    ];

    const data = buildOpponentPageData(CLUB_ID, results);
    expect(data?.sections[0]!.matches.map((m) => m.id)).toEqual([2, 1]);
  });
});

describe("matchCountLabel", () => {
  it("is singular at exactly one", () => {
    expect(matchCountLabel(1)).toBe("1 wedstrijd");
  });

  it("is plural at zero and above one", () => {
    expect(matchCountLabel(0)).toBe("0 wedstrijden");
    expect(matchCountLabel(2)).toBe("2 wedstrijden");
  });
});
