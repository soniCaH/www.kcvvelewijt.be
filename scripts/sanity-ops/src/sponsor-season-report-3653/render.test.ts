import { describe, expect, it } from "vitest";
import { buildReport, type Ga4Row } from "./build-report";
import { hashMemberId } from "./hash-member-id";
import { renderReportPage } from "./render";

const RAW_ID = "sponsor-0a1b2c3d-secret";

const render = (rows: Ga4Row[], teams: string[] = [], weeks: string[] = []) => {
  const [report] = buildReport({
    sponsors: [{ id: RAW_ID, name: "Garage <X>", active: true, teams }],
    rows,
    spotlightWeeks: weeks.length > 0 ? { "Garage <X>": weeks } : {},
    range: { from: "2026-07-01", to: "2027-06-30" },
  });
  return renderReportPage(report);
};

const row = (eventName: string, source: string, count: number): Ga4Row => ({
  sponsorId: hashMemberId(RAW_ID),
  eventName,
  source,
  count,
  date: "20261201",
});

describe("renderReportPage", () => {
  it("shows raw counts and a rate from 100 impressions only", () => {
    const html = render([
      row("sponsor_impression", "homepage", 200),
      row("sponsor_click", "homepage", 5),
      row("sponsor_impression", "team", 99),
      row("sponsor_click", "team", 9),
    ]);
    expect(html).toContain("2,5 %");
    expect(html).toContain("<td>Wedstrijdpagina (matchbal)</td>");
    expect(html).not.toContain("9,1 %"); // 9 / 99
    expect(html).toContain("pas vanaf 100 vertoningen");
    expect(html).toContain("sinds de vertoningen gemeten worden");
    expect(html).toContain("1 juli 2026");
    expect(html).toContain("30 juni 2027");
  });

  it("says 'Nog geen meetgegevens' and shows no table without data", () => {
    const html = render([]);
    expect(html).toContain("Nog geen meetgegevens");
    expect(html).not.toContain("<table");
  });

  it("escapes the Sponsor name", () => {
    expect(render([])).toContain("Garage &lt;X&gt;");
  });

  it("lists Teams or says clubwide, and spotlight weeks only when given", () => {
    expect(render([], ["U15", "A"], ["2027-03-01"])).toMatch(
      /U15, A[\s\S]*week van 1 maart 2027/,
    );
    const plain = render([]);
    expect(plain).toContain("clubbreed");
    expect(plain).not.toContain("In de kijker");
  });

  it("shows the team-line clicks line only when there are clicks", () => {
    const clicks = [row("sponsor_team_line_click", "(not set)", 4)];
    expect(render(clicks, ["U15"])).toContain(
      "Klikken op de naam bij de ploeg: 4",
    );
    expect(render([], ["U15"])).not.toContain("Klikken op de naam");
  });

  it("carries the minimum-not-estimate footer and no raw id", () => {
    const html = render([row("sponsor_impression", "homepage", 3)]);
    expect(html).toContain("minimum, geen schatting");
    expect(html).toMatch(/adblocker/i);
    expect(html).toMatch(/toestemming/i);
    expect(html).not.toContain(RAW_ID);
  });
});
