/**
 * TeamOverview Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamOverview, type TeamData } from "./TeamOverview";

const mockYouthTeams: TeamData[] = [
  { name: "U15", href: "/team/u15", ageGroup: "U15", teamType: "youth" },
  { name: "U10", href: "/team/u10", ageGroup: "U10", teamType: "youth" },
  { name: "U17", href: "/team/u17", ageGroup: "U17", teamType: "youth" },
  { name: "U6", href: "/team/u6", ageGroup: "U6", teamType: "youth" },
];

const mockSeniorTeams: TeamData[] = [
  {
    name: "A-Ploeg",
    href: "/team/a-ploeg",
    tagline: "The A-Team",
    teamType: "senior",
  },
  { name: "B-Ploeg", href: "/team/b-ploeg", teamType: "senior" },
];

const _mockClubTeams: TeamData[] = [
  {
    name: "Bestuur",
    href: "/club/bestuur",
    tagline: "Het kloppend hart",
    teamType: "club",
  },
];

describe("TeamOverview", () => {
  describe("Rendering", () => {
    it("should render all teams", () => {
      render(<TeamOverview teams={mockYouthTeams} />);
      // Use getAllByText since team name appears in both badge and heading
      expect(screen.getAllByText("U15").length).toBeGreaterThan(0);
      expect(screen.getAllByText("U10").length).toBeGreaterThan(0);
      expect(screen.getAllByText("U17").length).toBeGreaterThan(0);
      expect(screen.getAllByText("U6").length).toBeGreaterThan(0);
    });

    it("should render team cards as links", () => {
      render(<TeamOverview teams={mockYouthTeams} />);
      const links = screen.getAllByRole("link");
      expect(links.length).toBe(mockYouthTeams.length);
    });

    it("should render correct number of teams", () => {
      render(<TeamOverview teams={mockYouthTeams} />);
      const articles = screen.getAllByRole("article");
      expect(articles.length).toBe(mockYouthTeams.length);
    });
  });

  describe("Sorting", () => {
    it("should sort youth teams by age (youngest first)", () => {
      render(<TeamOverview teams={mockYouthTeams} teamType="youth" />);
      const articles = screen.getAllByRole("article");
      const names = articles.map(
        (a) => within(a).getByRole("heading").textContent,
      );
      expect(names).toEqual(["U6", "U10", "U15", "U17"]);
    });

    it("should sort senior teams alphabetically", () => {
      render(<TeamOverview teams={mockSeniorTeams} teamType="senior" />);
      const articles = screen.getAllByRole("article");
      const names = articles.map(
        (a) => within(a).getByRole("heading").textContent,
      );
      expect(names).toEqual(["A-Ploeg", "B-Ploeg"]);
    });
  });

  describe("Filtering", () => {
    it("should filter teams by type", () => {
      const allTeams = [...mockYouthTeams, ...mockSeniorTeams];
      render(<TeamOverview teams={allTeams} teamType="youth" />);
      const articles = screen.getAllByRole("article");
      expect(articles.length).toBe(mockYouthTeams.length);
    });

    it("should show all teams when teamType is 'all'", () => {
      const allTeams = [...mockYouthTeams, ...mockSeniorTeams];
      render(<TeamOverview teams={allTeams} teamType="all" />);
      const articles = screen.getAllByRole("article");
      expect(articles.length).toBe(allTeams.length);
    });
  });

  describe("Filter Buttons", () => {
    it("should render filter buttons when showFilters is true", () => {
      render(
        <TeamOverview teams={mockYouthTeams} showFilters teamType="all" />,
      );
      expect(screen.getByText("Alle teams")).toBeInTheDocument();
      expect(screen.getByText("Senioren")).toBeInTheDocument();
      expect(screen.getByText("Jeugd")).toBeInTheDocument();
      expect(screen.getByText("Club")).toBeInTheDocument();
    });

    it("should not render filter buttons by default", () => {
      render(<TeamOverview teams={mockYouthTeams} />);
      expect(screen.queryByText("Alle teams")).not.toBeInTheDocument();
    });

    it("should filter teams when filter button is clicked", async () => {
      const user = userEvent.setup();
      const allTeams = [...mockYouthTeams, ...mockSeniorTeams];
      render(<TeamOverview teams={allTeams} showFilters teamType="all" />);

      // Initially all teams
      expect(screen.getAllByRole("article").length).toBe(allTeams.length);

      // Click youth filter
      await user.click(screen.getByText("Jeugd"));
      expect(screen.getAllByRole("article").length).toBe(mockYouthTeams.length);

      // Click senior filter
      await user.click(screen.getByText("Senioren"));
      expect(screen.getAllByRole("article").length).toBe(
        mockSeniorTeams.length,
      );
    });
  });

  describe("Grouping", () => {
    it("should group youth teams into 3 tiers when groupByAge is true", () => {
      const teamsWithVariousAges = [
        ...mockYouthTeams,
        { name: "U15B", href: "/u15b", ageGroup: "U15", teamType: "youth" },
        { name: "U8", href: "/u8", ageGroup: "U8", teamType: "youth" },
        { name: "U12", href: "/u12", ageGroup: "U12", teamType: "youth" },
      ] as TeamData[];

      render(
        <TeamOverview
          teams={teamsWithVariousAges}
          groupByAge
          teamType="youth"
        />,
      );
      // Should have 3-tier section headings
      expect(screen.getByText("Onderbouw (U6–U9)")).toBeInTheDocument();
      expect(screen.getByText("Middenbouw (U10–U13)")).toBeInTheDocument();
      expect(screen.getByText("Bovenbouw (U14–U21)")).toBeInTheDocument();

      // Old 7-category headings should NOT appear
      expect(screen.queryByText("Kleuters (U6-U7)")).not.toBeInTheDocument();
      expect(screen.queryByText("Duiveltjes (U8-U9)")).not.toBeInTheDocument();
      expect(screen.queryByText("Kadetten (U14-U15)")).not.toBeInTheDocument();

      // Bovenbouw should have U15, U15B, U17 = 3 teams
      const bovenbouw = screen
        .getByText("Bovenbouw (U14–U21)")
        .closest("section");
      expect(within(bovenbouw!).getAllByRole("article").length).toBe(3);
    });

    it("should group U21 teams in Bovenbouw tier", () => {
      const teamsWithU21: TeamData[] = [
        ...mockYouthTeams,
        { name: "U21", href: "/team/u21", ageGroup: "U21", teamType: "youth" },
      ];
      render(<TeamOverview teams={teamsWithU21} groupByAge teamType="youth" />);
      const bovenbouwHeading = screen.getByText("Bovenbouw (U14–U21)");
      expect(bovenbouwHeading).toBeInTheDocument();
      const bovenbouwSection = bovenbouwHeading.closest("section")!;
      expect(
        within(bovenbouwSection).getAllByText("U21").length,
      ).toBeGreaterThan(0);
    });

    it("should order tiers Bovenbouw first, then Middenbouw, then Onderbouw", () => {
      const teams: TeamData[] = [
        { name: "U6", href: "/u6", ageGroup: "U6", teamType: "youth" },
        { name: "U12", href: "/u12", ageGroup: "U12", teamType: "youth" },
        { name: "U17", href: "/u17", ageGroup: "U17", teamType: "youth" },
      ];
      const { container } = render(
        <TeamOverview teams={teams} groupByAge teamType="youth" />,
      );
      // Get only the direct section headings, not TeamCard h3s
      const sections = container.querySelectorAll("section");
      const tierNames = Array.from(sections).map(
        (s) => s.querySelector("h3")?.textContent,
      );
      expect(tierNames).toEqual([
        "Bovenbouw (U14–U21)",
        "Middenbouw (U10–U13)",
        "Onderbouw (U6–U9)",
      ]);
    });

    it("should group non-youth teams in Overig category when groupByAge is true", () => {
      const mixedTeams: TeamData[] = [...mockYouthTeams, ...mockSeniorTeams];
      render(<TeamOverview teams={mixedTeams} groupByAge />);
      expect(screen.getByText("Overig")).toBeInTheDocument();
    });

    it("should not group when groupByAge is false", () => {
      render(<TeamOverview teams={mockYouthTeams} teamType="youth" />);
      expect(screen.queryByText("Onderbouw (U6–U9)")).not.toBeInTheDocument();
      expect(screen.queryByText("Bovenbouw (U14–U21)")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should render loading skeletons when isLoading is true", () => {
      render(<TeamOverview teams={[]} isLoading />);
      expect(screen.getByLabelText("Teams laden...")).toBeInTheDocument();
    });

    it("should not render teams when loading", () => {
      render(<TeamOverview teams={mockYouthTeams} isLoading />);
      expect(screen.queryByText("U15")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty message when no teams", () => {
      render(<TeamOverview teams={[]} />);
      expect(screen.getByText("Geen teams gevonden")).toBeInTheDocument();
    });

    it("should render custom empty message", () => {
      render(<TeamOverview teams={[]} emptyMessage="No teams available" />);
      expect(screen.getByText("No teams available")).toBeInTheDocument();
    });

    it("should not render empty message when teams exist", () => {
      render(<TeamOverview teams={mockYouthTeams} />);
      expect(screen.queryByText("Geen teams gevonden")).not.toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("should use default grid variant by default", () => {
      const { container } = render(<TeamOverview teams={mockYouthTeams} />);
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("lg:grid-cols-3");
    });

    it("should use compact grid when variant is compact", () => {
      const { container } = render(
        <TeamOverview teams={mockYouthTeams} variant="compact" />,
      );
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <TeamOverview teams={mockYouthTeams} className="custom-class" />,
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  describe("Team Type Styling", () => {
    it("should render senior teams without age badges", () => {
      render(<TeamOverview teams={mockSeniorTeams} teamType="senior" />);
      // Senior teams shouldn't have badges
      const badges = screen.queryAllByTestId("team-badge");
      expect(badges).toHaveLength(0);
    });

    it("should render youth teams with age badges", () => {
      render(<TeamOverview teams={mockYouthTeams} teamType="youth" />);
      // Each youth team should have a badge
      const badges = screen.getAllByTestId("team-badge");
      expect(badges).toHaveLength(mockYouthTeams.length);
    });
  });

  describe("Age Group Parsing", () => {
    it("should handle teams without age groups", () => {
      const teamsWithoutAge: TeamData[] = [
        { name: "No Age", href: "/team/no-age", teamType: "youth" },
      ];
      render(<TeamOverview teams={teamsWithoutAge} groupByAge />);
      // Should render in "Overig" category
      expect(screen.getByText("Overig")).toBeInTheDocument();
    });

    it("should handle malformed age group strings", () => {
      const teamsWithMalformedAge: TeamData[] = [
        {
          name: "Weird Team",
          href: "/team/weird",
          ageGroup: "ABC",
          teamType: "youth",
        },
      ];
      render(<TeamOverview teams={teamsWithMalformedAge} groupByAge />);
      // Should still render the team
      expect(screen.getByText("Weird Team")).toBeInTheDocument();
    });
  });

  describe("Mixed Team Type Sorting", () => {
    it("should sort mixed team types correctly (youth, senior, club)", () => {
      const mixedTeams: TeamData[] = [
        ...mockSeniorTeams,
        ...mockYouthTeams,
        ..._mockClubTeams,
      ];
      render(<TeamOverview teams={mixedTeams} teamType="all" />);
      const articles = screen.getAllByRole("article");
      const names = articles.map(
        (a) => within(a).getByRole("heading").textContent,
      );
      // Youth teams should come first (sorted by age)
      expect(names[0]).toBe("U6");
      expect(names[1]).toBe("U10");
      expect(names[2]).toBe("U15");
      expect(names[3]).toBe("U17");
      // Then senior teams (alphabetically)
      expect(names[4]).toBe("A-Ploeg");
      expect(names[5]).toBe("B-Ploeg");
      // Then club teams
      expect(names[6]).toBe("Bestuur");
    });

    it("should default to senior team type if missing", () => {
      const teamWithoutType = { name: "Default FC", href: "/default" };
      const teamWithoutType2 = { name: "Another FC", href: "/another" };
      // "Default FC" should be treated as senior.
      // Comparison: "A-Ploeg" (senior) vs "Default FC" (senior implied)
      // Sort alphabetically
      const teams = [
        ...mockSeniorTeams, // A-Ploeg
        teamWithoutType,
        teamWithoutType2,
      ] as TeamData[];

      render(<TeamOverview teams={teams} teamType="all" />);
      const articles = screen.getAllByRole("article");
      const names = articles.map(
        (a) => within(a).getByRole("heading").textContent,
      );

      // "Default FC" comes after "A-Ploeg"
      expect(names).toContain("Default FC");
      expect(names).toContain("Another FC");
    });

    it("should filter club teams correctly", () => {
      const mixedTeams: TeamData[] = [
        ...mockSeniorTeams,
        ...mockYouthTeams,
        ..._mockClubTeams,
      ];
      render(<TeamOverview teams={mixedTeams} teamType="club" />);
      const articles = screen.getAllByRole("article");
      expect(articles.length).toBe(_mockClubTeams.length);
    });

    it("should sort unknown team types to the end", () => {
      const teamsWithUnknown: TeamData[] = [
        {
          name: "Alien Team",
          href: "/alien",
          teamType: "alien" as unknown as "senior",
        },
        mockSeniorTeams[0],
      ];
      render(<TeamOverview teams={teamsWithUnknown} teamType="all" />);
      const articles = screen.getAllByRole("article");
      const names = articles.map(
        (a) => within(a).getByRole("heading").textContent,
      );
      // "alien" type (order 3) should come after "senior" (order 1)
      expect(names).toEqual(["A-Ploeg", "Alien Team"]);
    });
  });

  describe("Compact Variant in Groups", () => {
    it("should pass compact variant to grouped teams", () => {
      render(
        <TeamOverview
          teams={mockYouthTeams}
          groupByAge
          variant="compact"
          teamType="youth"
        />,
      );
      // Check for compact grid classes in the grouped section
      // The grid container inside the section should have 4 cols on lg
      // We can look for the class directly or indirectly
      // Since we can't easily check props passed to child component without mocking,
      // we check the grid wrapper class which changes based on isCompact
      const grids = document.querySelectorAll(".grid");
      // One of the grids should have the compact class
      const hasCompactGrid = Array.from(grids).some((grid) =>
        grid.className.includes("lg:grid-cols-4"),
      );
      expect(hasCompactGrid).toBe(true);
    });
  });

  describe("Compact Loading State", () => {
    it("should use compact grid layout for loading skeleton", () => {
      render(<TeamOverview teams={[]} isLoading variant="compact" />);
      const grid = screen.getByLabelText("Teams laden...");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });
  });

  describe("Color Scheme", () => {
    it("should use dark text for group headings by default (light scheme)", () => {
      render(
        <TeamOverview teams={mockYouthTeams} groupByAge teamType="youth" />,
      );
      const heading = screen.getByText("Onderbouw (U6–U9)");
      expect(heading.className).toContain("text-gray-900");
    });

    it("should use white text for group headings when colorScheme is dark", () => {
      render(
        <TeamOverview
          teams={mockYouthTeams}
          groupByAge
          teamType="youth"
          colorScheme="dark"
        />,
      );
      const heading = screen.getByText("Onderbouw (U6–U9)");
      expect(heading.className).toContain("text-white");
      expect(heading.className).not.toContain("text-gray-900");
    });

    it("should use muted white text for empty state when colorScheme is dark", () => {
      render(<TeamOverview teams={[]} colorScheme="dark" />);
      const emptyMsg = screen.getByText("Geen teams gevonden");
      expect(emptyMsg.closest("div")?.className).toContain("text-white/60");
    });
  });
});
