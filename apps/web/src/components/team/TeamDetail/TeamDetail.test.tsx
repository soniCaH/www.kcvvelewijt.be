/**
 * TeamDetail Component Tests
 *
 * Smoke + structure tests for the redesigned TeamDetail. The team panel
 * children (TeamRoster, TeamSchedule, TeamStandings) have their own test
 * files, so these tests focus on the SectionStack scaffolding, conditional
 * tab visibility, and the default-active tab.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("renders the InteriorPageHero with the team name as headline", () => {
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
    // Info is intentionally omitted when there is no contact info / body
    // copy and staff is already surfaced on the Spelers tab — showing an
    // empty Info tab alongside real content panels is confusing.
    expect(tabLabels).toEqual(["Spelers", "Wedstrijden", "Klassement"]);
  });

  it("adds the Info tab when contactInfo or bodyContent is present alongside other tabs", () => {
    render(
      <TeamDetail
        header={header}
        contactInfo="<p>Contact details</p>"
        players={players}
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

  it("falls back to the first available tab when only matches are present", () => {
    render(
      <TeamDetail header={header} matches={matches} highlightTeamId={12345} />,
    );
    // Info is skipped (no contact info / body copy / staff), Spelers is
    // skipped (no players), so Wedstrijden becomes the only tab and the
    // default selection.
    const tabLabels = screen
      .getAllByRole("tab")
      .map((t) => t.textContent?.trim());
    expect(tabLabels).toEqual(["Wedstrijden"]);
    const active = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("aria-selected") === "true");
    expect(active).toHaveAccessibleName("Wedstrijden");
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

  it("falls back to the default tab when ?tab= is an unknown id", () => {
    mockSearchParams = new URLSearchParams("tab=does-not-exist");
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
    // Default tab when players are present is Spelers — not the stale value.
    expect(active).toHaveAccessibleName("Spelers");
  });

  it("pushes the new tab to the router when switching tabs", () => {
    render(
      <TeamDetail
        header={header}
        players={players}
        matches={matches}
        highlightTeamId={12345}
      />,
    );
    // Default selected tab is Spelers (when players are present).
    fireEvent.click(screen.getByRole("tab", { name: "Wedstrijden" }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      "/ploegen/a-ploeg?tab=wedstrijden",
      expect.objectContaining({ scroll: false }),
    );
  });

  it("strips the ?tab= query when switching to the default tab", () => {
    mockSearchParams = new URLSearchParams("tab=wedstrijden");
    render(
      <TeamDetail
        header={header}
        players={players}
        matches={matches}
        highlightTeamId={12345}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Spelers" }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    // Default tab (Spelers) is represented as "no tab query".
    expect(mockPush).toHaveBeenCalledWith(
      "/ploegen/a-ploeg",
      expect.objectContaining({ scroll: false }),
    );
  });

  it("does not push when clicking the already-active tab", () => {
    render(
      <TeamDetail
        header={header}
        players={players}
        matches={matches}
        highlightTeamId={12345}
      />,
    );
    // Default is Spelers — clicking it again must not trigger a router push.
    fireEvent.click(screen.getByRole("tab", { name: "Spelers" }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders division badge in hero label for youth teams", () => {
    const youthHeader: TeamDetailHeader = {
      name: "KCVV Elewijt U15",
      teamType: "youth",
      ageGroup: "U15",
    };
    render(<TeamDetail header={youthHeader} />);
    expect(screen.getByText(/Jeugd.*Middenbouw/)).toBeInTheDocument();
  });

  it("does not render division badge for senior teams", () => {
    render(<TeamDetail header={header} />);
    expect(screen.getByText("Eerste ploeg")).toBeInTheDocument();
    expect(
      screen.queryByText(/Bovenbouw|Middenbouw|Onderbouw/),
    ).not.toBeInTheDocument();
  });

  it("renders the closing CTA pointing at /hulp", () => {
    render(<TeamDetail header={header} />);
    const cta = screen.getByRole("link", { name: /meer info/i });
    expect(cta).toHaveAttribute("href", "/hulp");
  });
});
