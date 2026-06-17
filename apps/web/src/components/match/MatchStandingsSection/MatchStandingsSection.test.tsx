import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RankingEntry } from "@kcvv/api-contract";
import { MatchStandingsSection } from "./MatchStandingsSection";

function entry(
  position: number,
  team_id: number,
  team_name: string,
): RankingEntry {
  return {
    position,
    team_id,
    team_name,
    played: 10,
    won: 5,
    drawn: 2,
    lost: 3,
    goals_for: 18,
    goals_against: 14,
    goal_difference: 4,
    points: 17,
  } as RankingEntry;
}

const ranking: RankingEntry[] = [
  entry(1, 101, "KSK Kampenhout"),
  entry(2, 1235, "KCVV Elewijt"),
  entry(3, 103, "VK Weerde"),
];

describe("MatchStandingsSection", () => {
  it("renders the KLASSEMENT chrome + heading + table for a populated ranking", () => {
    render(<MatchStandingsSection entries={ranking} highlightTeamId={1235} />);
    expect(screen.getByText("KLASSEMENT")).toBeInTheDocument();
    expect(screen.getByText(/In de stand/i)).toBeInTheDocument();
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("KSK Kampenhout")).toBeInTheDocument();
  });

  it("auto-hides (renders nothing) when the ranking is empty", () => {
    const { container } = render(<MatchStandingsSection entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("forwards highlightTeamId so the KCVV row is tinted", () => {
    render(<MatchStandingsSection entries={ranking} highlightTeamId={1235} />);
    // StandingsTable marks the highlighted row with data-testid="standings-kcvv-row".
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    expect(kcvvRow.textContent).toContain("KCVV Elewijt");
  });
});
