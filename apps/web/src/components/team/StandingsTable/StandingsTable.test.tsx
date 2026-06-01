/**
 * StandingsTable unit tests.
 *
 * Covers:
 *  - Auto-hides (renders null) when entries is empty
 *  - Renders all columns: # · Ploeg · M · W · G · V · +/- · Ptn
 *  - KCVV row highlight: data-testid + non-italic bold name
 *  - Non-KCVV rows: no highlight testid
 *  - Goal difference formatting (+N for positive)
 *  - No Vorm column, no green/yellow/red badges
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { RankingEntry } from "@kcvv/api-contract";
import { StandingsTable } from "./StandingsTable";

function entry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    position: 1,
    team_id: 1,
    team_name: "FC Test",
    played: 10,
    won: 6,
    drawn: 2,
    lost: 2,
    goals_for: 20,
    goals_against: 10,
    goal_difference: 10,
    points: 20,
    ...overrides,
  } as RankingEntry;
}

const DIVISION: RankingEntry[] = [
  entry({ position: 1, team_id: 1, team_name: "Leader FC", points: 30 }),
  entry({
    position: 2,
    team_id: 1235,
    team_name: "KCVV Elewijt",
    points: 24,
    goal_difference: 5,
  }),
  entry({
    position: 3,
    team_id: 3,
    team_name: "Third Town",
    points: 22,
    goal_difference: -3,
  }),
];

describe("StandingsTable", () => {
  it("renders null when entries is empty", () => {
    const { container } = render(<StandingsTable entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the standard column headers", () => {
    render(<StandingsTable entries={DIVISION} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(["#", "Ploeg", "M", "W", "G", "V", "+/-", "Ptn"]);
  });

  it("highlights the KCVV row when highlightTeamId matches", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    expect(kcvvRow).toBeInTheDocument();
    expect(kcvvRow.textContent).toContain("KCVV Elewijt");
  });

  it("renders the KCVV team name non-italic + bold", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    const nameSpan = kcvvRow.querySelector('[title="KCVV Elewijt"]');
    expect(nameSpan?.className).toContain("not-italic");
    expect(nameSpan?.className).toContain("font-semibold");
  });

  it("does not highlight any row when highlightTeamId is absent", () => {
    render(<StandingsTable entries={DIVISION} />);
    expect(screen.queryByTestId("standings-kcvv-row")).toBeNull();
  });

  it("does not highlight a non-matching team", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={9999} />);
    expect(screen.queryByTestId("standings-kcvv-row")).toBeNull();
  });

  it("formats positive goal difference with a leading +", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("renders negative goal difference without a + prefix", () => {
    render(<StandingsTable entries={DIVISION} />);
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("does not render a Vorm/form column", () => {
    render(<StandingsTable entries={DIVISION} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent?.toLowerCase());
    expect(headers).not.toContain("vorm");
    expect(headers).not.toContain("form");
  });
});
