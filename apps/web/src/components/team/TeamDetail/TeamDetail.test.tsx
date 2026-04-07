/**
 * TeamDetail Component Tests
 *
 * Smoke + structure tests for the redesigned TeamDetail. The team panel
 * children (TeamRoster, TeamSchedule, TeamStandings) have their own test
 * files, so these tests focus on the SectionStack scaffolding, conditional
 * tab visibility, and the default-active tab.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamDetail, type TeamDetailHeader } from "./TeamDetail";
import type { RosterPlayer, StaffMember } from "../TeamRoster";
import type { ScheduleMatch } from "../TeamSchedule";
import type { StandingsEntry } from "../TeamStandings";

// next/navigation hooks used by TeamDetailTabs
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/ploegen/a-ploeg",
  useSearchParams: () => mockSearchParams,
}));

const header: TeamDetailHeader = {
  name: "Eerste Ploeg",
  tagline: "3de Nationale A",
  teamType: "senior",
};

const players: RosterPlayer[] = [
  {
    id: "p1",
    firstName: "Kevin",
    lastName: "De Bruyne",
    position: "Middenvelder",
    number: 7,
    href: "/spelers/kevin-de-bruyne",
  },
];

const staff: StaffMember[] = [
  {
    id: "s1",
    firstName: "Marc",
    lastName: "Janssen",
    role: "Hoofdtrainer",
    functionTitle: "T1",
  },
];

const matches: ScheduleMatch[] = [
  {
    id: 1,
    date: new Date("2026-04-12T15:00:00Z"),
    time: "15:00",
    homeTeam: { id: 12345, name: "KCVV Elewijt" },
    awayTeam: { id: 67890, name: "Strombeek" },
    status: "scheduled",
    competition: "3de Nationale A",
  },
];

const standings: StandingsEntry[] = [
  {
    position: 1,
    teamId: 12345,
    teamName: "KCVV Elewijt",
    played: 10,
    won: 8,
    drawn: 1,
    lost: 1,
    goalsFor: 22,
    goalsAgainst: 8,
    goalDifference: 14,
    points: 25,
  },
];

describe("TeamDetail", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it("renders the PageHero with the team name as headline", () => {
    render(<TeamDetail header={header} />);
    expect(
      screen.getByRole("heading", { name: /eerste ploeg/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("3de Nationale A")).toBeInTheDocument();
  });

  it("only shows the Info tab when no other data is provided", () => {
    render(<TeamDetail header={header} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveAccessibleName("Info");
  });

  it("shows Spelers + Wedstrijden + Klassement tabs when data is present", () => {
    render(
      <TeamDetail
        header={header}
        players={players}
        staff={staff}
        matches={matches}
        standings={standings}
        highlightTeamId={12345}
      />,
    );
    const tabLabels = screen
      .getAllByRole("tab")
      .map((t) => t.textContent?.trim());
    expect(tabLabels).toEqual(["Info", "Spelers", "Wedstrijden", "Klassement"]);
  });

  it("defaults to the Spelers tab when players are present", () => {
    render(<TeamDetail header={header} players={players} />);
    const active = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("aria-selected") === "true");
    expect(active).toHaveAccessibleName("Spelers");
  });

  it("defaults to the Info tab when there are no players or staff", () => {
    render(
      <TeamDetail header={header} matches={matches} highlightTeamId={12345} />,
    );
    const active = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("aria-selected") === "true");
    expect(active).toHaveAccessibleName("Info");
  });

  it("does not add a Spelers tab when only staff is present (staff renders in Info)", () => {
    render(<TeamDetail header={header} staff={staff} />);
    const tabLabels = screen
      .getAllByRole("tab")
      .map((t) => t.textContent?.trim());
    expect(tabLabels).not.toContain("Spelers");
    // The default tab should be Info (the only tab in this case)
    const active = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("aria-selected") === "true");
    expect(active).toHaveAccessibleName("Info");
  });

  it("respects the ?tab= URL parameter", () => {
    mockSearchParams = new URLSearchParams("tab=wedstrijden");
    render(
      <TeamDetail
        header={header}
        players={players}
        matches={matches}
        highlightTeamId={12345}
      />,
    );
    const active = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("aria-selected") === "true");
    expect(active).toHaveAccessibleName("Wedstrijden");
  });

  it("renders the closing CTA pointing at /hulp", () => {
    render(<TeamDetail header={header} />);
    const cta = screen.getByRole("link", { name: /meer info/i });
    expect(cta).toHaveAttribute("href", "/hulp");
  });
});
