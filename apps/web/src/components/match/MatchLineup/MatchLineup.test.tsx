/**
 * MatchLineup Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatchLineup, type LineupPlayer } from "./MatchLineup";

describe("MatchLineup", () => {
  const mockHomeLineup: LineupPlayer[] = [
    {
      id: 1,
      name: "Player One",
      number: 1,
      isCaptain: false,
      status: "starter",
    },
    {
      id: 2,
      name: "Player Two",
      number: 10,
      isCaptain: true,
      status: "starter",
    },
    {
      id: 3,
      name: "Player Three",
      number: 9,
      minutesPlayed: 75,
      isCaptain: false,
      status: "substituted",
    },
    {
      id: 4,
      name: "Sub One",
      number: 12,
      isCaptain: false,
      status: "substitute",
    },
  ];

  const mockAwayLineup: LineupPlayer[] = [
    {
      id: 101,
      name: "Away Player One",
      number: 1,
      isCaptain: true,
      status: "starter",
    },
    {
      id: 102,
      name: "Away Player Two",
      number: 7,
      isCaptain: false,
      status: "starter",
    },
  ];

  const defaultProps = {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
  };

  describe("rendering", () => {
    // The "Opstellingen" heading moved up to <MatchLineupSection> in Phase 6.B
    // (#1908). The primitive itself no longer owns the section heading.
    it("does not own the section heading anymore", () => {
      render(<MatchLineup {...defaultProps} />);
      expect(screen.queryByText("Opstellingen")).not.toBeInTheDocument();
    });

    it("renders team names", () => {
      render(<MatchLineup {...defaultProps} />);
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
    });

    it("renders player names", () => {
      render(<MatchLineup {...defaultProps} />);
      expect(screen.getByText("Player One")).toBeInTheDocument();
      expect(screen.getByText("Player Two")).toBeInTheDocument();
      expect(screen.getByText("Away Player One")).toBeInTheDocument();
    });

    it("renders jersey numbers", () => {
      render(<MatchLineup {...defaultProps} />);
      // Both teams have player #1, so we check for multiple
      const onesElements = screen.getAllByText("1");
      expect(onesElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  describe("player grouping", () => {
    it("renders the BANK divider when the team has substitutes", () => {
      render(<MatchLineup {...defaultProps} />);
      // Home team has substitutes → BANK divider present.
      expect(screen.getAllByText("Bank").length).toBeGreaterThanOrEqual(1);
    });

    it("omits the BANK divider when no substitutes are present", () => {
      render(
        <MatchLineup
          {...defaultProps}
          // Away team has zero substitutes in the default fixture; render
          // both sides with only starters to make the assertion concrete.
          homeLineup={mockHomeLineup.filter((p) => p.status === "starter")}
          awayLineup={mockAwayLineup.filter((p) => p.status === "starter")}
        />,
      );
      expect(screen.queryByText("Bank")).not.toBeInTheDocument();
    });

    it("includes substituted players in starters section", () => {
      render(<MatchLineup {...defaultProps} />);
      expect(screen.getByText(/Player Three/)).toBeInTheDocument();
    });
  });

  describe("captain indicator", () => {
    it("shows [C] for each captain", () => {
      render(<MatchLineup {...defaultProps} />);
      const captainIndicators = screen.getAllByText("[C]");
      expect(captainIndicators).toHaveLength(2); // One for each team captain
    });
  });

  describe("substituted players", () => {
    it("shows minutes played for substituted players", () => {
      render(<MatchLineup {...defaultProps} />);
      expect(screen.getByText("75'")).toBeInTheDocument();
    });

    it("shows down arrow icon for substituted players", () => {
      render(<MatchLineup {...defaultProps} />);
      expect(screen.getByLabelText("Gewisseld")).toBeInTheDocument();
    });
  });

  describe("subbed_in players", () => {
    it("shows up arrow icon for players who came on", () => {
      const lineupWithSubbedIn: LineupPlayer[] = [
        {
          id: 1,
          name: "Starter",
          number: 1,
          isCaptain: false,
          status: "starter",
        },
        {
          id: 2,
          name: "Came On",
          number: 12,
          minutesPlayed: 30,
          isCaptain: false,
          status: "subbed_in",
        },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={lineupWithSubbedIn} />);
      expect(screen.getByLabelText("Ingevallen")).toBeInTheDocument();
    });

    it("shows minutes played for players who came on", () => {
      const lineupWithSubbedIn: LineupPlayer[] = [
        {
          id: 1,
          name: "Starter",
          number: 1,
          isCaptain: false,
          status: "starter",
        },
        {
          id: 2,
          name: "Came On",
          number: 12,
          minutesPlayed: 30,
          isCaptain: false,
          status: "subbed_in",
        },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={lineupWithSubbedIn} />);
      expect(screen.getByText("30'")).toBeInTheDocument();
    });

    it("groups subbed_in players in substitutes section", () => {
      const lineupWithSubbedIn: LineupPlayer[] = [
        {
          id: 1,
          name: "Starter",
          number: 1,
          isCaptain: false,
          status: "starter",
        },
        {
          id: 2,
          name: "Came On",
          number: 12,
          isCaptain: false,
          status: "subbed_in",
        },
        {
          id: 3,
          name: "Unused Sub",
          number: 13,
          isCaptain: false,
          status: "substitute",
        },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={lineupWithSubbedIn} />);
      // Subbed-in players show alongside other substitutes under the BANK
      // divider; the divider should render at least once (home side has subs).
      expect(screen.getAllByText("Bank").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Came On/)).toBeInTheDocument();
      expect(screen.getByText(/Unused Sub/)).toBeInTheDocument();
    });
  });

  describe("unknown status players", () => {
    it("groups unknown status players under the BANK divider", () => {
      const lineupWithUnknown: LineupPlayer[] = [
        {
          id: 1,
          name: "Starter",
          number: 1,
          isCaptain: false,
          status: "starter",
        },
        {
          id: 2,
          name: "Unknown Player",
          number: 99,
          isCaptain: false,
          status: "unknown",
        },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={lineupWithUnknown} />);
      expect(screen.getAllByText("Bank").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Unknown Player/)).toBeInTheDocument();
    });
  });

  describe("empty lineups", () => {
    it("shows message when both lineups are empty", () => {
      render(<MatchLineup {...defaultProps} homeLineup={[]} awayLineup={[]} />);
      expect(
        screen.getByText("Geen opstellingen beschikbaar voor deze wedstrijd."),
      ).toBeInTheDocument();
    });

    it("shows message for empty team lineup", () => {
      render(<MatchLineup {...defaultProps} homeLineup={[]} />);
      expect(
        screen.getByText("Geen opstelling beschikbaar"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(<MatchLineup {...defaultProps} isLoading />);
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render player names when loading", () => {
      render(<MatchLineup {...defaultProps} isLoading />);
      expect(screen.queryByText("Player One")).not.toBeInTheDocument();
    });
  });

  describe("minimal data", () => {
    it("renders players without jersey numbers", () => {
      const minimalLineup: LineupPlayer[] = [
        { name: "No Number Player", isCaptain: false, status: "starter" },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={minimalLineup} />);
      expect(screen.getByText("No Number Player")).toBeInTheDocument();
    });

    it("renders players without id using index-based key", () => {
      const noIdLineup: LineupPlayer[] = [
        { name: "Player A", number: 1, isCaptain: false, status: "starter" },
        { name: "Player B", number: 2, isCaptain: false, status: "starter" },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={noIdLineup} />);
      expect(screen.getByText("Player A")).toBeInTheDocument();
      expect(screen.getByText("Player B")).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MatchLineup {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("styling", () => {
    it("renders a warm-bg number badge for keepers (isKeeper=true)", () => {
      const keeperLineup: LineupPlayer[] = [
        {
          id: 1,
          name: "Keeper Player",
          number: 1,
          isCaptain: false,
          status: "starter",
          isKeeper: true,
        },
      ];
      const { container } = render(
        <MatchLineup {...defaultProps} homeLineup={keeperLineup} />,
      );
      const badge = container.querySelector(".bg-warm");
      expect(badge).toBeInTheDocument();
      // The visible jersey number stays the accessible name; the keeper
      // designation is exposed via an sr-only sibling so screen readers
      // announce "1 Keeper" rather than overwriting the number.
      expect(badge).toHaveTextContent(/1\s*Keeper/);
    });

    it("renders an ink-bg number badge for outfield players", () => {
      const outfieldLineup: LineupPlayer[] = [
        {
          id: 1,
          name: "Outfield Player",
          number: 7,
          isCaptain: false,
          status: "starter",
          isKeeper: false,
        },
      ];
      const { container } = render(
        <MatchLineup
          {...defaultProps}
          homeLineup={outfieldLineup}
          awayLineup={[]}
        />,
      );
      expect(container.querySelector(".bg-ink")).toBeInTheDocument();
      expect(container.querySelector(".bg-warm")).not.toBeInTheDocument();
    });
  });

  describe("card indicators", () => {
    it("shows yellow card icon for players with yellow card", () => {
      const lineupWithYellowCard: LineupPlayer[] = [
        {
          id: 1,
          name: "Yellow Card Player",
          number: 5,
          isCaptain: false,
          status: "starter",
          card: "yellow",
        },
      ];
      render(
        <MatchLineup {...defaultProps} homeLineup={lineupWithYellowCard} />,
      );
      expect(screen.getByLabelText("Gele kaart")).toBeInTheDocument();
    });

    it("shows red card icon for players with red card", () => {
      const lineupWithRedCard: LineupPlayer[] = [
        {
          id: 1,
          name: "Red Card Player",
          number: 8,
          isCaptain: false,
          status: "starter",
          card: "red",
        },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={lineupWithRedCard} />);
      expect(screen.getByLabelText("Rode kaart")).toBeInTheDocument();
    });

    it("shows double yellow (yellow-red) card icon for players with second yellow", () => {
      const lineupWithDoubleYellow: LineupPlayer[] = [
        {
          id: 1,
          name: "Double Yellow Player",
          number: 3,
          isCaptain: false,
          status: "starter",
          card: "double_yellow",
        },
      ];
      render(
        <MatchLineup {...defaultProps} homeLineup={lineupWithDoubleYellow} />,
      );
      expect(screen.getByLabelText("Tweede gele kaart")).toBeInTheDocument();
    });

    it("shows card icon alongside captain indicator", () => {
      const lineupWithCardAndCaptain: LineupPlayer[] = [
        {
          id: 1,
          name: "Captain Yellow",
          number: 10,
          isCaptain: true,
          status: "starter",
          card: "yellow",
        },
      ];
      render(
        <MatchLineup
          {...defaultProps}
          homeLineup={lineupWithCardAndCaptain}
          awayLineup={[]}
        />,
      );
      expect(screen.getByText("[C]")).toBeInTheDocument();
      expect(screen.getByLabelText("Gele kaart")).toBeInTheDocument();
    });

    it("shows card icon for substituted players", () => {
      const lineupWithSubstitutedCard: LineupPlayer[] = [
        {
          id: 1,
          name: "Carded Sub",
          number: 9,
          minutesPlayed: 60,
          isCaptain: false,
          status: "substituted",
          card: "yellow",
        },
      ];
      render(
        <MatchLineup
          {...defaultProps}
          homeLineup={lineupWithSubstitutedCard}
        />,
      );
      expect(screen.getByLabelText("Gewisseld")).toBeInTheDocument();
      expect(screen.getByLabelText("Gele kaart")).toBeInTheDocument();
      expect(screen.getByText("60'")).toBeInTheDocument();
    });

    it("does not show card icon when player has no card", () => {
      const lineupWithoutCard: LineupPlayer[] = [
        {
          id: 1,
          name: "No Card Player",
          number: 11,
          isCaptain: false,
          status: "starter",
        },
      ];
      render(<MatchLineup {...defaultProps} homeLineup={lineupWithoutCard} />);
      expect(screen.queryByLabelText("Gele kaart")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Rode kaart")).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Tweede gele kaart"),
      ).not.toBeInTheDocument();
    });

    it("shows multiple different card types in same lineup", () => {
      const lineupWithMultipleCards: LineupPlayer[] = [
        {
          id: 1,
          name: "Yellow Player",
          number: 5,
          isCaptain: false,
          status: "starter",
          card: "yellow",
        },
        {
          id: 2,
          name: "Red Player",
          number: 8,
          isCaptain: false,
          status: "starter",
          card: "red",
        },
        {
          id: 3,
          name: "Double Yellow Player",
          number: 3,
          isCaptain: false,
          status: "starter",
          card: "double_yellow",
        },
      ];
      render(
        <MatchLineup {...defaultProps} homeLineup={lineupWithMultipleCards} />,
      );
      expect(screen.getByLabelText("Gele kaart")).toBeInTheDocument();
      expect(screen.getByLabelText("Rode kaart")).toBeInTheDocument();
      expect(screen.getByLabelText("Tweede gele kaart")).toBeInTheDocument();
    });

    // The defensive runtime `console.warn` for unknown CardType used to live
    // in the inline `CardIcon` switch. Phase 6.B (#1908) replaced it with
    // the shared `<CardGlyph>` which relies on TypeScript literal-union
    // exhaustiveness; the BFF's `decodeUnknown` rejects unknown values
    // before they reach the UI. Test removed.
  });
});
