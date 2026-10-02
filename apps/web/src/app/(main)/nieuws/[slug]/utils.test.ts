import { describe, expect, it } from "vitest";
import type { MatchDetail } from "@kcvv/api-contract";
import type { HeroMatchData } from "@/components/article/EditorialHero";
import type { PortableTextBlock } from "@portabletext/react";
import { parsePsdMatchId, splitArticleBody, toHeroMatchData } from "./utils";

/** `toHeroMatchData` returns `null` for a reservation (#2802) — every test
 *  below feeds it a genuine two-sided match, so narrow the nullable return
 *  once here rather than an `if (!data) throw` at each call site. */
function assertHero(data: HeroMatchData | null): HeroMatchData {
  if (!data) throw new Error("expected hero match data");
  return data;
}

// Plain-object cast mirrors the wedstrijd/[matchId] utils test fixture —
// toHeroMatchData only reads fields, so a structural object is sufficient.
function makeMatch(overrides: Partial<MatchDetail> = {}): MatchDetail {
  return {
    id: 12345,
    date: new Date("2026-09-13T15:00:00Z"),
    time: "15:00",
    venue: "Driesstraat",
    home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png", score: 2 },
    away_team: {
      id: 999,
      name: "Racing Mechelen",
      logo: "racing.png",
      score: 1,
    },
    status: "finished",
    competition: "3e Provinciale",
    is_home: true,
    hasReport: true,
    ...overrides,
  } as MatchDetail;
}

describe("toHeroMatchData", () => {
  it("maps home/away teams, score, competition and kickoff", () => {
    const data = assertHero(toHeroMatchData(makeMatch()));
    expect(data.homeTeam).toEqual({ name: "KCVV Elewijt", logo: "kcvv.png" });
    expect(data.awayTeam).toEqual({
      name: "Racing Mechelen",
      logo: "racing.png",
    });
    expect(data.homeScore).toBe(2);
    expect(data.awayScore).toBe(1);
    expect(data.kickoffTime).toBe("15:00");
    expect(data.competition).toBe("3e Provinciale");
    expect(data.status).toBe("finished");
  });

  it("derives kcvvSide from is_home when present (teamId-driven, never name-based)", () => {
    expect(
      assertHero(toHeroMatchData(makeMatch({ is_home: true }))).kcvvSide,
    ).toBe("home");
    expect(
      assertHero(toHeroMatchData(makeMatch({ is_home: false }))).kcvvSide,
    ).toBe("away");
  });

  it("falls back to the KCVV club id when is_home is absent (getMatchDetail)", () => {
    // getMatchDetail leaves is_home null — derive from the club id (1235).
    const homeKcvv = assertHero(
      toHeroMatchData(
        makeMatch({
          is_home: undefined,
          home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
          away_team: { id: 999, name: "Racing Mechelen", logo: "r.png" },
        }),
      ),
    );
    expect(homeKcvv.kcvvSide).toBe("home");

    const awayKcvv = assertHero(
      toHeroMatchData(
        makeMatch({
          is_home: undefined,
          home_team: { id: 999, name: "Racing Mechelen", logo: "r.png" },
          away_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
        }),
      ),
    );
    expect(awayKcvv.kcvvSide).toBe("away");
  });

  it("leaves kcvvSide undefined when neither side is KCVV and is_home is absent", () => {
    const data = assertHero(
      toHeroMatchData(
        makeMatch({
          is_home: undefined,
          home_team: { id: 111, name: "Team A", logo: "a.png" },
          away_team: { id: 222, name: "Team B", logo: "b.png" },
        }),
      ),
    );
    expect(data.kcvvSide).toBeUndefined();
  });

  it("formats the match date as a compact Dutch widget date", () => {
    // 2026-09-13 is a Sunday → "Zo 13 september".
    expect(assertHero(toHeroMatchData(makeMatch())).matchDate).toBe(
      "Zo 13 september",
    );
  });

  // Spelled `Date.UTC(…)`, the way the BFF builds a match date from PSD's
  // Belgian local kickoff string — an offset-less `new Date("…T19:45:00")` is
  // read as *local* time, a shape no source emits, and it is exactly what made
  // reading the date with `getHours()` look correct (#2601).
  it("derives kickoff from the date when `time` is absent (shared extractMatchTime)", () => {
    const data = assertHero(
      toHeroMatchData(
        makeMatch({
          time: undefined,
          date: new Date(Date.UTC(2026, 8, 13, 19, 45)),
        }),
      ),
    );
    expect(data.kickoffTime).toBe("19:45");
  });

  it("leaves kickoffTime undefined when `time` is absent and the date has no time component", () => {
    const data = assertHero(
      toHeroMatchData(
        makeMatch({
          time: undefined,
          date: new Date(Date.UTC(2026, 8, 13, 0, 0)),
        }),
      ),
    );
    expect(data.kickoffTime).toBeUndefined();
  });

  it("leaves scores undefined for an unplayed (preview) match", () => {
    const data = assertHero(
      toHeroMatchData(
        makeMatch({
          status: "scheduled",
          home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
          away_team: { id: 999, name: "Racing Mechelen", logo: "racing.png" },
        }),
      ),
    );
    expect(data.homeScore).toBeUndefined();
    expect(data.awayScore).toBeUndefined();
    expect(data.kickoffTime).toBe("15:00");
  });

  it("returns null for a pitch-reservation placeholder — no opponent to put on either side of the score bar (#2606/#2802)", () => {
    const placeholder = makeMatch({
      is_placeholder: true,
      home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
      away_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
      status: "scheduled",
      competition: "Tornooi",
    });
    expect(toHeroMatchData(placeholder)).toBeNull();
  });

  it("returns null for a tournament fixture with no result yet — an unconfirmed opponent, not a settled two-crest match (#2696/#2802 review)", () => {
    const pending = makeMatch({
      is_placeholder: false,
      competitionType: "tournament",
      status: "scheduled",
      home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
      away_team: { id: 99, name: "FC Zemst Sportief", logo: "zemst.png" },
      competition: "Tornooi",
    });
    expect(toHeroMatchData(pending)).toBeNull();
  });

  it("returns the ordinary hero data once a tournament fixture has a result (#2696 review)", () => {
    const played = makeMatch({
      is_placeholder: false,
      competitionType: "tournament",
      status: "finished",
      home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png", score: 3 },
      away_team: {
        id: 99,
        name: "FC Zemst Sportief",
        logo: "zemst.png",
        score: 1,
      },
      competition: "Tornooi",
    });
    const data = assertHero(toHeroMatchData(played));
    expect(data.awayTeam.name).toBe("FC Zemst Sportief");
    expect(data.homeScore).toBe(3);
    expect(data.awayScore).toBe(1);
  });
});

describe("parsePsdMatchId", () => {
  it("accepts a positive integer id", () => {
    expect(parsePsdMatchId("12345")).toBe(12345);
  });

  it.each([
    ["zero", "0"],
    ["a negative id", "-1"],
    ["a fractional id", "12.5"],
    ["a value past MAX_SAFE_INTEGER", "9007199254740993"],
    ["a non-numeric value", "abc"],
    ["an empty string", ""],
    ["null", null],
    ["undefined", undefined],
  ])("returns null for %s, so getMatchDetail is never called", (_, input) => {
    expect(parsePsdMatchId(input)).toBeNull();
  });
});

describe("splitArticleBody (#2531)", () => {
  const para = (text: string, key = `p-${text}`): PortableTextBlock => ({
    _type: "block",
    _key: key,
    style: "normal",
    children: [{ _type: "span", _key: `s-${key}`, text, marks: [] }],
    markDefs: [],
  });
  const tailQa = (key: string): PortableTextBlock =>
    ({
      _type: "qaBlock",
      _key: key,
      groupAtTail: true,
      pairs: [],
    }) as unknown as PortableTextBlock;
  const transferFact = (key: string): PortableTextBlock =>
    ({
      _type: "transferFact",
      _key: key,
      playerName: "Bocar Sarr",
    }) as unknown as PortableTextBlock;

  it("a null or empty body renders neither shell nor tail, so the credits carry the gap", () => {
    for (const body of [null, []]) {
      const r = splitArticleBody(body, undefined);
      expect(r.rendersArticleBody).toBe(false);
      expect(r.hasTail).toBe(false);
      expect(r.endGapOwnedAbove).toBe(false);
    }
  });

  it("a body with renderable prose renders the shell, and EndMark owns the gap", () => {
    const r = splitArticleBody([para("Tekst.")], undefined);
    expect(r.rendersArticleBody).toBe(true);
    expect(r.endGapOwnedAbove).toBe(true);
  });

  it("a body that is only the hoisted eventFact skips the shell and leaves the gap to the credits", () => {
    const r = splitArticleBody([transferFact("ev-1")], "ev-1");
    expect(r.bodyInFlow).toEqual([]);
    expect(r.rendersArticleBody).toBe(false);
    expect(r.endGapOwnedAbove).toBe(false);
  });

  it("only empty paragraphs after the hoist also skip the shell", () => {
    const r = splitArticleBody([para(""), transferFact("ev-1")], "ev-1");
    expect(r.rendersArticleBody).toBe(false);
    expect(r.endGapOwnedAbove).toBe(false);
  });

  it("a body that is only tail Q&A skips the shell but the tail section still owns the gap", () => {
    const r = splitArticleBody([tailQa("qa-1")], undefined);
    expect(r.rendersArticleBody).toBe(false);
    expect(r.hasTail).toBe(true);
    expect(r.tailBlocks).toHaveLength(1);
    expect(r.endGapOwnedAbove).toBe(true);
  });

  it("keeps in-flow prose and tail Q&A apart", () => {
    const r = splitArticleBody([para("Tekst."), tailQa("qa-1")], undefined);
    expect(r.rendersArticleBody).toBe(true);
    expect(r.hasTail).toBe(true);
    expect(r.bodyInFlow).toHaveLength(1);
  });
});
