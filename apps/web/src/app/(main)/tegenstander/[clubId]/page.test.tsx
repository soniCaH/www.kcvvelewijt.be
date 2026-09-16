/**
 * `/tegenstander/[clubId]` — pins two acceptance criteria from #2463 that
 * only a rendered DOM can prove: heading levels descend without a
 * same-level collision (`h1` hero → `h2` squad → `h3` match count, never a
 * second `h2`), and every landmark on the page has a unique accessible
 * name (each squad `<section>` is its own landmark; season sub-groups are
 * plain `<div>`s, not a second, colliding landmark per season).
 *
 * Mocking shape mirrors `/ploegen/[slug]/page.test.tsx`: `TeamRepositoryLive`
 * and `BffServiceLive` replaced via `vi.mock`, `react`'s `cache()` made a
 * no-op so `fetchOpponentData`'s memoization doesn't leak between cases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { HttpNotFound } from "@kcvv/api-contract";
import type { Match } from "@kcvv/api-contract";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import { RESERVEN_PSD_ID } from "@/lib/utils/group-teams";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

const { mockFindAll, mockGetOpponentHistory } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockGetOpponentHistory: vi.fn(),
}));

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...actual,
    TeamRepositoryLive: Layer.succeed(actual.TeamRepository, {
      findAll: mockFindAll,
      findBySlug: () => Effect.die("not used by this suite"),
      findAllForLanding: () => Effect.succeed([]),
      findByMemberId: () => Effect.succeed([]),
    }),
  };
});

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: () => Effect.die("not used by this suite"),
      getNextMatches: () => Effect.succeed([]),
      getMatchesWindow: () => Effect.succeed([]),
      getMatchDetail: () => Effect.die("not used by this suite"),
      getRanking: () => Effect.die("not used by this suite"),
      getRelated: () => Effect.succeed([]),
      getOpponentHistory: mockGetOpponentHistory,
      getPlayerStats: () => Effect.die("not used by this suite"),
    }),
  };
});

import OpponentPage from "./page";

const CLUB_ID = 11001;

const A_TEAM: TeamNavVM = {
  id: "team-a",
  name: "KCVV Elewijt A",
  displayName: "A-ploeg",
  slug: "eerste-elftallen-a",
  age: "A",
  psdId: "1",
  division: null,
  divisionFull: null,
  teamImageUrl: null,
};

const B_TEAM: TeamNavVM = {
  ...A_TEAM,
  id: "team-b",
  name: "KCVV Elewijt B",
  displayName: "B-ploeg",
  slug: "eerste-elftallen-b",
  psdId: "2",
};

// Present in findAll() the same way production Sanity is (#2463's own
// regression) — proves selectSeniorTeams keeps Reserven off this page
// without a section, a caption or a query ever reaching it.
const RESERVEN_TEAM: TeamNavVM = {
  ...A_TEAM,
  id: "team-reserven",
  name: "KCVV Elewijt Reserven",
  displayName: "Reserven",
  slug: "reserven",
  psdId: RESERVEN_PSD_ID,
};

function match(id: number, date: string): Match {
  return {
    id,
    date: new Date(date),
    home_team: { id: 1235, name: "KCVV Elewijt" },
    away_team: { id: CLUB_ID, name: "Opponent FC" },
    status: "finished",
    competition: "3e Provinciale A",
    competitionType: "league",
    is_home: true,
  } as unknown as Match;
}

function history(wins: number, matchList: Match[]) {
  return {
    opponent: { id: CLUB_ID, name: "Opponent FC" },
    summary: { wins, draws: 0, losses: 0, goalsFor: wins * 2, goalsAgainst: 0 },
    matches: matchList,
  };
}

describe("/tegenstander/[clubId] renders one section per senior squad (#2463)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFindAll.mockReset();
    mockGetOpponentHistory.mockReset();
    mockFindAll.mockReturnValue(
      Effect.succeed([A_TEAM, B_TEAM, RESERVEN_TEAM]),
    );
  });

  it("descends h1 hero -> h2 squad -> h3 match count, never a second h2", async () => {
    mockGetOpponentHistory.mockImplementation((teamId: number) => {
      if (teamId === 1)
        return Effect.succeed(history(4, [match(1, "2026-02-14")]));
      if (teamId === 2)
        return Effect.succeed(history(3, [match(2, "2026-02-15")]));
      return Effect.fail(new HttpNotFound({ error: "unknown" }));
    });

    const element = await OpponentPage({
      params: Promise.resolve({ clubId: String(CLUB_ID) }),
    });
    render(element);

    const h1s = screen.getAllByRole("heading", { level: 1 });
    const h2s = screen.getAllByRole("heading", { level: 2 });
    const h3s = screen.getAllByRole("heading", { level: 3 });

    expect(h1s).toHaveLength(1);
    expect(h2s).toHaveLength(2);
    expect(h2s.map((h) => h.textContent)).toEqual(["A-ploeg.", "B-ploeg."]);
    expect(h3s).toHaveLength(2);

    // Reserven never reaches the page: no third section, no query for it.
    expect(mockGetOpponentHistory).not.toHaveBeenCalledWith(
      Number(RESERVEN_PSD_ID),
      CLUB_ID,
    );
    expect(screen.queryByText(/Reserven/)).not.toBeInTheDocument();
  });

  it("gives every landmark a unique accessible name", async () => {
    // Both squads met this opponent in the SAME season — the exact
    // collision the old per-season <section aria-label={seasonLabel}>
    // produced once a second squad existed.
    mockGetOpponentHistory.mockImplementation((teamId: number) => {
      if (teamId === 1)
        return Effect.succeed(history(1, [match(1, "2026-02-14")]));
      if (teamId === 2)
        return Effect.succeed(history(1, [match(2, "2026-02-20")]));
      return Effect.fail(new HttpNotFound({ error: "unknown" }));
    });

    const element = await OpponentPage({
      params: Promise.resolve({ clubId: String(CLUB_ID) }),
    });
    render(element);

    const landmarkNames = screen
      .getAllByRole("region")
      .map((el) => el.getAttribute("aria-label"));

    expect(landmarkNames).toEqual(["A-ploeg", "B-ploeg"]);
    expect(new Set(landmarkNames).size).toBe(landmarkNames.length);
  });

  it("renders exactly one disambiguated summary card per squad", async () => {
    mockGetOpponentHistory.mockImplementation((teamId: number) => {
      if (teamId === 1)
        return Effect.succeed(history(4, [match(1, "2026-02-14")]));
      if (teamId === 2)
        return Effect.succeed(history(3, [match(2, "2026-02-15")]));
      return Effect.fail(new HttpNotFound({ error: "unknown" }));
    });

    const element = await OpponentPage({
      params: Promise.resolve({ clubId: String(CLUB_ID) }),
    });
    render(element);

    expect(screen.getByTestId("opponent-summary-1")).toHaveTextContent("4");
    expect(screen.getByTestId("opponent-summary-2")).toHaveTextContent("3");
    expect(screen.queryByTestId("opponent-summary")).not.toBeInTheDocument();
  });

  it("renders exactly one section when only one squad has history", async () => {
    mockGetOpponentHistory.mockImplementation((teamId: number) => {
      if (teamId === 1)
        return Effect.succeed(history(1, [match(1, "2026-02-14")]));
      return Effect.fail(new HttpNotFound({ error: "unknown" }));
    });

    const element = await OpponentPage({
      params: Promise.resolve({ clubId: String(CLUB_ID) }),
    });
    render(element);

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByTestId("opponent-summary-1")).toBeInTheDocument();
  });
});
