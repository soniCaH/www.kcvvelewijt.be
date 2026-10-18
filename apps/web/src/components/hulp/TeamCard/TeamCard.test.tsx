import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { matchYouthTeams } from "@/lib/utils/match-youth-team";
import { TeamCard } from "./TeamCard";
import {
  TEAM_CARD_CALENDAR_YEAR,
  TEAM_CARD_NODES,
  TEAM_CARD_SEASON_YEAR,
  TEAM_CARD_TEAMS,
  withoutHolder,
} from "./team-card.fixture";

const forQuery = (query: string, teams = TEAM_CARD_TEAMS) =>
  matchYouthTeams(query, teams, TEAM_CARD_SEASON_YEAR, TEAM_CARD_CALENDAR_YEAR);

describe("TeamCard", () => {
  it('heads the TVJO with "Voor alle jeugd" when the card has sections', () => {
    render(<TeamCard result={forQuery("8 jaar")} nodes={TEAM_CARD_NODES} />);
    expect(
      screen.getByRole("heading", { name: "Voor alle jeugd" }),
    ).toBeInTheDocument();
    expect(document.body).toHaveTextContent("Tom Verhaegen");
  });

  it('drops the "Voor alle jeugd" heading when the TVJO box is vacant', () => {
    render(
      <TeamCard result={forQuery("8 jaar")} nodes={withoutHolder("TVJO")} />,
    );
    expect(
      screen.queryByRole("heading", { name: "Voor alle jeugd" }),
    ).toBeNull();
  });

  it("links to the team page's #staf section only when the team has staff", () => {
    const teams = TEAM_CARD_TEAMS.map((t) =>
      t.slug === "kcvve-u8-groen" ? { ...t, hasStaff: false } : t,
    );
    render(<TeamCard result={forQuery("U8", teams)} nodes={TEAM_CARD_NODES} />);
    expect(
      screen.getByRole("link", { name: "Staf van U8 Wit" }),
    ).toHaveAttribute("href", "/ploegen/kcvve-u8-wit#staf");
    expect(
      screen.getByRole("link", { name: "Staf van U8 Groen" }),
    ).toHaveAttribute("href", "/ploegen/kcvve-u8-groen");
  });
});
