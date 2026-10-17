import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RankingEntry } from "@kcvv/api-contract";
import { MatchStandingsSection } from "./MatchStandingsSection";
import type { MatchStandingsSectionUnavailableProps } from "./MatchStandingsSection";

// Type-level assertion (#2576 review finding 6) — TypeScript, not vitest, is
// under test here. `@ts-expect-error` fails the type check if `unavailable:
// true` ever grows an `entries` field again, which is what makes "rows
// present AND unavailable" a compile error at the call site instead of a
// component that has to decide which one silently wins.
const _unavailableWithEntries: MatchStandingsSectionUnavailableProps = {
  unavailable: true,
  homeClubId: 1235,
  awayClubId: 103,
  // @ts-expect-error — the unavailable member carries no `entries` at all
  entries: [],
};

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
        highlightClubId={1235}
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
        highlightClubId={1235}
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

  it("stays silent (no notice) on a genuinely empty ranking even though the section could show one", () => {
    render(
      <MatchStandingsSection entries={[]} homeClubId={1235} awayClubId={103} />,
    );
    expect(screen.queryByText(/niet beschikbaar/i)).toBeNull();
  });

  it("renders a failure notice instead of nothing when the read is permanently unavailable (#2576)", () => {
    render(
      <MatchStandingsSection unavailable homeClubId={1235} awayClubId={103} />,
    );
    expect(screen.getByText("KLASSEMENT")).toBeInTheDocument();
    expect(screen.getByText(/In de stand/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Het klassement is/).closest("p"),
    ).toHaveTextContent(
      "Het klassement is even niet beschikbaar. Probeer het later opnieuw.",
    );
  });

  it("accents only the failure clause, not the whole notice or the subject", () => {
    render(
      <MatchStandingsSection unavailable homeClubId={1235} awayClubId={103} />,
    );
    const accent = screen.getByText("even niet beschikbaar");
    expect(accent.tagName).toBe("EM");
  });

  it("tints the KCVV row via highlightClubId", () => {
    render(
      <MatchStandingsSection
        entries={fullDivision}
        homeClubId={1235}
        awayClubId={103}
        highlightClubId={1235}
      />,
    );
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    expect(kcvvRow.textContent).toContain("KCVV Elewijt");
  });
});
