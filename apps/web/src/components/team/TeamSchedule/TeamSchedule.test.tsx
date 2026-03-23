/**
 * TeamSchedule Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TeamSchedule, type ScheduleMatch } from "./TeamSchedule";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("TeamSchedule", () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const mockMatches: ScheduleMatch[] = [
    {
      id: 1001,
      date: pastDate,
      time: "15:00",
      homeTeam: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "/logo1.png",
      },
      awayTeam: {
        id: 59,
        name: "KFC Turnhout",
        logo: "/logo2.png",
      },
      homeScore: 3,
      awayScore: 1,
      status: "finished",
      competition: "3de Nationale",
    },
    {
      id: 1002,
      date: futureDate,
      time: "14:30",
      homeTeam: {
        id: 789,
        name: "SK Londerzeel",
      },
      awayTeam: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "/logo1.png",
      },
      status: "scheduled",
      competition: "3de Nationale",
    },
  ];

  describe("rendering", () => {
    it("renders match list", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      // KCVV Elewijt appears in both matches
      const kcvvElements = screen.getAllByText("KCVV Elewijt");
      expect(kcvvElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
      expect(screen.getByText("SK Londerzeel")).toBeInTheDocument();
    });

    it("renders match time for scheduled matches", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      expect(screen.getByText("14:30")).toBeInTheDocument();
    });

    it("renders combined score for finished matches", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      expect(screen.getByText("3 – 1")).toBeInTheDocument();
    });

    it("renders vs for scheduled matches", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      expect(screen.getByText("vs")).toBeInTheDocument();
    });

    it("renders competition names in mobile row", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      const competitions = screen.getAllByText(/3de Nationale/);
      expect(competitions.length).toBeGreaterThanOrEqual(1);
    });

    it("renders team logos", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
    });

    it("links to match detail page", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/game/1001");
    });

    it("includes back-navigation params in href when teamSlug is provided", () => {
      render(
        <TeamSchedule
          matches={mockMatches}
          teamId={1235}
          teamSlug="kcvv-elewijt-a"
        />,
      );
      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute(
        "href",
        "/game/1001?from=/team/kcvv-elewijt-a&fromTab=matches",
      );
    });
  });

  describe("filtering", () => {
    it("shows all matches when showPast is true", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} showPast />);
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
      expect(screen.getByText("SK Londerzeel")).toBeInTheDocument();
    });

    it("hides finished matches when showPast is false", () => {
      render(
        <TeamSchedule matches={mockMatches} teamId={1235} showPast={false} />,
      );
      expect(screen.queryByText("KFC Turnhout")).not.toBeInTheDocument();
      expect(screen.getByText("SK Londerzeel")).toBeInTheDocument();
    });
  });

  describe("limit prop", () => {
    it("shows all matches by default", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} />);
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
    });

    it("limits matches when limit is set", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} limit={1} />);
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
    });
  });

  describe("next match highlighting", () => {
    it("shows 'Volgende' badge for next match", () => {
      render(
        <TeamSchedule matches={mockMatches} teamId={1235} highlightNext />,
      );
      expect(screen.getByText("Volgende")).toBeInTheDocument();
    });

    it("does not show 'Volgende' badge when highlightNext is false", () => {
      render(
        <TeamSchedule
          matches={mockMatches}
          teamId={1235}
          highlightNext={false}
        />,
      );
      expect(screen.queryByText("Volgende")).not.toBeInTheDocument();
    });
  });

  describe("match status badges", () => {
    it("shows postponed badge", () => {
      const postponedMatch: ScheduleMatch = {
        id: 2001,
        date: futureDate,
        time: "15:00",
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "KFC Turnhout" },
        status: "postponed",
      };
      render(<TeamSchedule matches={[postponedMatch]} teamId={1235} />);
      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("shows stopped badge", () => {
      const stoppedMatch: ScheduleMatch = {
        id: 2002,
        date: futureDate,
        time: "15:00",
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "KFC Turnhout" },
        status: "stopped",
      };
      render(<TeamSchedule matches={[stoppedMatch]} teamId={1235} />);
      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });

    it("shows FF badge for forfeited matches", () => {
      const forfeitedMatch: ScheduleMatch = {
        id: 2003,
        date: pastDate,
        time: "15:00",
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "KFC Turnhout" },
        homeScore: 3,
        awayScore: 0,
        status: "forfeited",
      };
      render(<TeamSchedule matches={[forfeitedMatch]} teamId={1235} />);
      expect(screen.getByText("FF")).toBeInTheDocument();
    });
  });

  describe("result badges", () => {
    it("shows W badge for wins", () => {
      const winMatch: ScheduleMatch = {
        id: 3001,
        date: pastDate,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "Opponent" },
        homeScore: 3,
        awayScore: 1,
        status: "finished",
      };
      render(<TeamSchedule matches={[winMatch]} teamId={1235} />);
      expect(screen.getByText("W")).toBeInTheDocument();
    });

    it("shows L badge for losses", () => {
      const lossMatch: ScheduleMatch = {
        id: 3002,
        date: pastDate,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "Opponent" },
        homeScore: 0,
        awayScore: 2,
        status: "finished",
      };
      render(<TeamSchedule matches={[lossMatch]} teamId={1235} />);
      expect(screen.getByText("L")).toBeInTheDocument();
    });

    it("shows G badge for draws", () => {
      const drawMatch: ScheduleMatch = {
        id: 3003,
        date: pastDate,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "Opponent" },
        homeScore: 2,
        awayScore: 2,
        status: "finished",
      };
      render(<TeamSchedule matches={[drawMatch]} teamId={1235} />);
      expect(screen.getByText("G")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(
        <TeamSchedule matches={[]} teamId={1235} isLoading />,
      );
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render matches when loading", () => {
      render(<TeamSchedule matches={mockMatches} teamId={1235} isLoading />);
      expect(screen.queryByText("KCVV Elewijt")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no matches", () => {
      render(<TeamSchedule matches={[]} teamId={1235} />);
      expect(screen.getByText("Geen wedstrijden gepland.")).toBeInTheDocument();
    });
  });

  describe("home/away indication", () => {
    it("highlights home team name with text-white when playing at home", () => {
      const homeMatch: ScheduleMatch = {
        id: 4001,
        date: futureDate,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "Opponent" },
        status: "scheduled",
      };
      render(<TeamSchedule matches={[homeMatch]} teamId={1235} />);
      const kcvvText = screen.getByText("KCVV Elewijt");
      expect(kcvvText).toHaveClass("text-white");
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      const { container } = render(
        <TeamSchedule
          matches={mockMatches}
          teamId={1235}
          className="custom-class"
        />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("teams without logos", () => {
    it("renders placeholder for teams without logos", () => {
      const noLogoMatch: ScheduleMatch = {
        id: 5001,
        date: futureDate,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "Opponent FC" },
        status: "scheduled",
      };
      render(<TeamSchedule matches={[noLogoMatch]} teamId={1235} />);
      expect(screen.getByText("K")).toBeInTheDocument();
      expect(screen.getByText("O")).toBeInTheDocument();
    });
  });
});
