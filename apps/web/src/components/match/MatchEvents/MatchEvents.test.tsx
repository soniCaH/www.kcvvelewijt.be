/**
 * MatchEvents Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatchEvents, type MatchEvent } from "./MatchEvents";

describe("MatchEvents", () => {
  const events: MatchEvent[] = [
    {
      id: 1,
      type: "goal",
      minute: 12,
      team: "home",
      player: "Jonas Vermeersch",
      assist: "Pieter Janssen",
    },
    {
      id: 2,
      type: "yellow_card",
      minute: 23,
      team: "away",
      player: "Marc Declercq",
    },
    {
      id: 3,
      type: "substitution",
      minute: 45,
      team: "home",
      playerIn: "Kevin Mertens",
      playerOut: "Thomas Peeters",
    },
    {
      id: 4,
      type: "goal",
      minute: 67,
      team: "away",
      player: "Yannick Hermans",
    },
    {
      id: 5,
      type: "red_card",
      minute: 78,
      team: "away",
      player: "Marc Declercq",
    },
  ];

  const defaultProps = {
    homeTeamName: "KCVV Elewijt",
    awayTeamName: "KFC Turnhout",
    events,
  };

  describe("rendering", () => {
    it("renders player names", () => {
      render(<MatchEvents {...defaultProps} />);
      expect(screen.getByText("Jonas Vermeersch")).toBeInTheDocument();
      expect(screen.getByText("Yannick Hermans")).toBeInTheDocument();
    });

    it("renders event minutes", () => {
      render(<MatchEvents {...defaultProps} />);
      expect(screen.getByText("12'")).toBeInTheDocument();
      expect(screen.getByText("23'")).toBeInTheDocument();
      expect(screen.getByText("45'")).toBeInTheDocument();
    });

    it("renders assist info for goals", () => {
      render(<MatchEvents {...defaultProps} />);
      expect(screen.getByText(/Pieter Janssen/)).toBeInTheDocument();
    });

    it("renders substitution players", () => {
      render(<MatchEvents {...defaultProps} />);
      expect(screen.getByText("Kevin Mertens")).toBeInTheDocument();
      expect(screen.getByText("Thomas Peeters")).toBeInTheDocument();
    });

    it("renders a team-logo chip per event row in chronological mode", () => {
      render(<MatchEvents {...defaultProps} />);
      // The default fixture has 5 home events + 4 away events = 9 total.
      // The typographic-shield fallback renders a "K" chip for KCVV and a
      // "K" chip for KFC. Both teams' names start with K, so just look for
      // the aria-label = full team name.
      expect(
        screen.getAllByLabelText("KCVV Elewijt").length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByLabelText("KFC Turnhout").length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("event icons", () => {
    it("shows icons by default", () => {
      render(<MatchEvents {...defaultProps} />);
      // Icons should have aria-labels (multiple goals exist)
      const goalIcons = screen.getAllByLabelText("Doelpunt");
      expect(goalIcons.length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Gele kaart")).toBeInTheDocument();
      expect(screen.getByLabelText("Rode kaart")).toBeInTheDocument();
      expect(screen.getByLabelText("Wissel")).toBeInTheDocument();
    });

    it("hides icons when showIcons is false", () => {
      render(<MatchEvents {...defaultProps} showIcons={false} />);
      expect(screen.queryByLabelText("Doelpunt")).not.toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    it("shows all events by default", () => {
      render(<MatchEvents {...defaultProps} />);
      expect(screen.getByText("Jonas Vermeersch")).toBeInTheDocument();
      expect(screen.getAllByText("Marc Declercq").length).toBe(2); // yellow and red card
      expect(screen.getByText("Kevin Mertens")).toBeInTheDocument();
    });

    it("filters to goals only", () => {
      render(<MatchEvents {...defaultProps} filter="goals" />);
      expect(screen.getByText("Jonas Vermeersch")).toBeInTheDocument();
      expect(screen.getByText("Yannick Hermans")).toBeInTheDocument();
      expect(screen.queryByText("Kevin Mertens")).not.toBeInTheDocument();
    });

    it("filters to cards only", () => {
      render(<MatchEvents {...defaultProps} filter="cards" />);
      // Marc Declercq has both yellow and red cards
      expect(screen.getAllByText("Marc Declercq").length).toBe(2);
      expect(screen.queryByText("Jonas Vermeersch")).not.toBeInTheDocument();
    });

    it('treats second_yellow as a card in filter="cards"', () => {
      // Regression test for #1908: when the BFF stopped collapsing 2nd-yellow
      // into red_card, the `cards` filter could have silently excluded the
      // new event type if not also widened.
      const eventsWithSecondYellow: MatchEvent[] = [
        {
          id: 1,
          type: "second_yellow",
          minute: 82,
          team: "home",
          player: "Doppelganger Player",
        },
        {
          id: 2,
          type: "goal",
          minute: 10,
          team: "home",
          player: "Goal Scorer",
        },
      ];
      render(
        <MatchEvents
          {...defaultProps}
          events={eventsWithSecondYellow}
          filter="cards"
        />,
      );
      expect(screen.getByText("Doppelganger Player")).toBeInTheDocument();
      expect(screen.queryByText("Goal Scorer")).not.toBeInTheDocument();
    });

    it("filters to substitutions only", () => {
      render(<MatchEvents {...defaultProps} filter="substitutions" />);
      expect(screen.getByText("Kevin Mertens")).toBeInTheDocument();
      expect(screen.getByText("Thomas Peeters")).toBeInTheDocument();
      expect(screen.queryByText("Jonas Vermeersch")).not.toBeInTheDocument();
    });
  });

  describe("grouping", () => {
    it("groups chronologically by default", () => {
      const { container } = render(<MatchEvents {...defaultProps} />);
      // Chronological mode renders a flat <ol> (not the two-column team grid)
      // — the outer wrapper is an ordered list and every row owns a 4-col grid.
      expect(container.querySelector("ol")).toBeInTheDocument();
      // The two-column team grid only exists in groupBy="team" mode.
      expect(
        container.querySelector(".md\\:grid-cols-2"),
      ).not.toBeInTheDocument();
    });

    it("groups by team when specified", () => {
      const { container } = render(
        <MatchEvents {...defaultProps} groupBy="team" />,
      );
      // groupBy="team" wraps a 2-column md grid around per-team lists.
      expect(container.querySelector(".md\\:grid-cols-2")).toBeInTheDocument();
      // Should show both team headers (full team name in the column headers).
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
    });
  });

  describe("special events", () => {
    it("shows penalty indicator", () => {
      const penaltyEvents: MatchEvent[] = [
        {
          id: 1,
          type: "goal",
          minute: 45,
          team: "home",
          player: "Test Player",
          isPenalty: true,
        },
      ];
      render(<MatchEvents {...defaultProps} events={penaltyEvents} />);
      // Phase 6.B copy: "(pen)" → "(strafschop)" per d3 lock.
      expect(screen.getByText("(strafschop)")).toBeInTheDocument();
    });

    it("shows own goal indicator", () => {
      const ownGoalEvents: MatchEvent[] = [
        {
          id: 1,
          type: "goal",
          minute: 45,
          team: "away",
          player: "Test Player",
          isOwnGoal: true,
        },
      ];
      render(<MatchEvents {...defaultProps} events={ownGoalEvents} />);
      expect(screen.getByText("(e.d.)")).toBeInTheDocument();
    });

    it("shows additional time", () => {
      const addTimeEvents: MatchEvent[] = [
        {
          id: 1,
          type: "goal",
          minute: 90,
          additionalTime: 3,
          team: "home",
          player: "Test Player",
        },
      ];
      render(<MatchEvents {...defaultProps} events={addTimeEvents} />);
      expect(screen.getByText("90+3'")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows message when no events", () => {
      render(
        <MatchEvents
          homeTeamName="KCVV Elewijt"
          awayTeamName="KFC Turnhout"
          events={[]}
        />,
      );
      expect(
        screen.getByText("Nog geen gebeurtenissen in deze wedstrijd."),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(<MatchEvents {...defaultProps} isLoading />);
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render events when loading", () => {
      render(<MatchEvents {...defaultProps} isLoading />);
      expect(screen.queryByText("Jonas Vermeersch")).not.toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MatchEvents {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("edge cases", () => {
    // The defensive runtime branch for unknown event types used to live in
    // the `EventGlyph` / `EventDescription` default cases. Phase 6.B (#1908)
    // replaced it with `assertNever` so future `MatchEventType` additions
    // surface as TS compile errors. The BFF rejects unknown values via
    // schema decode before they ever reach the UI; the runtime defence
    // wasn't load-bearing. Test removed.

    it("shows no events message for team with no events in team grouping", () => {
      // Only home team events, away team should show empty message
      const homeOnlyEvents: MatchEvent[] = [
        {
          id: 1,
          type: "goal",
          minute: 12,
          team: "home",
          player: "Home Player",
        },
      ];
      render(
        <MatchEvents
          {...defaultProps}
          events={homeOnlyEvents}
          groupBy="team"
        />,
      );
      // Away team column should show "Geen gebeurtenissen"
      expect(screen.getByText("Geen gebeurtenissen")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts events by minute", () => {
      const unsortedEvents: MatchEvent[] = [
        { id: 1, type: "goal", minute: 67, team: "home", player: "Player C" },
        { id: 2, type: "goal", minute: 12, team: "away", player: "Player A" },
        { id: 3, type: "goal", minute: 45, team: "home", player: "Player B" },
      ];
      render(<MatchEvents {...defaultProps} events={unsortedEvents} />);
      // Get minute elements by their specific text content
      const minute12 = screen.getByText("12'");
      const minute45 = screen.getByText("45'");
      const minute67 = screen.getByText("67'");

      // Verify all minutes are present (order verified by DOM position)
      expect(minute12).toBeInTheDocument();
      expect(minute45).toBeInTheDocument();
      expect(minute67).toBeInTheDocument();

      // Verify order by checking that 12' comes before 45' which comes before 67'
      const allMinuteElements = screen.getAllByText(/^\d+'$/);
      expect(allMinuteElements[0]).toHaveTextContent("12'");
      expect(allMinuteElements[1]).toHaveTextContent("45'");
      expect(allMinuteElements[2]).toHaveTextContent("67'");
    });
  });
});
