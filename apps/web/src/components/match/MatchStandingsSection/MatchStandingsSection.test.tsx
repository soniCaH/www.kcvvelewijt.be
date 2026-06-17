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
    club_id: team_id, // mock: club_id mirrors team_id
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

const fullDivision: RankingEntry[] = [
  entry(1, 101, "KSK Kampenhout"),
  entry(3, 103, "VK Weerde"),
  entry(6, 1235, "KCVV Elewijt"),
];

describe("MatchStandingsSection", () => {
  it("renders the KLASSEMENT chrome + heading for a league match", () => {
    render(
      <MatchStandingsSection
        entries={fullDivision}
        homeClubId={1235}
        awayClubId={103}
        highlightTeamId={1235}
      />,
    );
    expect(screen.getByText("KLASSEMENT")).toBeInTheDocument();
    expect(screen.getByText(/In de stand/i)).toBeInTheDocument();
  });

  it("shows only the two teams playing this match — not the whole division", () => {
    render(
      <MatchStandingsSection
        entries={fullDivision}
        homeClubId={1235}
        awayClubId={103}
        highlightTeamId={1235}
      />,
    );
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("VK Weerde")).toBeInTheDocument();
    // The uninvolved third team is filtered out.
    expect(screen.queryByText("KSK Kampenhout")).toBeNull();
  });

  it("keeps each team's real league position (sorted ascending)", () => {
    render(
      <MatchStandingsSection
        entries={fullDivision}
        homeClubId={1235}
        awayClubId={103}
      />,
    );
    const positions = screen
      .getAllByRole("row")
      .slice(1) // drop the header row
      .map((r) => r.querySelector("td")?.textContent);
    expect(positions).toEqual(["3", "6"]); // VK Weerde (3) before KCVV (6)
  });

  it("auto-hides when neither team is in the ranking", () => {
    const { container } = render(
      <MatchStandingsSection
        entries={fullDivision}
        homeClubId={999}
        awayClubId={998}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("auto-hides on an empty ranking", () => {
    const { container } = render(
      <MatchStandingsSection entries={[]} homeClubId={1235} awayClubId={103} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("tints the KCVV row via highlightTeamId", () => {
    render(
      <MatchStandingsSection
        entries={fullDivision}
        homeClubId={1235}
        awayClubId={103}
        highlightTeamId={1235}
      />,
    );
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    expect(kcvvRow.textContent).toContain("KCVV Elewijt");
  });
});
