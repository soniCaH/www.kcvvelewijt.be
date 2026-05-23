import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchLineupSection } from "./MatchLineupSection";
import type { LineupPlayer } from "../MatchLineup/MatchLineup";

function makePlayer(overrides: Partial<LineupPlayer> = {}): LineupPlayer {
  return {
    name: "Ben Lievens",
    number: 11,
    isCaptain: false,
    status: "starter",
    ...overrides,
  };
}

const homeLineup: LineupPlayer[] = [
  makePlayer({ name: "Ben Lievens", number: 1, isKeeper: true }),
  makePlayer({ name: "Lars De Vos", number: 7 }),
];
const awayLineup: LineupPlayer[] = [
  makePlayer({ name: "Stijn Vandenberg", number: 1, isKeeper: true }),
  makePlayer({ name: "Kevin Smets", number: 3 }),
];

describe("MatchLineupSection", () => {
  it("renders kicker, heading, and the wrapped lineup when data is present", () => {
    render(
      <MatchLineupSection
        homeTeamName="KCVV Elewijt"
        awayTeamName="RC Mechelen"
        homeLineup={homeLineup}
        awayLineup={awayLineup}
      />,
    );
    expect(screen.getByText("OPSTELLINGEN")).toBeInTheDocument();
    expect(screen.getByText("Wie er stond.")).toBeInTheDocument();
    expect(screen.getByText("Ben Lievens")).toBeInTheDocument();
    expect(screen.getByText("Kevin Smets")).toBeInTheDocument();
  });

  it("returns null when both lineups are empty", () => {
    const { container } = render(
      <MatchLineupSection
        homeTeamName="KCVV Elewijt"
        awayTeamName="RC Mechelen"
        homeLineup={[]}
        awayLineup={[]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when only one side has lineup data", () => {
    render(
      <MatchLineupSection
        homeTeamName="KCVV Elewijt"
        awayTeamName="RC Mechelen"
        homeLineup={homeLineup}
        awayLineup={[]}
      />,
    );
    expect(screen.getByText("OPSTELLINGEN")).toBeInTheDocument();
    expect(screen.getByText("Ben Lievens")).toBeInTheDocument();
  });
});
