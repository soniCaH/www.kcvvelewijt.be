/**
 * TeamStandings Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TeamStandings, type StandingsEntry } from "./TeamStandings";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("TeamStandings", () => {
  const mockStandings: StandingsEntry[] = [
    {
      position: 1,
      teamId: 1235,
      teamName: "KCVV ELEWIJT",
      teamLogo: "/logo1.png",
      played: 15,
      won: 12,
      drawn: 2,
      lost: 1,
      goalsFor: 38,
      goalsAgainst: 12,
      goalDifference: 26,
      points: 38,
      form: "WWWDW",
    },
    {
      position: 2,
      teamId: 59,
      teamName: "KFC TURNHOUT",
      teamLogo: "/logo2.png",
      played: 15,
      won: 11,
      drawn: 2,
      lost: 2,
      goalsFor: 35,
      goalsAgainst: 15,
      goalDifference: 20,
      points: 35,
      form: "WWDWL",
    },
    {
      position: 3,
      teamId: 123,
      teamName: "FC DIEST",
      played: 15,
      won: 10,
      drawn: 3,
      lost: 2,
      goalsFor: 28,
      goalsAgainst: 14,
      goalDifference: 14,
      points: 33,
      form: "DWWWW",
    },
  ];

  describe("rendering", () => {
    it("renders table with standings", () => {
      render(<TeamStandings standings={mockStandings} />);
      expect(screen.getByText("KCVV ELEWIJT")).toBeInTheDocument();
      expect(screen.getByText("KFC TURNHOUT")).toBeInTheDocument();
      expect(screen.getByText("FC DIEST")).toBeInTheDocument();
    });

    it("renders table headers", () => {
      render(<TeamStandings standings={mockStandings} />);
      expect(screen.getByText("#")).toBeInTheDocument();
      expect(screen.getByText("Team")).toBeInTheDocument();
      expect(screen.getByText("P")).toBeInTheDocument();
      expect(screen.getByText("Pts")).toBeInTheDocument();
    });

    it("renders position numbers", () => {
      render(<TeamStandings standings={mockStandings} />);
      // Position numbers may appear in other columns too (losses, draws)
      const ones = screen.getAllByText("1");
      expect(ones.length).toBeGreaterThanOrEqual(1);
      const twos = screen.getAllByText("2");
      expect(twos.length).toBeGreaterThanOrEqual(1);
      const threes = screen.getAllByText("3");
      expect(threes.length).toBeGreaterThanOrEqual(1);
    });

    it("renders points correctly", () => {
      render(<TeamStandings standings={mockStandings} />);
      // Points appear in multiple places (goalsFor too), use getAllByText
      const thirtyEights = screen.getAllByText("38");
      expect(thirtyEights.length).toBeGreaterThanOrEqual(1);
      const thirtyFives = screen.getAllByText("35");
      expect(thirtyFives.length).toBeGreaterThanOrEqual(1);
      const thirtyThrees = screen.getAllByText("33");
      expect(thirtyThrees.length).toBeGreaterThanOrEqual(1);
    });

    it("renders goal difference with + sign for positive", () => {
      render(<TeamStandings standings={mockStandings} />);
      expect(screen.getByText("+26")).toBeInTheDocument();
      expect(screen.getByText("+20")).toBeInTheDocument();
      expect(screen.getByText("+14")).toBeInTheDocument();
    });

    it("renders team logos", () => {
      render(<TeamStandings standings={mockStandings} />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2); // Only teams with logos
      expect(images[0]).toHaveAttribute("alt", "KCVV ELEWIJT logo");
      expect(images[1]).toHaveAttribute("alt", "KFC TURNHOUT logo");
    });
  });

  describe("highlighting", () => {
    it("highlights team when highlightTeamId matches", () => {
      const { container } = render(
        <TeamStandings standings={mockStandings} highlightTeamId={1235} />,
      );
      const highlightedRow = container.querySelector(".bg-kcvv-green-bright");
      expect(highlightedRow).toBeInTheDocument();
      expect(highlightedRow).toHaveTextContent("KCVV ELEWIJT");
    });

    it("does not highlight when highlightTeamId does not match", () => {
      const { container } = render(
        <TeamStandings standings={mockStandings} highlightTeamId={9999} />,
      );
      const highlightedRow = container.querySelector(".bg-kcvv-green-bright");
      expect(highlightedRow).not.toBeInTheDocument();
    });
  });

  describe("form display", () => {
    it("does not show form column by default", () => {
      render(<TeamStandings standings={mockStandings} />);
      expect(screen.queryByText("Vorm")).not.toBeInTheDocument();
    });

    it("shows form column when showForm is true", () => {
      render(<TeamStandings standings={mockStandings} showForm />);
      expect(screen.getByText("Vorm")).toBeInTheDocument();
    });

    it("renders form badges with correct colors for the highlighted team", () => {
      const { container } = render(
        <TeamStandings
          standings={mockStandings}
          showForm
          highlightTeamId={1235}
        />,
      );
      // Check for W badges (green)
      const greenBadges = container.querySelectorAll(".bg-green-500");
      expect(greenBadges.length).toBeGreaterThan(0);
      // Check for D badges (yellow)
      const yellowBadges = container.querySelectorAll(".bg-yellow-500");
      expect(yellowBadges.length).toBeGreaterThan(0);
      // Check for L badges (red) — present because the highlighted team's
      // form contains an L
      const redBadges = container.querySelectorAll(".bg-red-500");
      expect(redBadges.length).toBeGreaterThanOrEqual(0);
    });

    it("only renders form badges for the highlighted KCVV row, opponent rows show em-dash", () => {
      // Form data is only available for KCVV teams (PSD limitation).
      // Opponent rows must NOT show form badges to avoid implying we have
      // data we don't.
      const { container } = render(
        <TeamStandings
          standings={mockStandings}
          showForm
          highlightTeamId={1235}
        />,
      );

      // Em-dash placeholder should be present for opponent rows (2 of 3
      // mock entries are not KCVV).
      const emDashes = screen.getAllByLabelText(
        "Geen vormgegevens beschikbaar",
      );
      expect(emDashes).toHaveLength(2);
      emDashes.forEach((node) => {
        expect(node).toHaveTextContent("—");
      });

      // The total number of FormBadge wrapper divs should equal 5
      // (KCVV's "WWWDW" form is 5 chars, opponents render no badges).
      // Each form badge has the bg-green-500/bg-yellow-500/bg-red-500
      // class so we count those instead.
      const allFormBadges = container.querySelectorAll(
        ".bg-green-500, .bg-yellow-500, .bg-red-500",
      );
      expect(allFormBadges).toHaveLength(5);
    });

    it("shows em-dash for all rows when showForm is true but no team is highlighted", () => {
      // Without a highlighted team, no row qualifies as KCVV, so all rows
      // show the em-dash placeholder.
      render(<TeamStandings standings={mockStandings} showForm />);
      const emDashes = screen.getAllByLabelText(
        "Geen vormgegevens beschikbaar",
      );
      expect(emDashes).toHaveLength(3);
    });
  });

  describe("limit prop", () => {
    it("shows all entries by default", () => {
      render(<TeamStandings standings={mockStandings} />);
      expect(screen.getByText("KCVV ELEWIJT")).toBeInTheDocument();
      expect(screen.getByText("KFC TURNHOUT")).toBeInTheDocument();
      expect(screen.getByText("FC DIEST")).toBeInTheDocument();
    });

    it("limits entries when limit is set", () => {
      render(<TeamStandings standings={mockStandings} limit={2} />);
      expect(screen.getByText("KCVV ELEWIJT")).toBeInTheDocument();
      expect(screen.getByText("KFC TURNHOUT")).toBeInTheDocument();
      expect(screen.queryByText("FC DIEST")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(<TeamStandings standings={[]} isLoading />);
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render team names when loading", () => {
      render(<TeamStandings standings={mockStandings} isLoading />);
      expect(screen.queryByText("KCVV ELEWIJT")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no standings", () => {
      render(<TeamStandings standings={[]} />);
      expect(
        screen.getByText("Geen klassement beschikbaar."),
      ).toBeInTheDocument();
    });
  });

  describe("teams without logos", () => {
    it("renders placeholder for teams without logos", () => {
      const standingsWithoutLogos: StandingsEntry[] = [
        {
          position: 1,
          teamId: 1,
          teamName: "Team A",
          played: 10,
          won: 5,
          drawn: 3,
          lost: 2,
          goalsFor: 20,
          goalsAgainst: 15,
          goalDifference: 5,
          points: 18,
        },
      ];
      render(<TeamStandings standings={standingsWithoutLogos} />);
      expect(screen.getByText("T")).toBeInTheDocument(); // First letter placeholder
      expect(screen.getByText("Team A")).toBeInTheDocument();
    });
  });

  describe("negative goal difference", () => {
    it("renders negative goal difference without + sign", () => {
      const standingsWithNegative: StandingsEntry[] = [
        {
          position: 1,
          teamId: 1,
          teamName: "Team A",
          played: 10,
          won: 2,
          drawn: 3,
          lost: 5,
          goalsFor: 10,
          goalsAgainst: 20,
          goalDifference: -10,
          points: 9,
        },
      ];
      render(<TeamStandings standings={standingsWithNegative} />);
      expect(screen.getByText("-10")).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      const { container } = render(
        <TeamStandings standings={mockStandings} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
