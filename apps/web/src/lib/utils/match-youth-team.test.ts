import { describe, it, expect } from "vitest";
import {
  aiTeamResult,
  hasYouthHint,
  matchYouthTeams,
  youthTeamAges,
  type YouthTeamMatchResult,
  type YouthTeamSource,
} from "./match-youth-team";
import { seasonStartYear } from "./season";

const team = (
  slug: string,
  age: string,
  extra: Partial<YouthTeamSource> = {},
): YouthTeamSource => ({ _id: slug, slug, name: slug, age, ...extra });

/** A roster shaped like production (2026–27). `kcvve-u16` carries PSD age U17. */
const TEAMS: YouthTeamSource[] = [
  team("eerste-elftallen-a", "A"),
  team("eerste-elftallen-b", "A"),
  team("reserven", "A"),
  team("kcvve-u5", "U5"),
  team("kcvve-u6", "U6"),
  team("kcvve-u7", "U7"),
  team("kcvve-u7-wit", "U7", { archived: true }),
  team("kcvve-u8-wit", "U8"),
  team("kcvve-u8-groen", "U8"),
  team("kcvve-u9", "U9"),
  team("kcvve-u10", "U10"),
  team("kcvve-u10p", "U10"),
  team("kcvve-u11", "U11"),
  team("kcvve-u12", "U12"),
  team("kcvve-u13", "U13"),
  team("kcvve-u14", "U14"),
  team("kcvve-u15", "U15"),
  team("kcvve-u16", "U17"),
  team("kcvve-u17", "U17"),
  team("kcvve-u19", "U19"),
  team("kcvve-u21", "U21"),
];

/** Mid-season 2026–27, so Y = 2026. */
const NOW = new Date("2026-10-18T12:00:00Z");

const run = (query: string, now = NOW) =>
  matchYouthTeams(query, TEAMS, seasonStartYear(now), now.getFullYear());

/** Flatten to `code: slug, slug` lines — readable in a failure diff. */
const summary = (result: YouthTeamMatchResult) =>
  result.bands.flatMap((b) =>
    b.matches.map(
      (m) => `U${m.category}: ${m.teams.map((t) => t.slug).join(", ")}`,
    ),
  );

const onlyMatch = (result: YouthTeamMatchResult) => {
  const all = result.bands.flatMap((b) => b.matches);
  expect(all).toHaveLength(1);
  return all[0];
};

describe("matchYouthTeams", () => {
  it('"U12" → U12, Middenbouw, by u-code', () => {
    const result = run("U12");
    expect(result.bands.map((b) => b.band)).toEqual(["Middenbouw"]);
    expect(onlyMatch(result)).toMatchObject({
      kind: "u-code",
      category: 12,
      birthYear: null,
      nextTeamUp: false,
      lateBornAlternative: null,
    });
    expect(summary(result)).toEqual(["U12: kcvve-u12"]);
  });

  it('"u 12" → U12 (any case, optional space)', () => {
    expect(summary(run("u 12"))).toEqual(["U12: kcvve-u12"]);
  });

  it('"vraag over de U8" → both U8 teams, Onderbouw', () => {
    const result = run("vraag over de U8");
    expect(result.bands.map((b) => b.band)).toEqual(["Onderbouw"]);
    expect(summary(result)).toEqual(["U8: kcvve-u8-wit, kcvve-u8-groen"]);
  });

  it('"U8 wit" → only the U8 Wit team', () => {
    expect(summary(run("U8 wit"))).toEqual(["U8: kcvve-u8-wit"]);
  });

  it('"U10P" → only U10P; a bare "U10" → U10 and U10P', () => {
    expect(summary(run("U10P"))).toEqual(["U10: kcvve-u10p"]);
    expect(summary(run("u10"))).toEqual(["U10: kcvve-u10, kcvve-u10p"]);
    expect(run("U10P").bands[0].band).toBe("Middenbouw");
  });

  it('"U16" hits the U16 team by its slug, though PSD gives it age U17', () => {
    const result = run("U16");
    expect(summary(result)).toEqual(["U16: kcvve-u16"]);
    expect(result.bands[0].band).toBe("Bovenbouw");
  });

  it('"miniemen" → U12 and U13 by old name', () => {
    const result = run("miniemen");
    expect(summary(result)).toEqual(["U12: kcvve-u12", "U13: kcvve-u13"]);
    expect(result.bands.flatMap((b) => b.matches.map((m) => m.kind))).toEqual([
      "old-name",
      "old-name",
    ]);
    expect(result.bands[0].matches.map((m) => m.oldName)).toEqual([
      "miniemen",
      "miniemen",
    ]);
  });

  it('"preminiemen" is not read as "miniemen"', () => {
    expect(summary(run("preminiemen"))).toEqual([
      "U10: kcvve-u10, kcvve-u10p",
      "U11: kcvve-u11",
    ]);
  });

  it('"mijn zoon is 8 jaar, wie moet ik contacteren?" → U9 (2018) and U10 (2017)', () => {
    const result = run("mijn zoon is 8 jaar, wie moet ik contacteren?");
    const matches = result.bands.flatMap((b) => b.matches);
    expect(
      matches.map((m) => [m.category, m.birthYear, m.kind, m.band]),
    ).toEqual([
      [9, 2018, "age", "Onderbouw"],
      [10, 2017, "age", "Middenbouw"],
    ]);
    expect(matches.map((m) => m.age)).toEqual([8, 8]);
    // Late-born is a birth-year rule only.
    expect(matches.every((m) => m.lateBornAlternative === null)).toBe(true);
  });

  it("an age in spring reads the calendar year: 8 in March 2027 is born 2019 (U8) or 2018 (U9)", () => {
    const result = run(
      "mijn zoon is 8 jaar",
      new Date("2027-03-15T12:00:00+01:00"),
    );
    expect(
      result.bands.flatMap((b) =>
        b.matches.map((m) => [m.category, m.birthYear]),
      ),
    ).toEqual([
      [8, 2019],
      [9, 2018],
    ]);
  });

  it.each(["kan ik u 15 minuten bellen", "mag ik u 12 vragen stellen?"])(
    'the polite "u" is no U-code: %j',
    (query) => {
      expect(run(query).bands).toEqual([]);
    },
  );

  it('a spaced "u 12" still counts when it ends the query', () => {
    expect(summary(run("vraag over de u 12?"))).toEqual(["U12: kcvve-u12"]);
  });

  it('"is <n>" is no age when a time or unit follows: "het is 10 uur"', () => {
    expect(run("het is 10 uur").bands).toEqual([]);
    expect(run("de training is 10.30").bands).toEqual([]);
  });

  it('"is <n>" still reads as an age when the clause ends: "mijn zoon is 8, wie..."', () => {
    expect(summary(run("mijn zoon is 8, wie moet ik bellen?"))).toEqual([
      "U9: kcvve-u9",
      "U10: kcvve-u10, kcvve-u10p",
    ]);
  });

  it('"8-jarige" reads as an age too', () => {
    expect(summary(run("onze 8-jarige"))).toEqual([
      "U9: kcvve-u9",
      "U10: kcvve-u10, kcvve-u10p",
    ]);
  });

  it('"mijn dochter is geboren in 2018, welke ploeg is dat?" → U9, late-born U8', () => {
    const match = onlyMatch(
      run("mijn dochter is geboren in 2018, welke ploeg is dat?"),
    );
    expect(match).toMatchObject({
      kind: "birth-year",
      category: 9,
      birthYear: 2018,
      band: "Onderbouw",
      nextTeamUp: false,
    });
    expect(match.lateBornAlternative?.category).toBe(8);
    expect(match.lateBornAlternative?.teams.map((t) => t.slug)).toEqual([
      "kcvve-u8-wit",
      "kcvve-u8-groen",
    ]);
  });

  it("late-born alternative skips P teams (born 2016 → U11, alt U10 only)", () => {
    const match = onlyMatch(run("van 2016"));
    expect(match.lateBornAlternative?.teams.map((t) => t.slug)).toEqual([
      "kcvve-u10",
    ]);
  });

  it("late-born alternative stops above U17 (born 2009 → none)", () => {
    expect(onlyMatch(run("geboren in 2009")).lateBornAlternative).toBeNull();
  });

  it('"geboren in 2009" → U18 does not exist, so U19 flagged nextTeamUp', () => {
    const match = onlyMatch(run("geboren in 2009"));
    expect(match).toMatchObject({
      kind: "birth-year",
      category: 19,
      birthYear: 2009,
      band: "Bovenbouw",
      nextTeamUp: true,
      requestedCategory: 18,
    });
    expect(match.teams.map((t) => t.slug)).toEqual(["kcvve-u19"]);
  });

  it('"U18" → the U19, still naming the asked U18', () => {
    expect(onlyMatch(run("U18"))).toMatchObject({
      category: 19,
      requestedCategory: 18,
      nextTeamUp: true,
      age: null,
      oldName: null,
    });
  });

  it('"A-ploeg" → no team, and no number to report', () => {
    expect(run("A-ploeg")).toEqual({ bands: [], unmatchedNumber: false });
  });

  it('"pupillen" → no team', () => {
    expect(run("pupillen")).toEqual({ bands: [], unmatchedNumber: false });
  });

  it("a number that matches nothing is reported", () => {
    expect(run("geboren in 1980")).toEqual({
      bands: [],
      unmatchedNumber: true,
    });
  });

  it("season boundary: 30 June is still the old season, 1 July the new one", () => {
    // Born 2018: in 2025–26 that is U8, in 2026–27 U9.
    const june = onlyMatch(
      run("geboren in 2018", new Date("2026-06-30T12:00:00+02:00")),
    );
    const july = onlyMatch(
      run("geboren in 2018", new Date("2026-07-01T12:00:00+02:00")),
    );
    expect(june.category).toBe(8);
    expect(july.category).toBe(9);
  });

  it("season boundary is read in Belgian time (1 July 00:30 CEST is still 30 June UTC)", () => {
    const match = onlyMatch(
      run("geboren in 2018", new Date("2026-06-30T22:30:00Z")),
    );
    expect(match.category).toBe(9);
  });

  it("never returns an archived team", () => {
    expect(summary(run("U7 wit"))).toEqual(["U7: kcvve-u7"]);
  });

  it("U5 counts as Onderbouw on this card", () => {
    const result = run("U5");
    expect(result.bands.map((b) => b.band)).toEqual(["Onderbouw"]);
    expect(summary(result)).toEqual(["U5: kcvve-u5"]);
  });
});

describe("the AI fallback's inputs (#3559)", () => {
  it("lists every live U-code once, youngest first — the AI's only allowed answers", () => {
    expect(youthTeamAges(TEAMS)).toEqual([
      "U5",
      "U6",
      "U7",
      "U8",
      "U9",
      "U10",
      "U11",
      "U12",
      "U13",
      "U14",
      "U15",
      "U16",
      "U17",
      "U19",
      "U21",
    ]);
  });

  it.each([
    "mijn zoon speelt bij de pupillen",
    "Mijn dochtertje wil voetballen",
    "welke ploeg voor de kadetten",
    "Nieuwelingen trainer",
    "beloften",
    "debutantjes",
    "jeugdwerking",
    "ons kind",
  ])("hears a youth hint in %j", (query) => {
    expect(hasYouthHint(query)).toBe(true);
  });

  it.each([
    "kantine",
    "wie is de voorzitter",
    "lidgeld betalen",
    // Senior teams — `ploeg` alone would let these through (#3420 mock: "A-ploeg → no card").
    "A-ploeg",
    "B-ploeg",
    "a ploeg",
    "eerste ploeg",
    "reserven",
    "mijn zoon speelt bij de reserven",
  ])("hears no youth hint in %j", (query) => {
    expect(hasYouthHint(query)).toBe(false);
  });

  it('builds the card for a confirmed pick, found by "ai"', () => {
    const result = aiTeamResult(
      "U9",
      TEAMS,
      seasonStartYear(NOW),
      NOW.getFullYear(),
    );
    expect(result.bands).toHaveLength(1);
    expect(result.bands[0].band).toBe("Onderbouw");
    expect(result.bands[0].matches).toEqual([
      expect.objectContaining({
        kind: "ai",
        category: 9,
        teams: [expect.objectContaining({ slug: "kcvve-u9" })],
      }),
    ]);
  });
});
