/**
 * The guard that would have caught the shipped bug (#2630 / #2539).
 *
 * Three `<h1>` collisions reached production and nothing failed. They were
 * *code* reaching for a shared field, not bad data, so Studio validation on
 * `displayName` would have caught nothing either — the assertion has to be that
 * the eighteen routes are *distinguishable*, at the helper level, with no
 * network call. `nav-reachability.test.ts` already asserts every nav
 * destination resolves; this asserts each one names a different team.
 */

import { describe, it, expect } from "vitest";
import { teamDisplayName } from "./team-display-name";

/**
 * The production roster, in route order — measured against production Sanity
 * (`archived != true && showInNavigation != false`), 18 documents. `name`
 * carries the double spaces verbatim, because that is what PSD syncs.
 */
const ROSTER = [
  { slug: "eerste-elftallen-a", name: "Eerste Elftallen A" },
  { slug: "eerste-elftallen-b", name: "Eerste Elftallen B" },
  { slug: "reserven", name: "Reserven" },
  { slug: "kcvve-u21", name: "KCVVE U21" },
  { slug: "kcvve-u19", name: "KCVVE U19" },
  { slug: "kcvve-u17", name: "KCVVE U17" },
  { slug: "kcvve-u16", name: "KCVVE U16" },
  { slug: "kcvve-u15", name: "KCVVE  U15" },
  { slug: "kcvve-u14", name: "KCVVE U14" },
  { slug: "kcvve-u13", name: "KCVVE  U13" },
  { slug: "kcvve-u12", name: "KCVVE U12" },
  { slug: "kcvve-u11", name: "KCVVE  U11 " },
  { slug: "kcvve-u10", name: "KCVVE U10" },
  { slug: "kcvve-u10p", name: "KCVVE U10P" },
  { slug: "kcvve-u9", name: "KCVVE  U9" },
  { slug: "kcvve-u8", name: "KCVVE U8" },
  { slug: "kcvve-u7", name: "KCVVE U7" },
  { slug: "kcvve-u6", name: "KCVVE  U6" },
];

describe("teamDisplayName", () => {
  it("gives the eighteen team routes eighteen distinct names", () => {
    const names = ROSTER.map((t) => teamDisplayName(t));
    expect(new Set(names).size).toBe(ROSTER.length);
  });

  it("heads every page from the slug fallback on day one", () => {
    // Nobody has typed a `displayName` yet, so this is what the site shows.
    expect(ROSTER.map((t) => teamDisplayName(t))).toEqual([
      "A-ploeg",
      "B-ploeg",
      "Reserven",
      "U21",
      "U19",
      "U17",
      "U16",
      "U15",
      "U14",
      "U13",
      "U12",
      "U11",
      "U10",
      "U10P",
      "U9",
      "U8",
      "U7",
      "U6",
    ]);
  });

  // Scoped deliberately: this asserts the resolved *name* is clean, which is
  // what the `<title>`, `<h1>`, OG card and directory caption render. The one
  // surface that still leaked a federation name was the `<YouthDirectory>`
  // sub-line, which fell back to `name` when no division was published; #2641
  // deleted that fallback, so no rendered surface carries a double space now.
  it("resolves no name containing a double space — a slug cannot carry one", () => {
    const withDoubleSpace = ROSTER.map((t) => teamDisplayName(t)).filter((n) =>
      n.includes("  "),
    );
    expect(withDoubleSpace).toEqual([]);
  });

  it("prefers the editorial displayName over the derived label", () => {
    expect(
      teamDisplayName({
        displayName: "U10 Groen",
        slug: "kcvve-u10",
        name: "KCVVE U10",
      }),
    ).toBe("U10 Groen");
  });

  it("treats a blank displayName as unset", () => {
    expect(
      teamDisplayName({
        displayName: "   ",
        slug: "kcvve-u10p",
        name: "KCVVE U10P",
      }),
    ).toBe("U10P");
  });

  it("falls back to the federation name for an unrecognised slug", () => {
    expect(
      teamDisplayName({
        displayName: null,
        slug: "fc-weitse-gans",
        name: "FC WEITSE GANS",
      }),
    ).toBe("FC WEITSE GANS");
  });

  // #2599 — production carries `kcvve-u8-wit` / `kcvve-u8-groen` (not
  // archived, unlike the `kcvve-u7-wit` / `kcvve-u9-groen` pair the module
  // comment names): the age token sits mid-slug with a colour segment after
  // it, which the last-segment-only check used to miss entirely.
  it("keeps a colour segment after the age token instead of falling back to the federation name", () => {
    expect(
      teamDisplayName({
        displayName: null,
        slug: "kcvve-u8-wit",
        name: "KCVVE U8 Wit",
      }),
    ).toBe("U8 Wit");
    expect(
      teamDisplayName({
        displayName: null,
        slug: "kcvve-u8-groen",
        name: "KCVVE U8 Groen",
      }),
    ).toBe("U8 Groen");
  });

  it("title-cases a lowercase colour segment after the age token", () => {
    expect(
      teamDisplayName({
        displayName: null,
        slug: "kcvve-u9-groen",
        name: "KCVVE U9 groen",
      }),
    ).toBe("U9 Groen");
  });

  // #2599 review — the lone-letter branch's retired guard used to exist for
  // exactly this hypothetical slug (a trailing letter after an age token),
  // so it wouldn't be misread as the senior "A-ploeg". The age-token search
  // now catches it first: "U9 A" reads as a variant U9 side (the same way
  // "U8 Wit" does) and can no longer be confused with the senior team.
  it("reads a trailing letter after an age token as a variant U-side, not the senior A-ploeg", () => {
    expect(
      teamDisplayName({
        displayName: null,
        slug: "kcvve-u9-a",
        name: "KCVVE U9 A",
      }),
    ).toBe("U9 A");
  });
});
