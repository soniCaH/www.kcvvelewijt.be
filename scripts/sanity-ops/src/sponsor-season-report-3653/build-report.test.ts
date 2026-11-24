import { describe, expect, it } from "vitest";
import {
  buildReport,
  defaultSeason,
  type Ga4Row,
  type ReportInput,
  type SponsorInput,
} from "./build-report";
import { hashMemberId } from "./hash-member-id";

const RANGE = { from: "2026-07-01", to: "2027-06-30" };

const sponsor = (id: string, overrides: Partial<SponsorInput> = {}) => ({
  id,
  name: `Sponsor ${id}`,
  tier: "sponsor",
  active: true,
  teams: [],
  ...overrides,
});

const row = (
  id: string,
  eventName: string,
  source: string,
  count: number,
  date = "20261201",
): Ga4Row => ({ sponsorId: hashMemberId(id), eventName, source, count, date });

const build = (overrides: Partial<ReportInput> = {}) =>
  buildReport({
    sponsors: [sponsor("garage")],
    rows: [],
    spotlightWeeks: {},
    range: RANGE,
    ...overrides,
  });

const surface = (
  report: ReturnType<typeof build>[number],
  name: "homepage" | "team" | "sponsors",
) => report.surfaces.find((s) => s.surface === name)!;

describe("buildReport", () => {
  it("groups impressions and clicks by source", () => {
    const [report] = build({
      rows: [
        row("garage", "sponsor_impression", "homepage", 40),
        row("garage", "sponsor_click", "homepage", 3),
        row("garage", "sponsor_impression", "team", 25),
        row("garage", "sponsor_impression", "sponsors", 10),
        row("garage", "sponsor_click", "sponsors", 2),
      ],
    });
    expect(report.surfaces.map((s) => s.surface)).toEqual([
      "homepage",
      "team",
      "sponsors",
    ]);
    expect(surface(report, "homepage")).toMatchObject({
      impressions: 40,
      clicks: 3,
    });
    expect(surface(report, "team")).toMatchObject({
      impressions: 25,
      clicks: 0,
    });
    expect(surface(report, "sponsors")).toMatchObject({
      impressions: 10,
      clicks: 2,
    });
    expect(report.hasData).toBe(true);
  });

  it("sums rows of the same source (one row per day)", () => {
    const [report] = build({
      rows: [
        row("garage", "sponsor_impression", "homepage", 40, "20261201"),
        row("garage", "sponsor_impression", "homepage", 60, "20261202"),
      ],
    });
    expect(surface(report, "homepage").impressions).toBe(100);
  });

  it("counts a featured click as a click on /sponsors only", () => {
    const [report] = build({
      rows: [
        row("garage", "sponsor_click", "sponsors", 2),
        row("garage", "sponsor_featured_click", "sponsors", 5),
        row("garage", "sponsor_featured_click", "homepage", 9),
      ],
    });
    expect(surface(report, "sponsors").clicks).toBe(7);
    expect(surface(report, "homepage").clicks).toBe(0);
  });

  it("shows a rate only from 100 impressions", () => {
    const at = (impressions: number) =>
      surface(
        build({
          rows: [
            row("garage", "sponsor_impression", "homepage", impressions),
            row("garage", "sponsor_click", "homepage", 5),
          ],
        })[0],
        "homepage",
      );
    expect(at(99).clickThroughRate).toBeUndefined();
    expect(at(100).clickThroughRate).toBeCloseTo(0.05);
    expect(at(200).clickThroughRate).toBeCloseTo(0.025);
  });

  it("rates clicks only over the period impressions were measured", () => {
    // Impressions exist from the #3773 deploy; homepage clicks go further back.
    const [report] = build({
      rows: [
        row("garage", "sponsor_click", "homepage", 20, "20261001"),
        row("garage", "sponsor_impression", "homepage", 100, "20261117"),
        row("garage", "sponsor_click", "homepage", 5, "20261117"),
      ],
    });
    expect(surface(report, "homepage").clicks).toBe(25);
    expect(surface(report, "homepage").clickThroughRate).toBeCloseTo(0.05);
  });

  it("starts the rate period per surface", () => {
    const [report] = build({
      rows: [
        row("garage", "sponsor_impression", "homepage", 100, "20261117"),
        row("garage", "sponsor_click", "team", 10, "20261117"),
        row("garage", "sponsor_impression", "team", 100, "20261118"),
        row("garage", "sponsor_click", "team", 5, "20261118"),
      ],
    });
    expect(surface(report, "team").clickThroughRate).toBeCloseTo(0.05);
  });

  it("starts the rate period at the first impression of a known Sponsor", () => {
    const [report] = build({
      rows: [
        {
          ...row(
            "somebody-else",
            "sponsor_impression",
            "homepage",
            1,
            "20261001",
          ),
        },
        row("garage", "sponsor_impression", "homepage", 100, "20261117"),
        row("garage", "sponsor_click", "homepage", 20, "20261101"),
      ],
    });
    expect(surface(report, "homepage").clickThroughRate).toBe(0);
  });

  describe("team-line clicks (#3652)", () => {
    const withTeams = (teams: string[]) => [sponsor("garage", { teams })];

    it("counts them as their own figure, whatever the source", () => {
      // The event has no `source`: GA4 shows "(not set)", and it stays unmapped.
      const [report] = build({
        sponsors: withTeams(["U15"]),
        rows: [
          row("garage", "sponsor_team_line_click", "(not set)", 3, "20261001"),
          row("garage", "sponsor_team_line_click", "", 2),
          row("garage", "sponsor_impression", "team", 100),
          row("garage", "sponsor_click", "team", 5),
        ],
      });
      expect(report.teamLineClicks).toBe(5);
      expect(surface(report, "team").clicks).toBe(5);
      expect(surface(report, "team").clickThroughRate).toBeCloseTo(0.05);
    });

    it("is absent for a Sponsor without a linked Team", () => {
      const [report] = build({
        rows: [row("garage", "sponsor_team_line_click", "(not set)", 3)],
      });
      expect(report.teamLineClicks).toBeUndefined();
    });

    it("is zero for a linked Sponsor without clicks, and counts as data when there are some", () => {
      expect(build({ sponsors: withTeams(["U15"]) })[0].teamLineClicks).toBe(0);
      const [report] = build({
        sponsors: withTeams(["U15"]),
        rows: [row("garage", "sponsor_team_line_click", "(not set)", 1)],
      });
      expect(report.hasData).toBe(true);
    });

    it("ignores rows of an unknown Sponsor", () => {
      const [report] = build({
        sponsors: withTeams(["U15"]),
        rows: [row("other", "sponsor_team_line_click", "(not set)", 4)],
      });
      expect(report.teamLineClicks).toBe(0);
    });
  });

  it("gives a Sponsor without rows the no-data state", () => {
    const [report] = build();
    expect(report.hasData).toBe(false);
    expect(report.surfaces.every((s) => s.impressions + s.clicks === 0)).toBe(
      true,
    );
  });

  it("ignores rows with no or unknown sponsor id and unknown sources", () => {
    const [report] = build({
      rows: [
        {
          ...row("garage", "sponsor_impression", "homepage", 5),
          sponsorId: "",
        },
        {
          ...row("garage", "sponsor_impression", "homepage", 5),
          sponsorId: "(not set)",
        },
        row("somebody-else", "sponsor_impression", "homepage", 5),
        row("garage", "sponsor_impression", "newsletter", 5),
        row("garage", "page_view", "homepage", 5),
      ],
    });
    expect(report.hasData).toBe(false);
  });

  it("keeps each Sponsor's data apart and reports active Sponsors only", () => {
    const reports = build({
      sponsors: [
        sponsor("b", { name: "Bakkerij" }),
        sponsor("a", { name: "Autohandel" }),
        sponsor("old", { name: "Oud", active: false }),
      ],
      rows: [
        row("a", "sponsor_impression", "homepage", 7),
        row("b", "sponsor_impression", "homepage", 11),
        row("old", "sponsor_impression", "homepage", 99),
      ],
    });
    expect(reports.map((r) => r.name)).toEqual(["Autohandel", "Bakkerij"]);
    expect(surface(reports[0], "homepage").impressions).toBe(7);
    expect(surface(reports[1], "homepage").impressions).toBe(11);
  });

  it("throws on a hash collision, even with an inactive Sponsor", () => {
    // djb2: "ab" and "bA" share a hash (33 * 97 + 98 === 33 * 98 + 65).
    expect(hashMemberId("ab")).toBe(hashMemberId("bA"));
    expect(() =>
      build({ sponsors: [sponsor("ab"), sponsor("bA", { active: false })] }),
    ).toThrow(/collision/i);
  });

  it("carries linked Teams and spotlight weeks, and throws on a spotlight name that matches no Sponsor", () => {
    const [report] = build({
      sponsors: [sponsor("garage", { name: "Garage X", teams: ["U15", "A"] })],
      spotlightWeeks: { "Garage X": ["2027-03-01"] },
    });
    expect(report.teams).toEqual(["U15", "A"]);
    expect(report.spotlightWeeks).toEqual(["2027-03-01"]);
    expect(() =>
      build({ spotlightWeeks: { "Garaaage X": ["2027-03-01"] } }),
    ).toThrow(/Garaaage X/);
  });

  it("throws when a spotlight name matches two active Sponsors", () => {
    expect(() =>
      build({
        sponsors: [
          sponsor("a", { name: "Garage X" }),
          sponsor("b", { name: "Garage X" }),
        ],
        spotlightWeeks: { "Garage X": ["2027-03-01"] },
      }),
    ).toThrow(/Garage X.*more than one/);
  });

  it("holds no raw Sanity id in the report model", () => {
    const rawId = "sponsor-0a1b2c3d-secret";
    const reports = build({
      sponsors: [sponsor(rawId, { name: "Garage X" })],
      rows: [row(rawId, "sponsor_impression", "homepage", 3)],
    });
    expect(JSON.stringify(reports)).not.toContain(rawId);
  });

  describe("(not set) source (#3773)", () => {
    it("maps it to sponsors for both click events up to the deploy day", () => {
      const [report] = build({
        rows: [
          row("garage", "sponsor_click", "(not set)", 4, "20261116"),
          row("garage", "sponsor_featured_click", "(not set)", 3, "20261117"),
        ],
      });
      expect(surface(report, "sponsors").clicks).toBe(7);
    });

    it("leaves it out after the deploy, and for impressions", () => {
      const [report] = build({
        rows: [
          row("garage", "sponsor_click", "(not set)", 4, "20261118"),
          row("garage", "sponsor_impression", "(not set)", 4, "20261116"),
        ],
      });
      expect(report.hasData).toBe(false);
    });
  });
});

describe("defaultSeason", () => {
  it("runs 1 July to 30 June around today", () => {
    expect(defaultSeason(new Date("2026-11-24T10:00:00Z"))).toEqual({
      from: "2026-07-01",
      to: "2027-06-30",
    });
    expect(defaultSeason(new Date("2027-03-02T10:00:00Z"))).toEqual({
      from: "2026-07-01",
      to: "2027-06-30",
    });
    expect(defaultSeason(new Date("2027-07-01T00:30:00Z"))).toEqual({
      from: "2027-07-01",
      to: "2028-06-30",
    });
  });
});
