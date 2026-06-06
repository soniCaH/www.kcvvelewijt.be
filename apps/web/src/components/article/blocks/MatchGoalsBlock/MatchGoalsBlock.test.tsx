import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchGoalsBlock } from "./MatchGoalsBlock";
import type { MatchEvent } from "@/components/match/MatchEvents";

const GOALS: MatchEvent[] = [
  { id: 1, type: "goal", minute: 23, team: "home", player: "Janssens" },
  { id: 2, type: "goal", minute: 55, team: "away", player: "Devos" },
];

const baseProps = {
  homeTeamName: "KCVV Elewijt",
  awayTeamName: "Racing Mechelen",
};

describe("MatchGoalsBlock", () => {
  it("renders the Doelpunten heading and the goal scorers", () => {
    render(<MatchGoalsBlock {...baseProps} events={GOALS} kcvvSide="home" />);
    expect(screen.getByText("Doelpunten.")).toBeInTheDocument();
    expect(screen.getByText("Janssens")).toBeInTheDocument();
    expect(screen.getByText("Devos")).toBeInTheDocument();
  });

  it("highlights KCVV scorers via the kcvvSide prop", () => {
    render(<MatchGoalsBlock {...baseProps} events={GOALS} kcvvSide="home" />);
    expect(screen.getByText("Janssens").parentElement?.className).toContain(
      "text-jersey-deep",
    );
    expect(screen.getByText("Devos").parentElement?.className).toContain(
      "text-ink",
    );
  });

  it("only includes goals — cards/subs are filtered out", () => {
    const mixed: MatchEvent[] = [
      ...GOALS,
      { id: 3, type: "yellow_card", minute: 40, team: "away", player: "Maes" },
      {
        id: 4,
        type: "substitution",
        minute: 60,
        team: "home",
        playerIn: "In",
        playerOut: "Out",
      },
    ];
    render(<MatchGoalsBlock {...baseProps} events={mixed} kcvvSide="home" />);
    expect(screen.getByText("Janssens")).toBeInTheDocument();
    expect(screen.queryByText("Maes")).not.toBeInTheDocument();
    expect(screen.queryByText("In")).not.toBeInTheDocument();
  });

  it("renders nothing when the match has no goals (preview / 0-0)", () => {
    const noGoals: MatchEvent[] = [
      { id: 1, type: "yellow_card", minute: 40, team: "away", player: "Maes" },
    ];
    const { container } = render(
      <MatchGoalsBlock {...baseProps} events={noGoals} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an empty events array", () => {
    const { container } = render(
      <MatchGoalsBlock {...baseProps} events={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
