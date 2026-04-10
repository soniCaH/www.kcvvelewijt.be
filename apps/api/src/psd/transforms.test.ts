import { describe, it, expect } from "vitest";
import {
  mapGameStatus,
  isUnknownGameStatus,
  mapCompetitionLabel,
  deriveOwnClubId,
  transformPsdGame,
  transformFootbalistoMatchDetail,
  psdGameToMs,
} from "./transforms";
import type { PsdGame } from "./schemas";

describe("mapGameStatus", () => {
  it("returns 'finished' for status 0 with goals", () => {
    expect(mapGameStatus(0, 3, 1)).toBe("finished");
  });

  it("returns 'scheduled' for status 0 with no goals", () => {
    expect(mapGameStatus(0, null, null)).toBe("scheduled");
  });

  it("returns 'forfeited' for status 1", () => {
    expect(mapGameStatus(1, null, null)).toBe("forfeited");
  });

  it("returns 'postponed' for status 2", () => {
    expect(mapGameStatus(2, null, null)).toBe("postponed");
  });

  it("returns 'stopped' for status 3", () => {
    expect(mapGameStatus(3, null, null)).toBe("stopped");
  });

  it("returns 'postponed' when cancelled regardless of status", () => {
    expect(mapGameStatus(0, 3, 1, true)).toBe("postponed");
  });

  it("falls back to 'scheduled' for unknown status code", () => {
    expect(mapGameStatus(99, null, null)).toBe("scheduled");
  });

  it("returns 'postponed' for unknown status code when cancelled", () => {
    expect(mapGameStatus(99, null, null, true)).toBe("postponed");
  });
});

describe("isUnknownGameStatus", () => {
  it("returns false for known codes 0–3", () => {
    expect(isUnknownGameStatus(0)).toBe(false);
    expect(isUnknownGameStatus(1)).toBe(false);
    expect(isUnknownGameStatus(2)).toBe(false);
    expect(isUnknownGameStatus(3)).toBe(false);
  });

  it("returns true for unknown codes", () => {
    expect(isUnknownGameStatus(99)).toBe(true);
    expect(isUnknownGameStatus(-1)).toBe(true);
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const club = { id: 1, name: "FC Test" };

function makePsdGame(overrides: Partial<PsdGame> = {}): PsdGame {
  return {
    id: 100,
    status: 0,
    date: "2026-03-15 00:00",
    time: "15:00",
    goalsHomeTeam: null,
    goalsAwayTeam: null,
    homeClub: club,
    awayClub: { id: 2, name: "FC Other" },
    ...overrides,
  } as PsdGame;
}

// ─── Date validation via public APIs ─────────────────────────────────────────

describe("psdGameToMs — strict date validation", () => {
  it("accepts a valid date", () => {
    expect(() => psdGameToMs(makePsdGame())).not.toThrow();
  });

  it("rejects a rolled-over day (Feb 30 → Mar 2)", () => {
    expect(() =>
      psdGameToMs(makePsdGame({ date: "2026-02-30 00:00", time: "15:00" })),
    ).toThrow("Invalid date string");
  });

  it("rejects month 13", () => {
    expect(() =>
      psdGameToMs(makePsdGame({ date: "2026-13-01 00:00", time: "15:00" })),
    ).toThrow("Invalid date string");
  });

  it("rejects hour 25", () => {
    expect(() =>
      psdGameToMs(makePsdGame({ date: "2026-03-15 00:00", time: "25:00" })),
    ).toThrow("Invalid date string");
  });

  it("rejects minute 60", () => {
    expect(() =>
      psdGameToMs(makePsdGame({ date: "2026-03-15 00:00", time: "15:60" })),
    ).toThrow("Invalid date string");
  });
});

describe("transformPsdGame — strict date validation", () => {
  it("returns a Match for a valid game", () => {
    const match = transformPsdGame(makePsdGame());
    expect(match.id).toBe(100);
    expect(match.status).toBe("scheduled");
  });

  it("throws on rolled-over date (Jan 32 → Feb 1)", () => {
    expect(() =>
      transformPsdGame(makePsdGame({ date: "2026-01-32 00:00" })),
    ).toThrow("Invalid date string");
  });

  it("throws on month 0", () => {
    expect(() =>
      transformPsdGame(makePsdGame({ date: "2026-00-15 00:00" })),
    ).toThrow("Invalid date string");
  });
});

describe("transformFootbalistoMatchDetail — strict date validation", () => {
  it("returns a MatchDetail for a valid response", () => {
    const detail = transformFootbalistoMatchDetail({
      general: {
        id: 200,
        date: "2026-03-15 15:00",
        homeClub: club,
        awayClub: { id: 2, name: "FC Other" },
        goalsHomeTeam: 2,
        goalsAwayTeam: 1,
        status: 0,
        viewGameReport: true,
      },
    } as never);
    expect(detail.id).toBe(200);
    expect(detail.status).toBe("finished");
  });

  it("throws on rolled-over date (Apr 31 → May 1)", () => {
    expect(() =>
      transformFootbalistoMatchDetail({
        general: {
          id: 201,
          date: "2026-04-31 15:00",
          homeClub: club,
          awayClub: { id: 2, name: "FC Other" },
          goalsHomeTeam: null,
          goalsAwayTeam: null,
          status: 0,
          viewGameReport: false,
        },
      } as never),
    ).toThrow("Invalid date string");
  });
});

describe("deriveOwnClubId", () => {
  const kcvv = { id: 1235, name: "KCVV Elewijt" };
  const opponentA = { id: 456, name: "FC Opponent A" };
  const opponentB = { id: 789, name: "FC Opponent B" };

  it("returns the common club ID from two games", () => {
    const games = [
      makePsdGame({ homeClub: kcvv, awayClub: opponentA }),
      makePsdGame({ homeClub: opponentB, awayClub: kcvv }),
    ];
    expect(deriveOwnClubId(games)).toBe(1235);
  });

  it("detects own club when always away", () => {
    const games = [
      makePsdGame({ homeClub: opponentA, awayClub: kcvv }),
      makePsdGame({ homeClub: opponentB, awayClub: kcvv }),
    ];
    expect(deriveOwnClubId(games)).toBe(1235);
  });

  it("detects own club when always home", () => {
    const games = [
      makePsdGame({ homeClub: kcvv, awayClub: opponentA }),
      makePsdGame({ homeClub: kcvv, awayClub: opponentB }),
    ];
    expect(deriveOwnClubId(games)).toBe(1235);
  });

  it("handles same opponent in first two games (cup home-and-away)", () => {
    const games = [
      makePsdGame({ homeClub: kcvv, awayClub: opponentA }),
      makePsdGame({ homeClub: opponentA, awayClub: kcvv }),
    ];
    expect(deriveOwnClubId(games)).toBe(1235);
  });

  it("returns undefined for fewer than 2 games", () => {
    expect(deriveOwnClubId([])).toBeUndefined();
    expect(deriveOwnClubId([makePsdGame()])).toBeUndefined();
  });
});

describe("transformPsdGame — ownClubId fallback for is_home", () => {
  it("uses ownClubId when homeTeamId is absent", () => {
    const game = makePsdGame({
      homeClub: { id: 1235, name: "KCVV Elewijt" },
      awayClub: { id: 456, name: "FC Other" },
    });
    const match = transformPsdGame(game, { ownClubId: 1235 });
    expect(match.is_home).toBe(true);
  });

  it("detects away via ownClubId when homeTeamId is absent", () => {
    const game = makePsdGame({
      homeClub: { id: 456, name: "FC Other" },
      awayClub: { id: 1235, name: "KCVV Elewijt" },
    });
    const match = transformPsdGame(game, { ownClubId: 1235 });
    expect(match.is_home).toBe(false);
  });

  it("prefers homeTeamId over ownClubId when both available", () => {
    const game = makePsdGame({
      teamId: 7,
      homeTeamId: 7,
      homeClub: { id: 1235, name: "KCVV Elewijt" },
      awayClub: { id: 456, name: "FC Other" },
    });
    const match = transformPsdGame(game, { ownClubId: 1235 });
    expect(match.is_home).toBe(true);
  });

  it("is_home undefined without ownClubId or homeTeamId", () => {
    const game = makePsdGame();
    const match = transformPsdGame(game);
    expect(match.is_home).toBeUndefined();
  });
});

describe("mapCompetitionLabel", () => {
  it("maps LEAGUE to 'Competitie'", () => {
    expect(mapCompetitionLabel("LEAGUE", "3de Nationale")).toBe("Competitie");
  });

  it("maps CUP to the PSD name when available", () => {
    expect(mapCompetitionLabel("CUP", "Beker van Brabant")).toBe(
      "Beker van Brabant",
    );
  });

  it("maps CUP to 'Beker' when name is null", () => {
    expect(mapCompetitionLabel("CUP", null)).toBe("Beker");
  });

  it("maps FRIENDLY to 'Vriendschappelijk'", () => {
    expect(mapCompetitionLabel("FRIENDLY", null)).toBe("Vriendschappelijk");
  });

  it("uses name for unknown types when available", () => {
    expect(mapCompetitionLabel("OFFICIAL", "3de Provinciale C")).toBe(
      "3de Provinciale C",
    );
  });

  it("falls back to raw type for OFFICIAL without name", () => {
    expect(mapCompetitionLabel("OFFICIAL", null)).toBe("OFFICIAL");
  });

  it("falls back to raw type for unknown types without name", () => {
    expect(mapCompetitionLabel("INTERLAND", null)).toBe("INTERLAND");
  });
});
