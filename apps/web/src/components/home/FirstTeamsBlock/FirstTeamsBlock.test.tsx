import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { trackEvent } from "@/lib/analytics/track-event";
import { FirstTeamsBlock } from "./FirstTeamsBlock";
import type { FirstTeamVM } from "./first-teams";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

const aTeam: FirstTeamVM = {
  label: "A-ploeg",
  slug: "a-ploeg",
  division: "3de Nationale",
  result: {
    matchId: 101,
    home: { name: "KCVV Elewijt" },
    away: { name: "SK Londerzeel" },
    homeScore: 3,
    awayScore: 1,
    isHome: true,
    outcome: "win",
    date: new Date("2026-06-21T15:00:00Z"),
    competition: "3de Nationale",
  },
  fixture: {
    matchId: 102,
    opponent: { name: "Sporting Hasselt" },
    isHome: false,
    date: new Date("2026-06-29T13:00:00Z"),
    time: "15:00",
    competition: "3de Nationale",
  },
};

const bTeamFixtureOnly: FirstTeamVM = {
  label: "B-ploeg",
  slug: "b-ploeg",
  division: "2de Provinciale",
  fixture: {
    matchId: 202,
    opponent: { name: "VK Liedekerke" },
    isHome: true,
    date: new Date("2026-06-28T17:30:00Z"),
    time: "19:30",
  },
};

describe("FirstTeamsBlock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders team labels, divisions, and the result scoreline", () => {
    render(<FirstTeamsBlock teams={[aTeam]} />);
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
    expect(screen.getByText("3de Nationale")).toBeInTheDocument();
    expect(screen.getByText("Gewonnen")).toBeInTheDocument();
    expect(screen.getByText("3–1")).toBeInTheDocument();
    expect(screen.getByText("Sporting Hasselt")).toBeInTheDocument();
    expect(screen.getByText("15:00")).toBeInTheDocument();
  });

  it("deep-links each card to its own match detail", () => {
    render(<FirstTeamsBlock teams={[aTeam]} />);
    expect(
      screen.getByLabelText(/Uitslag KCVV Elewijt tegen SK Londerzeel/i),
    ).toHaveAttribute("href", "/wedstrijd/101");
    expect(
      screen.getByLabelText(/Volgende wedstrijd tegen Sporting Hasselt/i),
    ).toHaveAttribute("href", "/wedstrijd/102");
  });

  it("fires match_card_click on a card click", () => {
    render(<FirstTeamsBlock teams={[aTeam]} />);
    fireEvent.click(
      screen.getByLabelText(/Uitslag KCVV Elewijt tegen SK Londerzeel/i),
    );
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      team_slug: "a-ploeg",
      match_id: 101,
      source: "first_teams_result",
    });
  });

  it("shows a graceful skip placeholder for a missing result", () => {
    render(<FirstTeamsBlock teams={[bTeamFixtureOnly]} />);
    expect(screen.getByText("Nog geen uitslag")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Volgende wedstrijd tegen VK Liedekerke/i),
    ).toHaveAttribute("href", "/wedstrijd/202");
  });

  it("renders nothing when no team has a result or fixture", () => {
    const { container } = render(
      <FirstTeamsBlock
        teams={[
          { label: "A-ploeg", slug: "a-ploeg", division: "3de Nationale" },
        ]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("A-ploeg")).not.toBeInTheDocument();
  });
});
