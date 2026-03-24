import { describe, it, expect } from "vitest";
import {
  hasScore,
  getScoreDisplay,
  getStatusColor,
  getResultColor,
} from "./match-display";
import type { MatchStatus } from "@/lib/effect/schemas/match.schema";

interface MinimalMatch {
  home_team: { score?: number };
  away_team: { score?: number };
  status: MatchStatus;
}

function createMatch(overrides: Partial<MinimalMatch> = {}): MinimalMatch {
  return {
    home_team: { score: 2 },
    away_team: { score: 1 },
    status: "finished",
    ...overrides,
  };
}

describe("hasScore", () => {
  it("returns true for finished match with both scores", () => {
    expect(hasScore(createMatch())).toBe(true);
  });

  it("returns true for forfeited match with both scores", () => {
    expect(hasScore(createMatch({ status: "forfeited" }))).toBe(true);
  });

  it("returns false when home score is undefined", () => {
    expect(hasScore(createMatch({ home_team: { score: undefined } }))).toBe(
      false,
    );
  });

  it("returns false when away score is undefined", () => {
    expect(hasScore(createMatch({ away_team: { score: undefined } }))).toBe(
      false,
    );
  });

  it("returns false for scheduled match even with scores", () => {
    expect(hasScore(createMatch({ status: "scheduled" }))).toBe(false);
  });

  it("returns false for postponed match", () => {
    expect(hasScore(createMatch({ status: "postponed" }))).toBe(false);
  });

  it("returns false for stopped match", () => {
    expect(hasScore(createMatch({ status: "stopped" }))).toBe(false);
  });

  it("returns true when scores are zero", () => {
    expect(
      hasScore(
        createMatch({
          home_team: { score: 0 },
          away_team: { score: 0 },
        }),
      ),
    ).toBe(true);
  });
});

describe("getScoreDisplay", () => {
  it("returns score type with values for finished match", () => {
    expect(getScoreDisplay(createMatch())).toEqual({
      type: "score",
      home: 2,
      away: 1,
    });
  });

  it("returns vs type for scheduled match", () => {
    expect(getScoreDisplay(createMatch({ status: "scheduled" }))).toEqual({
      type: "vs",
    });
  });

  it("returns vs type when scores are missing", () => {
    expect(
      getScoreDisplay(
        createMatch({
          home_team: { score: undefined },
          away_team: { score: undefined },
        }),
      ),
    ).toEqual({ type: "vs" });
  });

  it("returns score for forfeited match with scores", () => {
    expect(getScoreDisplay(createMatch({ status: "forfeited" }))).toEqual({
      type: "score",
      home: 2,
      away: 1,
    });
  });

  it("returns vs for postponed match", () => {
    expect(getScoreDisplay(createMatch({ status: "postponed" }))).toEqual({
      type: "vs",
    });
  });
});

describe("getStatusColor", () => {
  it("returns 'green' for finished", () => {
    expect(getStatusColor("finished")).toBe("green");
  });

  it("returns 'orange' for postponed", () => {
    expect(getStatusColor("postponed")).toBe("orange");
  });

  it("returns 'orange' for stopped", () => {
    expect(getStatusColor("stopped")).toBe("orange");
  });

  it("returns 'gray' for forfeited", () => {
    expect(getStatusColor("forfeited")).toBe("gray");
  });

  it("returns 'blue' for scheduled", () => {
    expect(getStatusColor("scheduled")).toBe("blue");
  });
});

describe("getResultColor", () => {
  it("returns 'win' when home team wins and isHome", () => {
    expect(getResultColor(3, 1, true)).toBe("win");
  });

  it("returns 'loss' when home team wins but isHome is false", () => {
    expect(getResultColor(3, 1, false)).toBe("loss");
  });

  it("returns 'draw' when scores are equal", () => {
    expect(getResultColor(2, 2, true)).toBe("draw");
  });

  it("returns 'draw' regardless of isHome when scores equal", () => {
    expect(getResultColor(2, 2, false)).toBe("draw");
  });

  it("returns 'loss' when away team wins and isHome", () => {
    expect(getResultColor(0, 3, true)).toBe("loss");
  });

  it("returns 'win' when away team wins and not isHome", () => {
    expect(getResultColor(0, 3, false)).toBe("win");
  });

  it("handles 0-0 draw", () => {
    expect(getResultColor(0, 0, true)).toBe("draw");
  });
});
