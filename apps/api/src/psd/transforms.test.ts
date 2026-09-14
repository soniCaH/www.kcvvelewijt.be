import { describe, it, expect } from "vitest";
import {
  mapGameStatus,
  isUnknownGameStatus,
  mapCompetitionLabel,
  resolveCompetitionType,
  buildCompetitionLabelMap,
  deriveMatchTeamLabel,
  deriveOwnClubId,
  isSelfMatch,
  transformPsdGame,
  transformFootbalistoMatchDetail,
  transformFootbalistoRankingEntry,
  stripPsdName,
  normaliseClubName,
  psdGameToMs,
} from "./transforms";
import type { PsdGame, PsdCompetition } from "./schemas";
import { CLUB_VENUE } from "./venue";

describe("resolveCompetitionType", () => {
  const obj = (type: string): PsdGame["competitionType"] =>
    ({ id: 1, name: null, type }) as PsdGame["competitionType"];

  it("maps OFFICIAL (PSD's league code) to 'league'", () => {
    expect(resolveCompetitionType(obj("OFFICIAL"))).toBe("league");
  });

  it("maps LEAGUE synonym to 'league'", () => {
    expect(resolveCompetitionType(obj("LEAGUE"))).toBe("league");
  });

  it("maps CUP to 'cup' and FRIENDLY to 'friendly'", () => {
    expect(resolveCompetitionType(obj("CUP"))).toBe("cup");
    expect(resolveCompetitionType(obj("FRIENDLY"))).toBe("friendly");
  });

  it("maps TOURNAMENT to 'tournament'", () => {
    expect(resolveCompetitionType(obj("TOURNAMENT"))).toBe("tournament");
  });

  it("maps an object type with no member of its own to 'other'", () => {
    expect(resolveCompetitionType(obj("INTERNATIONAL"))).toBe("other");
  });

  it("maps a plain-string (inlined match-detail label) to 'other'", () => {
    // The /games/{id}/info endpoint returns a resolved display string like
    // "Croky Cup"/"Competitie" — unclassifiable without banned label-matching.
    expect(resolveCompetitionType("Competitie")).toBe("other");
    expect(resolveCompetitionType("Croky Cup")).toBe("other");
  });

  it("maps null/undefined to 'other'", () => {
    expect(resolveCompetitionType(null)).toBe("other");
    expect(resolveCompetitionType(undefined)).toBe("other");
  });
});

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

  it("returns 'cancelled' when cancelled regardless of status (PSD code 0)", () => {
    expect(mapGameStatus(0, 3, 1, true)).toBe("cancelled");
  });

  it("falls back to 'scheduled' for unknown status code", () => {
    expect(mapGameStatus(99, null, null)).toBe("scheduled");
  });

  it("returns 'cancelled' for unknown status code when cancelled", () => {
    expect(mapGameStatus(99, null, null, true)).toBe("cancelled");
  });

  it("distinguishes 'cancelled' (cancelled flag) from 'postponed' (PSD code 2)", () => {
    expect(mapGameStatus(0, null, null, true)).toBe("cancelled");
    expect(mapGameStatus(2, null, null, false)).toBe("postponed");
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
    expect(detail.is_placeholder).toBeUndefined();
  });

  it("marks a self-match as a placeholder — the detail endpoint needs no team context, unlike is_home", () => {
    const detail = transformFootbalistoMatchDetail({
      general: {
        id: 202,
        date: "2026-03-15 15:00",
        homeClub: club,
        awayClub: club,
        goalsHomeTeam: null,
        goalsAwayTeam: null,
        status: 0,
        viewGameReport: false,
      },
    } as never);
    expect(detail.is_placeholder).toBe(true);
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

describe("isSelfMatch (#2606)", () => {
  // The AC mandates the derivation be "guarded so that both ids being null
  // or undefined does not read as a self-match" — kept even though
  // `PsdGame`'s club ids are non-nullable at the type level, since the guard
  // is the acceptance criterion, not a workaround for a type gap.
  it.each([
    [1235, 1235, true, "equal ids"],
    [1235, 456, false, "different ids"],
    [null, null, false, "both null"],
    [undefined, undefined, false, "both undefined"],
    [null, 1235, false, "only the away id present"],
    [1235, undefined, false, "only the home id present"],
  ] as const)("(%s, %s) → %s — %s", (home, away, expected, _label) => {
    expect(isSelfMatch(home, away)).toBe(expected);
  });
});

describe("transformPsdGame — is_placeholder (#2606)", () => {
  it("marks a self-match as a placeholder", () => {
    const game = makePsdGame({
      homeClub: { id: 1235, name: "KCVV Elewijt" },
      awayClub: { id: 1235, name: "KCVV Elewijt" },
    });
    expect(transformPsdGame(game).is_placeholder).toBe(true);
  });

  it("leaves is_placeholder undefined (not false) for a normal fixture, so the sparse JSON drops the key", () => {
    const game = makePsdGame({
      homeClub: { id: 1235, name: "KCVV Elewijt" },
      awayClub: { id: 456, name: "FC Other" },
    });
    expect(transformPsdGame(game).is_placeholder).toBeUndefined();
  });
});

describe("transformPsdGame — venue (#2491)", () => {
  it("stamps the club's own ground for a home fixture (is_home: true)", () => {
    const game = makePsdGame({ teamId: 7, homeTeamId: 7 });
    expect(transformPsdGame(game).is_home).toBe(true);
    expect(transformPsdGame(game).venue).toBe(CLUB_VENUE);
  });

  it("carries no venue for an away fixture (is_home: false)", () => {
    const game = makePsdGame({ teamId: 7, homeTeamId: 3, awayTeamId: 7 });
    expect(transformPsdGame(game).is_home).toBe(false);
    expect(transformPsdGame(game).venue).toBeUndefined();
  });

  it("carries no venue when is_home is unresolved (undefined) — never treated as home", () => {
    const game = makePsdGame();
    expect(transformPsdGame(game).is_home).toBeUndefined();
    expect(transformPsdGame(game).venue).toBeUndefined();
  });

  it("never claims the ground for a pitch-reservation placeholder, even when is_home resolves true", () => {
    const game = makePsdGame({
      teamId: 7,
      homeTeamId: 7,
      homeClub: { id: 1235, name: "KCVV Elewijt" },
      awayClub: { id: 1235, name: "KCVV Elewijt" },
    });
    expect(transformPsdGame(game).is_placeholder).toBe(true);
    expect(transformPsdGame(game).venue).toBeUndefined();
  });

  it("never claims the ground for an unconfirmed tournament fixture with no result yet", () => {
    const game = makePsdGame({
      teamId: 7,
      homeTeamId: 7,
      competitionType: { id: 9, name: null, type: "TOURNAMENT" } as never,
      goalsHomeTeam: null,
      goalsAwayTeam: null,
    });
    expect(transformPsdGame(game).venue).toBeUndefined();
  });
});

describe("mapCompetitionLabel", () => {
  describe("prefers PSD name over type-code mapping for all types", () => {
    it("uses name for LEAGUE when available", () => {
      expect(mapCompetitionLabel("LEAGUE", "3de Nationale")).toBe(
        "3de Nationale",
      );
    });

    it("uses name for OFFICIAL when available", () => {
      expect(mapCompetitionLabel("OFFICIAL", "3de Provinciale C")).toBe(
        "3de Provinciale C",
      );
    });

    it("uses name for CUP when available", () => {
      expect(mapCompetitionLabel("CUP", "Beker van Brabant")).toBe(
        "Beker van Brabant",
      );
    });

    it("uses name for FRIENDLY when available", () => {
      expect(mapCompetitionLabel("FRIENDLY", "Oefenwedstrijd")).toBe(
        "Oefenwedstrijd",
      );
    });

    it("uses name for TOURNAMENT when available", () => {
      expect(mapCompetitionLabel("TOURNAMENT", "Paastornooi")).toBe(
        "Paastornooi",
      );
    });

    it("uses name for INTERNATIONAL when available", () => {
      expect(mapCompetitionLabel("INTERNATIONAL", "UEFA Nations League")).toBe(
        "UEFA Nations League",
      );
    });

    it("ignores whitespace-only name", () => {
      expect(mapCompetitionLabel("OFFICIAL", "   ")).toBe("Competitie");
    });
  });

  describe("falls back to Dutch label when name is absent", () => {
    it("maps LEAGUE to 'Competitie'", () => {
      expect(mapCompetitionLabel("LEAGUE", null)).toBe("Competitie");
    });

    it("maps OFFICIAL to 'Competitie'", () => {
      expect(mapCompetitionLabel("OFFICIAL", null)).toBe("Competitie");
    });

    it("maps CUP to 'Beker'", () => {
      expect(mapCompetitionLabel("CUP", null)).toBe("Beker");
    });

    it("maps FRIENDLY to 'Vriendschappelijk'", () => {
      expect(mapCompetitionLabel("FRIENDLY", null)).toBe("Vriendschappelijk");
    });

    it("maps TOURNAMENT to 'Tornooi'", () => {
      expect(mapCompetitionLabel("TOURNAMENT", null)).toBe("Tornooi");
    });

    it("maps INTERNATIONAL to 'Internationaal'", () => {
      expect(mapCompetitionLabel("INTERNATIONAL", null)).toBe("Internationaal");
    });

    it("falls back to raw type for truly unknown codes", () => {
      expect(mapCompetitionLabel("SOMETHING_NEW", null)).toBe("SOMETHING_NEW");
    });
  });

  it("is case-insensitive on the type code", () => {
    expect(mapCompetitionLabel("official", null)).toBe("Competitie");
    expect(mapCompetitionLabel("Official", null)).toBe("Competitie");
  });
});

describe("buildCompetitionLabelMap", () => {
  const comp = (
    id: number,
    overrides: Partial<PsdCompetition> = {},
  ): PsdCompetition =>
    ({ id, type: "CUP", name: null, ...overrides }) as PsdCompetition;

  it("resolves the Dutch label from labelTranslations (cups have null name)", () => {
    const map = buildCompetitionLabelMap([
      comp(9, {
        labelTranslations: [
          { language: "fr", value: "Coupe du Brabant" },
          { language: "nl", value: "Beker van Brabant" },
          { language: "vls", value: "Beker van Brabant" },
        ],
      }),
      comp(11, {
        labelTranslations: [{ language: "nl", value: "Croky Cup" }],
      }),
    ]);
    expect(map).toEqual({ 9: "Beker van Brabant", 11: "Croky Cup" });
  });

  it("prefers nl, then falls back to vls", () => {
    const map = buildCompetitionLabelMap([
      comp(12, {
        labelTranslations: [{ language: "vls", value: "Beker van Vlaanderen" }],
      }),
    ]);
    expect(map[12]).toBe("Beker van Vlaanderen");
  });

  it("falls back to `name` when no translations are present", () => {
    const map = buildCompetitionLabelMap([
      comp(3, { type: "FRIENDLY", name: "vriendschappelijk" }),
    ]);
    expect(map[3]).toBe("vriendschappelijk");
  });

  it("omits competitions with neither a translation nor a name", () => {
    const map = buildCompetitionLabelMap([comp(1, { type: "OFFICIAL" })]);
    expect(map).toEqual({});
  });
});

describe("deriveMatchTeamLabel", () => {
  it("returns alpha opponent designations verbatim", () => {
    expect(deriveMatchTeamLabel("A")).toBe("A");
    expect(deriveMatchTeamLabel("B")).toBe("B");
    expect(deriveMatchTeamLabel("U23")).toBe("U23");
    expect(deriveMatchTeamLabel("U21")).toBe("U21");
  });

  it("omits the club's own numeric team code", () => {
    expect(deriveMatchTeamLabel("1")).toBeUndefined();
    expect(deriveMatchTeamLabel("2")).toBeUndefined();
    expect(deriveMatchTeamLabel("21")).toBeUndefined();
  });

  it("omits null / undefined / blank codes", () => {
    expect(deriveMatchTeamLabel(null)).toBeUndefined();
    expect(deriveMatchTeamLabel(undefined)).toBeUndefined();
    expect(deriveMatchTeamLabel("  ")).toBeUndefined();
  });
});

describe("transformPsdGame — competition label + team designation", () => {
  it("resolves a cup's specific name via the competition-label map", () => {
    const game = makePsdGame({
      competitionType: {
        id: 9,
        name: null,
        type: "CUP",
      } as PsdGame["competitionType"],
    });
    const match = transformPsdGame(game, {
      competitionLabels: { 9: "Beker van Brabant" },
    });
    expect(match.competition).toBe("Beker van Brabant");
  });

  it("falls back to the generic label when the cup id is not in the map", () => {
    const game = makePsdGame({
      competitionType: {
        id: 9,
        name: null,
        type: "CUP",
      } as PsdGame["competitionType"],
    });
    expect(transformPsdGame(game).competition).toBe("Beker");
    expect(transformPsdGame(game, { competitionLabels: {} }).competition).toBe(
      "Beker",
    );
  });

  it("surfaces the normalized competitionType from the season-games object form", () => {
    // League play carries a division name in `competition` (not "Competitie"),
    // so list consumers must gate on the structured `competitionType` instead.
    const league = makePsdGame({
      competitionType: {
        id: 5,
        name: "3de Nationale",
        type: "OFFICIAL",
      } as PsdGame["competitionType"],
    });
    const leagueMatch = transformPsdGame(league);
    expect(leagueMatch.competition).toBe("3de Nationale");
    expect(leagueMatch.competitionType).toBe("league");

    const cup = makePsdGame({
      competitionType: {
        id: 9,
        name: null,
        type: "CUP",
      } as PsdGame["competitionType"],
    });
    expect(transformPsdGame(cup).competitionType).toBe("cup");
  });

  it("attaches the opponent team designation, omitting the own numeric code", () => {
    // KCVV (home, code "1") vs opponent away "U23"
    const match = transformPsdGame(
      makePsdGame({ homeTeam: "1", awayTeam: "U23" }),
    );
    expect(match.home_team.team_label).toBeUndefined();
    expect(match.away_team.team_label).toBe("U23");
  });

  it("leaves team_label undefined when codes are absent", () => {
    const match = transformPsdGame(makePsdGame());
    expect(match.home_team.team_label).toBeUndefined();
    expect(match.away_team.team_label).toBeUndefined();
  });
});

// ─── Club-name casing ────────────────────────────────────────────────────────

describe("normaliseClubName", () => {
  it("uppercases federation prefixes", () => {
    expect(normaliseClubName("Ksc Blankenberge")).toBe("KSC Blankenberge");
    expect(normaliseClubName("Kfc Eppegem")).toBe("KFC Eppegem");
    expect(normaliseClubName("Kvk Ieper")).toBe("KVK Ieper");
    expect(normaliseClubName("K Sp Amicii Tange")).toBe("K SP Amicii Tange");
    expect(normaliseClubName("Kws Club Lauwe")).toBe("KWS Club Lauwe");
  });

  it("uppercases a prefix wherever it sits in the name", () => {
    expect(normaliseClubName("Yellow Red Kv Mechelen")).toBe(
      "Yellow Red KV Mechelen",
    );
    expect(normaliseClubName("Peutie Fc")).toBe("Peutie FC");
  });

  it("capitalises after a hyphen", () => {
    expect(normaliseClubName("Erpe-mere United")).toBe("Erpe-Mere United");
    expect(normaliseClubName("Kvv St-denijs Sport")).toBe(
      "KVV St-Denijs Sport",
    );
  });

  it("fixes our own club, including the legacy spaced spelling", () => {
    expect(normaliseClubName("Kcvv Elewijt")).toBe("KCVV Elewijt");
    expect(normaliseClubName("K c v v Elewijt")).toBe("KCVV Elewijt");
  });

  it("leaves ordinary words alone", () => {
    expect(normaliseClubName("Yellow Red Mechelen")).toBe(
      "Yellow Red Mechelen",
    );
    expect(normaliseClubName("Football Club Gullegem")).toBe(
      "Football Club Gullegem",
    );
  });

  it("is idempotent on already-correct names", () => {
    expect(normaliseClubName("KCVV Elewijt")).toBe("KCVV Elewijt");
    expect(normaliseClubName("KSC Blankenberge")).toBe("KSC Blankenberge");
  });
});

describe("transformPsdGame / …MatchDetail / …RankingEntry — club-name casing", () => {
  it("normalises both club names on a game", () => {
    const match = transformPsdGame(
      makePsdGame({
        homeClub: { id: 1235, name: "Kcvv Elewijt" },
        awayClub: { id: 2, name: "Ksc Blankenberge" },
      }),
    );
    expect(match.home_team.name).toBe("KCVV Elewijt");
    expect(match.away_team.name).toBe("KSC Blankenberge");
  });

  it("normalises both club names on a match detail", () => {
    const detail = transformFootbalistoMatchDetail({
      general: {
        id: 200,
        date: "2026-03-15 15:00",
        homeClub: { id: 1235, name: "Kcvv Elewijt" },
        awayClub: { id: 2, name: "Kfc Eppegem" },
        goalsHomeTeam: 2,
        goalsAwayTeam: 1,
        status: 0,
        viewGameReport: true,
      },
    } as never);
    expect(detail.home_team.name).toBe("KCVV Elewijt");
    expect(detail.away_team.name).toBe("KFC Eppegem");
  });

  it("normalises the RESOLVED ranking name, not just one branch", () => {
    // localName wins over name — the normaliser must see the resolved value.
    const withLocal = transformFootbalistoRankingEntry(
      {
        rank: 1,
        team: {
          id: 9,
          club: { id: 2, localName: "Kvk Ieper", name: "Ignored" },
        },
      } as never,
      "https://cdn.example.com",
    );
    expect(withLocal.team_name).toBe("KVK Ieper");

    // …and the `name` fallback is normalised too.
    const withoutLocal = transformFootbalistoRankingEntry(
      {
        rank: 2,
        team: { id: 10, club: { id: 3, localName: null, name: "Ksv Rumbeke" } },
      } as never,
      "https://cdn.example.com",
    );
    expect(withoutLocal.team_name).toBe("KSV Rumbeke");
  });
});

describe("stripPsdName", () => {
  // Every string below was read off `/teams/{id}/ranking` on 2026-08-16 —
  // all 23 competitions the association publishes for this club today.
  it.each([
    [
      "Voetbal : Voetbal Vlaanderen - 3de Afdeling Voetb Vl A",
      "3de Afdeling Voetb Vl A",
    ],
    [
      "Voetbal : Voetbal Vlaanderen - 4 Provinciaal Vl Brab C",
      "4 Provinciaal Vl Brab C",
    ],
    [
      "Voetbal : Voetbal Vlaanderen - Reserven Voetb Vl AH",
      "Reserven Voetb Vl AH",
    ],
    ["Voetbal : Voetbal Vlaanderen - Gewestelijk U13 BJ", "Gewestelijk U13 BJ"],
    // A different bond in the prefix.
    ["Voetbal : Nationale - Croky Cup - Hommes", "Croky Cup"],
    // Hyphens inside the reeks name survive — the prefix stops at the first one.
    [
      "Voetbal : Voetbal Vlaanderen - 1e Ploegen 3-4 Prov - Hommes",
      "1e Ploegen 3-4 Prov",
    ],
    [
      "Voetbal : Voetbal Vlaanderen - B v Brab Heren B-ploegen",
      "B v Brab Heren B-ploegen",
    ],
    // Not observed yet, but the women's suffix is specced alongside Hommes.
    [
      "Voetbal : Voetbal Vlaanderen - Gewestelijk U13 BJ - Femmes",
      "Gewestelijk U13 BJ",
    ],
  ])("strips %s", (raw, expected) => {
    expect(stripPsdName(raw)).toBe(expected);
  });

  it("returns the input unchanged when neither pattern matches", () => {
    expect(stripPsdName("3e Nationale VV A")).toBe("3e Nationale VV A");
    expect(stripPsdName("Gewestelijk U13")).toBe("Gewestelijk U13");
  });

  it("never blanks a name — a bare prefix falls back to the raw string", () => {
    expect(stripPsdName("Voetbal : Voetbal Vlaanderen - ")).toBe(
      "Voetbal : Voetbal Vlaanderen - ",
    );
  });
});
