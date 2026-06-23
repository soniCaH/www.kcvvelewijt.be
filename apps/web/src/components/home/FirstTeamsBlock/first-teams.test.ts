import { describe, it, expect } from "vitest";
import type { Match } from "@/lib/effect/schemas";
import { deriveFirstTeamVM, firstTeamLabel } from "./first-teams";

describe("firstTeamLabel", () => {
  it("maps trailing-letter first-eleven slugs to X-ploeg", () => {
    expect(firstTeamLabel("eerste-elftallen-a", "Eerste Elftallen A")).toBe(
      "A-ploeg",
    );
    expect(firstTeamLabel("eerste-elftallen-b", "Eerste Elftallen B")).toBe(
      "B-ploeg",
    );
  });

  it("falls back to the CMS name when the slug has no trailing letter", () => {
    expect(firstTeamLabel("fc-weitse-gans", "FC WEITSE GANS")).toBe(
      "FC WEITSE GANS",
    );
  });
});

const NOW = new Date("2026-06-23T12:00:00Z");

/** Minimal structural Match factory — the derive logic only reads these fields. */
function match(p: {
  id: number;
  date: string;
  status: Match["status"];
  isHome?: boolean;
  homeName?: string;
  awayName?: string;
  homeScore?: number;
  awayScore?: number;
  time?: string;
  competition?: string;
}): Match {
  return {
    id: p.id,
    date: new Date(p.date),
    time: p.time,
    home_team: { id: 1, name: p.homeName ?? "Home", score: p.homeScore },
    away_team: { id: 2, name: p.awayName ?? "Away", score: p.awayScore },
    status: p.status,
    competition: p.competition,
    is_home: p.isHome,
  } as unknown as Match;
}

const team = { label: "A-ploeg", slug: "a-ploeg", division: "3de Nationale" };

describe("deriveFirstTeamVM", () => {
  it("picks the most recent played match as the result", () => {
    const vm = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-01T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 1,
          awayScore: 0,
        }),
        match({
          id: 2,
          date: "2026-06-15T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 3,
          awayScore: 1,
        }),
        match({
          id: 3,
          date: "2026-06-08T15:00:00Z",
          status: "finished",
          isHome: false,
          homeScore: 2,
          awayScore: 2,
        }),
      ],
      NOW,
    );
    expect(vm.result?.matchId).toBe(2);
    expect(vm.result?.homeScore).toBe(3);
    expect(vm.result?.awayScore).toBe(1);
  });

  it("picks the earliest upcoming scheduled match as the fixture", () => {
    const vm = deriveFirstTeamVM(
      team,
      [
        match({ id: 10, date: "2026-07-05T15:00:00Z", status: "scheduled" }),
        match({ id: 11, date: "2026-06-29T15:00:00Z", status: "scheduled" }),
      ],
      NOW,
    );
    expect(vm.fixture?.matchId).toBe(11);
  });

  it("ignores future matches for result and past matches for fixture", () => {
    const vm = deriveFirstTeamVM(
      team,
      [
        match({ id: 20, date: "2026-06-29T15:00:00Z", status: "scheduled" }),
        match({
          id: 21,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 0,
          awayScore: 0,
        }),
        // a past scheduled match (data lag) is neither a result nor a fixture
        match({ id: 22, date: "2026-06-01T15:00:00Z", status: "scheduled" }),
      ],
      NOW,
    );
    expect(vm.result?.matchId).toBe(21);
    expect(vm.fixture?.matchId).toBe(20);
  });

  it("computes outcome from KCVV's perspective", () => {
    const homeWin = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 2,
          awayScore: 1,
        }),
      ],
      NOW,
    );
    expect(homeWin.result?.outcome).toBe("win");

    const awayLoss = deriveFirstTeamVM(
      team,
      [
        match({
          id: 2,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: false,
          homeScore: 2,
          awayScore: 0,
        }),
      ],
      NOW,
    );
    expect(awayLoss.result?.outcome).toBe("loss");

    const draw = deriveFirstTeamVM(
      team,
      [
        match({
          id: 3,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 1,
          awayScore: 1,
        }),
      ],
      NOW,
    );
    expect(draw.result?.outcome).toBe("draw");
  });

  it("resolves the fixture opponent from the KCVV side", () => {
    const home = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-29T15:00:00Z",
          status: "scheduled",
          isHome: true,
          homeName: "KCVV",
          awayName: "Hasselt",
        }),
      ],
      NOW,
    );
    expect(home.fixture?.opponent.name).toBe("Hasselt");
    expect(home.fixture?.isHome).toBe(true);

    const away = deriveFirstTeamVM(
      team,
      [
        match({
          id: 2,
          date: "2026-06-29T15:00:00Z",
          status: "scheduled",
          isHome: false,
          homeName: "Overijse",
          awayName: "KCVV",
        }),
      ],
      NOW,
    );
    expect(away.fixture?.opponent.name).toBe("Overijse");
  });

  it("omits result/fixture when absent and never drops the team identity", () => {
    const onlyResult = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
          homeScore: 1,
          awayScore: 0,
        }),
      ],
      NOW,
    );
    expect(onlyResult.result).toBeDefined();
    expect(onlyResult.fixture).toBeUndefined();

    const empty = deriveFirstTeamVM(team, [], NOW);
    expect(empty.result).toBeUndefined();
    expect(empty.fixture).toBeUndefined();
    expect(empty.label).toBe("A-ploeg");
    expect(empty.division).toBe("3de Nationale");
  });

  it("does not compute an outcome when scores or side are missing", () => {
    const noScore = deriveFirstTeamVM(
      team,
      [
        match({
          id: 1,
          date: "2026-06-10T15:00:00Z",
          status: "finished",
          isHome: true,
        }),
      ],
      NOW,
    );
    expect(noScore.result?.outcome).toBeNull();
  });
});
