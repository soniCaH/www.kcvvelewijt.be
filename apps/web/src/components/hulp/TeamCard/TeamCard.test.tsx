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

  it("explains a birth year with no team of its own and offers the next one up", () => {
    render(
      <TeamCard result={forQuery("geboren in 2009")} nodes={TEAM_CARD_NODES} />,
    );
    expect(document.body).toHaveTextContent("Geboren in 2009 = U18");
    expect(document.body).toHaveTextContent(
      "We hebben geen U18. Spelers van die leeftijd spelen bij de U19.",
    );
  });

  it("adds the late-born note under a birth year with a regional team below", () => {
    render(
      <TeamCard result={forQuery("geboren in 2018")} nodes={TEAM_CARD_NODES} />,
    );
    expect(document.body).toHaveTextContent("Geboren in 2018");
    expect(document.body).not.toHaveTextContent("We hebben geen");
    expect(document.body).toHaveTextContent(
      "Geboren tussen juli en december? Dan mag je kind ook in de U8 spelen",
    );
    expect(
      screen.getByRole("link", { name: "Staf van U8 Wit" }),
    ).toBeInTheDocument();
  });

  it("keeps one plain section when both birth years of an age land on one team", () => {
    // 17: born 2009 (U18, so the U19) or 2008 (U19) — one match.
    render(<TeamCard result={forQuery("17 jaar")} nodes={TEAM_CARD_NODES} />);
    expect(document.body).toHaveTextContent("17 jaar");
    expect(document.body).not.toHaveTextContent(
      "hangt af van het geboortejaar",
    );
    expect(
      screen.getByRole("link", { name: "Staf van U19" }),
    ).toBeInTheDocument();
  });
});
