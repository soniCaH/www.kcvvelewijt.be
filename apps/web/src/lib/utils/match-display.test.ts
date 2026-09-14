import { describe, it, expect } from "vitest";
import {
  hasScore,
  getScoreDisplay,
  getResultColor,
  isExceptionalMatchStatus,
  isPlayedMatch,
  matchRowKind,
  type MatchRowKindSource,
  isSettledMatch,
  otherClubSide,
  OUTCOME_UNDERLINE,
  reservationView,
  reservationRowLabel,
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

describe("isPlayedMatch", () => {
  it("is true for played statuses", () => {
    for (const status of [
      "finished",
      "forfeited",
      "stopped",
    ] as MatchStatus[]) {
      expect(isPlayedMatch(status)).toBe(true);
    }
  });

  it("is false for unplayed statuses", () => {
    for (const status of [
      "scheduled",
      "postponed",
      "cancelled",
    ] as MatchStatus[]) {
      expect(isPlayedMatch(status)).toBe(false);
    }
  });
});

describe("isSettledMatch", () => {
  it("is true only for statuses whose outcome is final", () => {
    for (const status of ["finished", "forfeited"] as MatchStatus[]) {
      expect(isSettledMatch(status)).toBe(true);
    }
  });

  it("excludes stopped — an abandoned match may be replayed", () => {
    // Narrower than `isPlayedMatch` on purpose: the row still shows an
    // abandoned scoreline, but nothing may headline on it (#2423).
    expect(isPlayedMatch("stopped")).toBe(true);
    expect(isSettledMatch("stopped")).toBe(false);
  });

  it("is false for the remaining statuses", () => {
    for (const status of [
      "scheduled",
      "postponed",
      "cancelled",
    ] as MatchStatus[]) {
      expect(isSettledMatch(status)).toBe(false);
    }
  });
});

describe("isExceptionalMatchStatus", () => {
  it("is false for the two statuses the layout speaks for itself", () => {
    for (const status of ["scheduled", "finished"] as MatchStatus[]) {
      expect(isExceptionalMatchStatus(status)).toBe(false);
    }
  });

  it("is true for every status that needs naming on the row", () => {
    for (const status of [
      "forfeited",
      "postponed",
      "cancelled",
      "stopped",
    ] as MatchStatus[]) {
      expect(isExceptionalMatchStatus(status)).toBe(true);
    }
  });
});

describe("reservationView", () => {
  it("uses the competition label as the subject when present", () => {
    const view = reservationView({
      status: "scheduled",
      competition: "Tornooi",
    });
    expect(view.subject).toBe("Tornooi");
  });

  it("falls back to 'Gereserveerd' when no competition label is sent", () => {
    const view = reservationView({
      status: "scheduled",
      competition: undefined,
    });
    expect(view.subject).toBe("Gereserveerd");
  });

  it("renders the competition label verbatim — no re-casing (PSD's lowercase gotcha, #2606)", () => {
    const view = reservationView({
      status: "scheduled",
      competition: "vriendschappelijk",
    });
    expect(view.subject).toBe("vriendschappelijk");
  });

  it("carries no status marker for scheduled/finished — the layout already speaks for those", () => {
    expect(
      reservationView({ status: "scheduled", competition: "Tornooi" })
        .statusWording,
    ).toBeNull();
    expect(
      reservationView({ status: "finished", competition: "Tornooi" })
        .statusWording,
    ).toBeNull();
  });

  it("names an exceptional status — a reservation can be called off too (#2606)", () => {
    const view = reservationView({
      status: "cancelled",
      competition: "Tornooi",
    });
    expect(view.statusWording).toEqual({
      abbreviation: "CANC",
      longForm: "Geannuleerd",
    });
  });

  describe("otherClub (#2696)", () => {
    it("joins the competition and the club — 'competition · club'", () => {
      const view = reservationView(
        { status: "scheduled", competition: "Tornooi" },
        { name: "FC Zemst Sportief" },
      );
      expect(view.subject).toBe("Tornooi · FC Zemst Sportief");
    });

    it("falls back to 'Gereserveerd · club' when the competition is absent", () => {
      const view = reservationView(
        { status: "scheduled", competition: undefined },
        { name: "FC Zemst Sportief" },
      );
      expect(view.subject).toBe("Gereserveerd · FC Zemst Sportief");
    });

    it("is the competition alone when omitted — the placeholder case", () => {
      const view = reservationView({
        status: "scheduled",
        competition: "Tornooi",
      });
      expect(view.subject).toBe("Tornooi");
    });
  });
});

describe("otherClubSide (#2696, positional since #2802 review)", () => {
  const KCVV_CLUB_ID = 1235;

  it("returns the away side when KCVV is home", () => {
    const home = { id: KCVV_CLUB_ID, name: "KCVV Elewijt" };
    const away = { id: 1391, name: "FC Zemst Sportief" };
    expect(otherClubSide(home, away)).toEqual(away);
  });

  it("returns the home side when KCVV is away — derived from the id, never isHome", () => {
    const home = { id: 1391, name: "FC Zemst Sportief" };
    const away = { id: KCVV_CLUB_ID, name: "KCVV Elewijt" };
    expect(otherClubSide(home, away)).toEqual(home);
  });

  it("works directly on the raw snake_case Match sides — no reshape needed", () => {
    const home_team = { id: KCVV_CLUB_ID, name: "KCVV Elewijt" };
    const away_team = { id: 1391, name: "FC Zemst Sportief" };
    expect(otherClubSide(home_team, away_team)).toEqual(away_team);
  });
});

describe("matchRowKind (#2696, #2802, #2825)", () => {
  function rawMatch(
    overrides: Partial<MatchRowKindSource> = {},
  ): MatchRowKindSource {
    return {
      status: "scheduled",
      home_team: {},
      away_team: {},
      ...overrides,
    };
  }

  it('returns "reservation" when is_placeholder is set — checked before competitionType', () => {
    expect(
      matchRowKind(
        rawMatch({ is_placeholder: true, competitionType: "tournament" }),
      ),
    ).toBe("reservation");
  });

  it('returns "match" for an ordinary league match', () => {
    expect(matchRowKind(rawMatch({ competitionType: "league" }))).toBe("match");
  });

  it('returns "reduced" for an unplayed tournament fixture', () => {
    expect(matchRowKind(rawMatch({ competitionType: "tournament" }))).toBe(
      "reduced",
    );
  });

  it('returns "match" again once a tournament fixture has a result — not merely once it has been played', () => {
    expect(
      matchRowKind(
        rawMatch({
          competitionType: "tournament",
          status: "finished",
          home_team: { score: 3 },
          away_team: { score: 1 },
        }),
      ),
    ).toBe("match");
  });

  it('stays "reduced" for a finished/forfeited/stopped tournament fixture whose scores are missing from the feed', () => {
    for (const status of ["finished", "forfeited", "stopped"] as const) {
      expect(
        matchRowKind(rawMatch({ competitionType: "tournament", status })),
      ).toBe("reduced");
    }
  });

  it("never keys on the Dutch competition label", () => {
    expect(matchRowKind(rawMatch({ competitionType: "league" }))).toBe("match");
  });
});

describe("reservationRowLabel", () => {
  it("composes subject, date and kickoff for a scheduled row", () => {
    const label = reservationRowLabel({
      subject: "Tornooi",
      dateLabel: "9 mei",
      time: "09:30",
      status: "scheduled",
      statusWording: null,
    });
    expect(label).toBe("Tornooi, 9 mei om 09:30");
  });

  it("prefixes the kind word when given and no status marker applies", () => {
    const label = reservationRowLabel({
      kind: "fixture",
      subject: "Tornooi",
      dateLabel: "9 mei",
      time: "09:30",
      status: "scheduled",
      statusWording: null,
    });
    expect(label).toBe("Volgende: Tornooi, 9 mei om 09:30");
  });

  it("drops the kind word when a status marker applies — the sentence must not argue with itself", () => {
    const label = reservationRowLabel({
      kind: "fixture",
      subject: "Tornooi",
      dateLabel: "9 mei",
      time: "09:30",
      status: "cancelled",
      statusWording: { abbreviation: "CANC", longForm: "Geannuleerd" },
    });
    expect(label).not.toContain("Volgende");
    expect(label).toContain("Geannuleerd");
  });

  it("never announces a time for a non-scheduled status", () => {
    const label = reservationRowLabel({
      subject: "Tornooi",
      dateLabel: "9 mei",
      time: "09:30",
      status: "cancelled",
      statusWording: { abbreviation: "CANC", longForm: "Geannuleerd" },
    });
    expect(label).not.toContain("om 09:30");
  });

  it("omits the time segment entirely when none is given", () => {
    const label = reservationRowLabel({
      subject: "Tornooi",
      dateLabel: "9 mei",
      status: "scheduled",
      statusWording: null,
    });
    expect(label).toBe("Tornooi, 9 mei");
  });
});

/**
 * `<MatchStripView>`'s match-day ground reads `OUTCOME_UNDERLINE.dark`
 * (#2616): the light mix reads as a pastel highlighter behind ink text on
 * cream, which disappears behind cream text on that ground. Same keys, same
 * three-outcome tint, mixed toward the dark ground instead of cream.
 *
 * The draw stop is `--color-ink-muted` (#2512/#2656) — the neutral that
 * lands at the same strength as the win/loss mixes either side of it,
 * rather than the win green or the loss brick.
 */
describe("OUTCOME_UNDERLINE (light/dark)", () => {
  it("carries exactly the win/draw/loss keys on both grounds", () => {
    expect(Object.keys(OUTCOME_UNDERLINE.dark).sort()).toEqual(
      Object.keys(OUTCOME_UNDERLINE.light).sort(),
    );
  });

  it("gives a draw its own ink-muted tint on both grounds", () => {
    // `--color-jersey-deep-dark` (the dark ground var itself) contains
    // `--color-jersey-deep` as a substring, so the "not the win hue" check
    // looks for the win mix's closing paren, not the bare fragment.
    expect(OUTCOME_UNDERLINE.light.draw).toContain("--color-ink-muted");
    expect(OUTCOME_UNDERLINE.light.draw).not.toContain("--color-jersey-deep)");
    expect(OUTCOME_UNDERLINE.light.draw).not.toContain("--color-alert");
    expect(OUTCOME_UNDERLINE.dark.draw).toContain("--color-ink-muted");
    expect(OUTCOME_UNDERLINE.dark.draw).not.toContain("--color-jersey-deep)");
    expect(OUTCOME_UNDERLINE.dark.draw).not.toContain("--color-alert");
  });

  it("mixes the light ground's win/loss/draw toward cream", () => {
    expect(OUTCOME_UNDERLINE.light.win).toContain("--color-cream");
    expect(OUTCOME_UNDERLINE.light.loss).toContain("--color-cream");
    expect(OUTCOME_UNDERLINE.light.draw).toContain("--color-cream");
  });

  it("mixes the dark ground's win/loss/draw toward jersey-deep-dark rather than cream", () => {
    expect(OUTCOME_UNDERLINE.dark.win).toContain("--color-jersey-deep-dark");
    expect(OUTCOME_UNDERLINE.dark.win).not.toContain("--color-cream");
    expect(OUTCOME_UNDERLINE.dark.loss).toContain("--color-jersey-deep-dark");
    expect(OUTCOME_UNDERLINE.dark.loss).not.toContain("--color-cream");
    expect(OUTCOME_UNDERLINE.dark.draw).toContain("--color-jersey-deep-dark");
    expect(OUTCOME_UNDERLINE.dark.draw).not.toContain("--color-cream");
  });
});
