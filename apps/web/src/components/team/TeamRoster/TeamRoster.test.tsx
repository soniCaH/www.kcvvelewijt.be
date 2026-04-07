/**
 * TeamRoster Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TeamRoster, type RosterPlayer, type StaffMember } from "./TeamRoster";
import type { PlayerCardProps } from "../../player/PlayerCard";

const mockPlayers: RosterPlayer[] = [
  {
    id: "1",
    firstName: "Kevin",
    lastName: "Van Ransbeeck",
    position: "Keeper",
    number: 1,
    href: "/speler/kevin-van-ransbeeck",
  },
  {
    id: "2",
    firstName: "Jan",
    lastName: "Peeters",
    position: "Verdediger",
    number: 2,
    href: "/speler/jan-peeters",
  },
  {
    id: "3",
    firstName: "Thomas",
    lastName: "Maes",
    position: "Verdediger",
    number: 4,
    href: "/speler/thomas-maes",
  },
  {
    id: "4",
    firstName: "Wouter",
    lastName: "Vermeersch",
    position: "Middenvelder",
    number: 6,
    href: "/speler/wouter-vermeersch",
  },
  {
    id: "5",
    firstName: "Stijn",
    lastName: "Claes",
    position: "Middenvelder",
    number: 8,
    href: "/speler/stijn-claes",
  },
  {
    id: "6",
    firstName: "Bert",
    lastName: "Goossens",
    position: "Aanvaller",
    number: 9,
    href: "/speler/bert-goossens",
  },
];

// Mock PlayerCard to avoid Next-Link strict prop checks and isolate TeamRoster logic
vi.mock("../../player/PlayerCard", () => ({
  PlayerCard: ({ isLoading, firstName, lastName, href }: PlayerCardProps) => {
    if (isLoading) return <div data-testid="player-card-skeleton" />;
    return (
      <article>
        <a
          href={href}
          aria-label={`${firstName} ${lastName}`} // Simplified label for testing
        >
          {firstName} {lastName}
        </a>
      </article>
    );
  },
}));

const mockStaff: StaffMember[] = [
  {
    id: "staff-1",
    firstName: "Marc",
    lastName: "Van den Berg",
    role: "Hoofdtrainer",
  },
  {
    id: "staff-2",
    firstName: "Dirk",
    lastName: "Hermans",
    role: "Assistent-trainer",
  },
];

describe("TeamRoster", () => {
  describe("Rendering", () => {
    it("should render all players", () => {
      render(<TeamRoster players={mockPlayers} />);
      const articles = screen.getAllByRole("article");
      expect(articles.length).toBe(mockPlayers.length);
    });

    it("should render player cards as links", () => {
      render(<TeamRoster players={mockPlayers} />);
      const links = screen.getAllByRole("link");
      expect(links.length).toBe(mockPlayers.length);
    });

    it("should have accessible region with team name", () => {
      render(<TeamRoster players={mockPlayers} teamName="A-Ploeg" />);
      expect(screen.getByRole("region")).toHaveAttribute(
        "aria-label",
        "A-Ploeg selectie",
      );
    });
  });

  describe("Position Grouping", () => {
    it("should group players by position when groupByPosition is true", () => {
      render(<TeamRoster players={mockPlayers} groupByPosition />);
      expect(screen.getByText("Keeper")).toBeInTheDocument();
      expect(screen.getByText("Verdedigers")).toBeInTheDocument();
      expect(screen.getByText("Middenvelders")).toBeInTheDocument();
      expect(screen.getByText("Aanvaller")).toBeInTheDocument();
    });

    it("should show player count per position", () => {
      render(<TeamRoster players={mockPlayers} groupByPosition />);
      // Keepers: 1, Verdedigers: 2, Middenvelders: 2, Aanvallers: 1
      expect(screen.getAllByText("(1)").length).toBe(2);
      expect(screen.getAllByText("(2)").length).toBe(2);
    });

    it("should not show position headers when groupByPosition is false", () => {
      render(<TeamRoster players={mockPlayers} groupByPosition={false} />);
      expect(screen.queryByText("Keeper")).not.toBeInTheDocument();
      expect(screen.queryByText("Verdedigers")).not.toBeInTheDocument();
    });

    it("should order positions correctly (GK, DEF, MID, FWD)", () => {
      render(<TeamRoster players={mockPlayers} groupByPosition />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      const headingTexts = headings.map((h) => h.textContent);
      expect(headingTexts[0]).toContain("Keeper");
      expect(headingTexts[1]).toContain("Verdedigers");
      expect(headingTexts[2]).toContain("Middenvelders");
      expect(headingTexts[3]).toContain("Aanvaller");
    });
  });

  describe("Sorting", () => {
    it("should sort players by position order", () => {
      const shuffledPlayers = [
        mockPlayers[5], // Aanvaller
        mockPlayers[0], // Keeper
        mockPlayers[3], // Middenvelder
        mockPlayers[1], // Verdediger
      ];
      render(<TeamRoster players={shuffledPlayers} groupByPosition={false} />);
      const articles = screen.getAllByRole("article");
      expect(within(articles[0]).getByRole("link")).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Kevin"),
      );
    });

    it("should sort players within same position by number", () => {
      const players: RosterPlayer[] = [
        {
          id: "a",
          firstName: "Player",
          lastName: "Ten",
          position: "Middenvelder",
          number: 10,
          href: "/a",
        },
        {
          id: "b",
          firstName: "Player",
          lastName: "Six",
          position: "Middenvelder",
          number: 6,
          href: "/b",
        },
      ];
      render(<TeamRoster players={players} groupByPosition />);
      const links = screen.getAllByRole("link");
      expect(links[1]).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Ten"),
      );
    });

    it("should place players without number at the end", () => {
      const players: RosterPlayer[] = [
        {
          id: "a",
          firstName: "Player",
          lastName: "NoNumber",
          position: "Middenvelder",
          href: "/a",
        },
        {
          id: "b",
          firstName: "Player",
          lastName: "NumberOne",
          position: "Middenvelder",
          number: 1,
          href: "/b",
        },
      ];
      render(<TeamRoster players={players} groupByPosition />);
      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute(
        "aria-label",
        expect.stringContaining("NumberOne"),
      );
      expect(links[1]).toHaveAttribute(
        "aria-label",
        expect.stringContaining("NoNumber"),
      );
    });
  });

  describe("Staff Section", () => {
    it("should render staff when showStaff is true", () => {
      render(<TeamRoster players={mockPlayers} staff={mockStaff} showStaff />);
      expect(screen.getByText("Technische Staf")).toBeInTheDocument();
      expect(screen.getByText("Marc")).toBeInTheDocument();
      expect(screen.getByText("Van den Berg")).toBeInTheDocument();
    });

    it("should not render staff when showStaff is false", () => {
      render(<TeamRoster players={mockPlayers} staff={mockStaff} />);
      expect(screen.queryByText("Technische Staf")).not.toBeInTheDocument();
    });

    it("should not render staff section when staff array is empty", () => {
      render(<TeamRoster players={mockPlayers} staff={[]} showStaff />);
      expect(screen.queryByText("Technische Staf")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should render grouped loading skeletons when isLoading is true", () => {
      render(<TeamRoster players={[]} isLoading teamName="A-Ploeg" />);
      expect(
        screen.getByLabelText("A-Ploeg selectie laden..."),
      ).toBeInTheDocument();
    });

    it("should render flat loading skeleton when groupByPosition is false", () => {
      render(
        <TeamRoster
          players={[]}
          isLoading
          groupByPosition={false}
          teamName="A-Ploeg"
        />,
      );
      expect(
        screen.getByLabelText("A-Ploeg selectie laden..."),
      ).toBeInTheDocument();
    });

    it("should not render players when loading", () => {
      render(<TeamRoster players={mockPlayers} isLoading />);
      expect(
        screen.queryByText("Kevin", { exact: false }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty message when no players and no staff", () => {
      render(<TeamRoster players={[]} />);
      expect(screen.getByText("Geen spelers gevonden")).toBeInTheDocument();
    });

    it("should render custom empty message", () => {
      render(
        <TeamRoster players={[]} emptyMessage="Geen selectie beschikbaar" />,
      );
      expect(screen.getByText("Geen selectie beschikbaar")).toBeInTheDocument();
    });

    it("should show staff even when no players", () => {
      render(<TeamRoster players={[]} staff={mockStaff} showStaff />);
      expect(
        screen.queryByText("Geen spelers gevonden"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Technische Staf")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("should render a responsive grid", () => {
      const { container } = render(<TeamRoster players={mockPlayers} />);
      const grids = container.querySelectorAll(".grid");
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <TeamRoster players={mockPlayers} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Staff with Images", () => {
    it("should render staff member with image", () => {
      const staffWithImage: StaffMember[] = [
        {
          id: "staff-img",
          firstName: "John",
          lastName: "Doe",
          role: "Trainer",
          functionTitle: "T1",
          imageUrl: "/images/staff/john-doe.jpg",
        },
      ];
      render(
        <TeamRoster players={mockPlayers} staff={staffWithImage} showStaff />,
      );
      const image = screen.getByAltText("John Doe");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src");
    });

    it("should render staff member without functionTitle", () => {
      const staffWithoutCode: StaffMember[] = [
        {
          id: "staff-no-code",
          firstName: "Jane",
          lastName: "Smith",
          role: "Verzorger",
        },
      ];
      render(
        <TeamRoster players={mockPlayers} staff={staffWithoutCode} showStaff />,
      );
      expect(screen.getByText("Jane")).toBeInTheDocument();
      expect(screen.getByText("Smith")).toBeInTheDocument();
    });
  });

  describe("Unknown Position Handling", () => {
    it("should handle players with unknown positions", () => {
      const playersWithUnknown: RosterPlayer[] = [
        ...mockPlayers,
        {
          id: "7",
          firstName: "Unknown",
          lastName: "Player",
          position: "UnknownPosition",
          number: 99,
          href: "/speler/unknown",
        },
      ];
      render(<TeamRoster players={playersWithUnknown} groupByPosition />);
      const articles = screen.getAllByRole("article");
      expect(articles.length).toBe(playersWithUnknown.length);
    });

    it("should sort unknown positions last", () => {
      const playersWithUnknown: RosterPlayer[] = [
        {
          id: "unknown",
          firstName: "Unknown",
          lastName: "Position",
          position: "Mystery",
          number: 1,
          href: "/unknown",
        },
        mockPlayers[0], // Keeper
      ];
      render(<TeamRoster players={playersWithUnknown} groupByPosition />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings[0].textContent).toContain("Keeper");
    });
  });

  describe("Key Generation", () => {
    it("should generate key from name when id and href are missing (grouped)", () => {
      const playersWithoutIdOrHref = [
        {
          firstName: "No",
          lastName: "ID",
          position: "Keeper",
          number: 1,
        } as unknown as RosterPlayer,
      ];

      render(<TeamRoster players={playersWithoutIdOrHref} groupByPosition />);
      expect(screen.getByText("No ID")).toBeInTheDocument();
    });

    it("should generate key from name when id and href are missing (flat)", () => {
      const playersWithoutIdOrHref = [
        {
          firstName: "No",
          lastName: "ID",
          position: "Keeper",
          number: 1,
        } as unknown as RosterPlayer,
      ];

      render(
        <TeamRoster players={playersWithoutIdOrHref} groupByPosition={false} />,
      );
      expect(screen.getByText("No ID")).toBeInTheDocument();
    });
  });

  describe("Staff Key Generation", () => {
    it("should generate key from name when staff id is missing", () => {
      const staffWithoutId = [
        {
          firstName: "No",
          lastName: "ID",
          role: "Role",
        } as StaffMember,
      ];
      render(<TeamRoster players={[]} staff={staffWithoutId} showStaff />);
      expect(screen.getByText("No")).toBeInTheDocument();
      expect(screen.getByText("ID")).toBeInTheDocument();
    });
  });
});
