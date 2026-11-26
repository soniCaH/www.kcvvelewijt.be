import { describe, expect, it } from "vitest";

import {
  buildSiteContents,
  type ContentsGroup,
  type SiteContentsInput,
} from "./site-contents";

const EMPTY: SiteContentsInput = {
  teams: [],
  articles: [],
  events: [],
  pages: [],
};

const TEAM = {
  id: "team-a",
  slug: "eerste-elftallen-a",
  displayName: "A-ploeg",
  division: "2 PB",
  divisionFull: "2e Provinciale B",
};

const YOUTH_TEAM = {
  id: "team-u15",
  slug: "kcvve-u15",
  displayName: "U15",
  division: null,
  divisionFull: null,
};

const ARTICLE = {
  id: "article-1",
  slug: "drie-punten-op-de-dries",
  title: "KCVV pakt de drie punten op de Dries",
  publishedAt: "2026-04-12T09:00:00Z",
};

const EVENT = {
  id: "event-1",
  slug: "mosselfestijn-2026",
  title: "Mosselfestijn 2026",
  dateStart: "2026-09-04T17:00:00Z",
};

const PAGE = {
  id: "page-1",
  slug: "praktische-informatie",
  title: "Praktische Informatie",
  updatedAt: "2026-02-07T12:00:00Z",
};

const groupById = (groups: ContentsGroup[], id: string) => {
  const found = groups.find((g) => g.id === id);
  if (!found) throw new Error(`no "${id}" group in the result`);
  return found;
};

describe("buildSiteContents", () => {
  it("returns nothing when every repository is empty", () => {
    expect(buildSiteContents(EMPTY)).toEqual([]);
  });

  it("omits a group whose repository returned nothing", () => {
    const groups = buildSiteContents({ ...EMPTY, teams: [TEAM] });
    expect(groups.map((g) => g.id)).toEqual(["ploegen"]);
  });

  it("prints the four groups in contents order", () => {
    const groups = buildSiteContents({
      teams: [TEAM],
      articles: [ARTICLE],
      events: [EVENT],
      pages: [PAGE],
    });
    expect(groups.map((g) => g.id)).toEqual([
      "ploegen",
      "nieuws",
      "evenementen",
      "clubpaginas",
    ]);
    expect(groups.map((g) => g.title)).toEqual([
      "Ploegen",
      "Nieuws",
      "Evenementen",
      "Clubpagina's",
    ]);
  });

  it("holds no group for players, at any input", () => {
    const groups = buildSiteContents({
      teams: [TEAM],
      articles: [ARTICLE],
      events: [EVENT],
      pages: [PAGE],
    });
    expect(groups.map((g) => g.id)).not.toContain("spelers");
    expect(JSON.stringify(groups)).not.toContain("/spelers/");
  });

  describe("the value each group is paired with", () => {
    it("pairs a ploeg with its reeks, preferring the full name", () => {
      const [entry] = groupById(
        buildSiteContents({ ...EMPTY, teams: [TEAM] }),
        "ploegen",
      ).entries;
      expect(entry).toEqual({
        id: "team-a",
        label: "A-ploeg",
        value: "2e Provinciale B",
        href: "/ploegen/eerste-elftallen-a",
      });
    });

    it("falls back to the short division code when there is no full name", () => {
      const [entry] = groupById(
        buildSiteContents({
          ...EMPTY,
          teams: [{ ...TEAM, divisionFull: null }],
        }),
        "ploegen",
      ).entries;
      expect(entry?.value).toBe("2 PB");
    });

    it("treats a blank reeks as absent, not as an empty value", () => {
      const [entry] = groupById(
        buildSiteContents({
          ...EMPTY,
          teams: [{ ...TEAM, divisionFull: "   ", division: "" }],
        }),
        "ploegen",
      ).entries;
      expect(entry?.value).toBeNull();
    });

    it("carries a null reeks rather than dropping the entry", () => {
      const { entries } = groupById(
        buildSiteContents({ ...EMPTY, teams: [YOUTH_TEAM] }),
        "ploegen",
      );
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ label: "U15", value: null });
    });

    it("pairs an artikel with its publication date", () => {
      const [entry] = groupById(
        buildSiteContents({ ...EMPTY, articles: [ARTICLE] }),
        "nieuws",
      ).entries;
      expect(entry).toEqual({
        id: "article-1",
        label: "KCVV pakt de drie punten op de Dries",
        value: "12·04·26",
        href: "/nieuws/drie-punten-op-de-dries",
      });
    });

    it("carries a null date rather than dropping an undated artikel", () => {
      const { entries } = groupById(
        buildSiteContents({
          ...EMPTY,
          articles: [{ ...ARTICLE, publishedAt: null }],
        }),
        "nieuws",
      );
      expect(entries).toHaveLength(1);
      expect(entries[0]?.value).toBeNull();
    });

    it("treats an unparseable date as absent rather than printing it raw", () => {
      const [entry] = groupById(
        buildSiteContents({
          ...EMPTY,
          articles: [{ ...ARTICLE, publishedAt: "binnenkort" }],
        }),
        "nieuws",
      ).entries;
      expect(entry?.value).toBeNull();
    });

    it("pairs an evenement with its start date", () => {
      const [entry] = groupById(
        buildSiteContents({ ...EMPTY, events: [EVENT] }),
        "evenementen",
      ).entries;
      expect(entry).toEqual({
        id: "event-1",
        label: "Mosselfestijn 2026",
        value: "04·09·26",
        href: "/evenementen/mosselfestijn-2026",
      });
    });

    it("pairs a clubpagina with when it last changed", () => {
      const [entry] = groupById(
        buildSiteContents({ ...EMPTY, pages: [PAGE] }),
        "clubpaginas",
      ).entries;
      expect(entry).toEqual({
        id: "page-1",
        label: "Praktische Informatie",
        value: "07·02·26",
        href: "/club/praktische-informatie",
      });
    });
  });

  it("formats every date in the club's zone, not the runtime's", () => {
    // 23:30 UTC on the 3rd is 01:30 Belgian on the 4th in summer time. Reading
    // it in UTC would print the wrong day (#2430).
    const [entry] = groupById(
      buildSiteContents({
        ...EMPTY,
        events: [{ ...EVENT, dateStart: "2026-09-03T23:30:00Z" }],
      }),
      "evenementen",
    ).entries;
    expect(entry?.value).toBe("04·09·26");
  });

  it("drops a row with no slug, in every group", () => {
    // A slug-less document has no detail page, so a row for it would link to
    // the section index — a live 200 that silently is not what was clicked.
    // Production holds 77 events in exactly that state.
    const groups = buildSiteContents({
      teams: [{ ...TEAM, slug: "" }],
      articles: [{ ...ARTICLE, slug: "" }],
      events: [{ ...EVENT, slug: "  " }],
      pages: [{ ...PAGE, slug: "" }],
    });
    expect(groups).toEqual([]);
  });

  it("keeps the rows that do have a slug alongside the ones that do not", () => {
    const { entries } = groupById(
      buildSiteContents({
        ...EMPTY,
        events: [EVENT, { ...EVENT, id: "event-2", slug: "" }],
      }),
      "evenementen",
    );
    expect(entries.map((e) => e.id)).toEqual(["event-1"]);
  });

  it("prints ploegen alphabetically by the name it shows, not by the repository's sort key", () => {
    // The repository orders on the PSD-registered `name`; the page prints the
    // display name. Sorting by a key the reader cannot see produced
    // `A-ploeg · U11 · U13 · KCVVE U6 Groen & Wit · U10` in production.
    const { entries } = groupById(
      buildSiteContents({
        ...EMPTY,
        teams: [
          { ...YOUTH_TEAM, id: "u11", slug: "kcvve-u11", displayName: "U11" },
          {
            ...YOUTH_TEAM,
            id: "u6",
            slug: "kcvve-u6-groen-wit",
            displayName: "KCVVE U6 Groen & Wit",
          },
          { ...TEAM },
          { ...YOUTH_TEAM, id: "u9", slug: "kcvve-u9", displayName: "U9" },
        ],
      }),
      "ploegen",
    );
    expect(entries.map((e) => e.label)).toEqual([
      "A-ploeg",
      "KCVVE U6 Groen & Wit",
      "U9",
      "U11",
    ]);
  });

  it("does not mutate the array it was handed", () => {
    const teams = [
      { ...YOUTH_TEAM, id: "u11", slug: "kcvve-u11", displayName: "U11" },
      { ...TEAM },
    ];
    buildSiteContents({ ...EMPTY, teams });
    expect(teams.map((t) => t.id)).toEqual(["u11", "team-a"]);
  });

  it("keeps the source order the repositories returned", () => {
    const { entries } = groupById(
      buildSiteContents({
        ...EMPTY,
        articles: [
          ARTICLE,
          { ...ARTICLE, id: "article-2", slug: "tweede", title: "Tweede" },
        ],
      }),
      "nieuws",
    );
    expect(entries.map((e) => e.id)).toEqual(["article-1", "article-2"]);
  });
});
