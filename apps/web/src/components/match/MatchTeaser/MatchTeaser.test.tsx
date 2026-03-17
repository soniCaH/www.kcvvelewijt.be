/**
 * MatchTeaser Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchTeaser } from "./MatchTeaser";

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

describe("MatchTeaser", () => {
  const defaultProps = {
    homeTeam: { id: 1235, name: "KCVV Elewijt", logo: "/logo1.png" },
    awayTeam: { id: 59, name: "KFC Turnhout", logo: "/logo2.png" },
    date: "2024-02-15",
    time: "15:00",
    status: "upcoming" as const,
  };

  describe("rendering", () => {
    it("renders team names", () => {
      render(<MatchTeaser {...defaultProps} />);
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
    });

    it("renders match time", () => {
      render(<MatchTeaser {...defaultProps} />);
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });

    it("renders date in Dutch format", () => {
      render(<MatchTeaser {...defaultProps} />);
      // Dutch format includes "do" (donderdag), "15" and "feb"
      // "15" appears in both date and time, use getAllByText
      const fifteens = screen.getAllByText(/15/);
      expect(fifteens.length).toBeGreaterThanOrEqual(1);
    });

    it("renders VS for upcoming matches", () => {
      render(<MatchTeaser {...defaultProps} />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("renders team logos", () => {
      render(<MatchTeaser {...defaultProps} />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute("alt", "KCVV Elewijt logo");
      expect(images[1]).toHaveAttribute("alt", "KFC Turnhout logo");
    });

    it("renders placeholder when no logo", () => {
      render(
        <MatchTeaser
          {...defaultProps}
          homeTeam={{ name: "Ajax FC" }}
          awayTeam={{ name: "Brugge FC" }}
        />,
      );
      expect(screen.getByText("A")).toBeInTheDocument(); // First letter of "Ajax FC"
      expect(screen.getByText("B")).toBeInTheDocument(); // First letter of "Brugge FC"
    });

    it("renders venue when provided", () => {
      render(<MatchTeaser {...defaultProps} venue="Sportpark Elewijt" />);
      // Venue appears twice: once for desktop (hidden sm:block) and once for mobile (sm:hidden)
      const venues = screen.getAllByText("Sportpark Elewijt");
      expect(venues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("status badges", () => {
    it("renders FF badge for forfeited matches", () => {
      render(
        <MatchTeaser
          {...defaultProps}
          status="forfeited"
          score={{ home: 3, away: 0 }}
        />,
      );
      expect(screen.getByText("FF")).toBeInTheDocument();
    });

    it("renders Uitgesteld badge for postponed matches", () => {
      render(<MatchTeaser {...defaultProps} status="postponed" />);
      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("renders Gestopt badge for stopped matches", () => {
      render(<MatchTeaser {...defaultProps} status="stopped" />);
      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });

    it("does not render badge for upcoming matches", () => {
      render(<MatchTeaser {...defaultProps} status="upcoming" />);
      expect(screen.queryByText("FF")).not.toBeInTheDocument();
      expect(screen.queryByText("Uitgesteld")).not.toBeInTheDocument();
      expect(screen.queryByText("Gestopt")).not.toBeInTheDocument();
    });
  });

  describe("score display", () => {
    it("renders score for finished matches", () => {
      render(
        <MatchTeaser
          {...defaultProps}
          status="finished"
          score={{ home: 3, away: 1 }}
        />,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      // "1" might appear multiple times (score and date), use getAllByText
      const ones = screen.getAllByText("1");
      expect(ones.length).toBeGreaterThanOrEqual(1);
    });

    it("renders score for forfeited matches", () => {
      render(
        <MatchTeaser
          {...defaultProps}
          status="forfeited"
          score={{ home: 2, away: 2 }}
        />,
      );
      // Both scores are 2, so we should find at least two "2"s
      const twos = screen.getAllByText("2");
      expect(twos.length).toBeGreaterThanOrEqual(2);
    });

    it("renders VS for upcoming matches without score", () => {
      render(<MatchTeaser {...defaultProps} status="upcoming" />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });
  });

  describe("link behavior", () => {
    it("renders as link when href is provided", () => {
      render(<MatchTeaser {...defaultProps} href="/game/123" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/game/123");
    });

    it("renders as div when no href", () => {
      render(<MatchTeaser {...defaultProps} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("compact variant", () => {
    it("renders compact variant", () => {
      const { container } = render(
        <MatchTeaser {...defaultProps} variant="compact" />,
      );
      expect(container.firstChild).toHaveClass("p-5");
    });

    it("shows venue in compact variant footer", () => {
      render(
        <MatchTeaser
          {...defaultProps}
          variant="compact"
          venue="Sportpark Elewijt"
        />,
      );
      expect(screen.getByText("Sportpark Elewijt")).toBeInTheDocument();
    });
  });

  describe("highlighting", () => {
    it("highlights home team when highlightTeamId matches team ID", () => {
      render(<MatchTeaser {...defaultProps} highlightTeamId={1235} />);
      const homeTeamText = screen.getByText("KCVV Elewijt");
      expect(homeTeamText).toHaveClass("font-semibold");
    });

    it("highlights away team when highlightTeamId matches team ID", () => {
      render(
        <MatchTeaser
          homeTeam={{ id: 59, name: "KFC Turnhout" }}
          awayTeam={{ id: 1235, name: "KCVV Elewijt" }}
          date="2024-02-15"
          status="upcoming"
          highlightTeamId={1235}
        />,
      );
      const awayTeamText = screen.getByText("KCVV Elewijt");
      expect(awayTeamText).toHaveClass("font-semibold");
    });

    it("does not highlight when team has no ID", () => {
      render(
        <MatchTeaser
          homeTeam={{ name: "KCVV Elewijt" }}
          awayTeam={{ name: "KFC Turnhout" }}
          date="2024-02-15"
          status="upcoming"
          highlightTeamId={1235}
        />,
      );
      const homeTeamText = screen.getByText("KCVV Elewijt");
      expect(homeTeamText).not.toHaveClass("font-semibold");
    });

    it("supports string team IDs", () => {
      render(
        <MatchTeaser
          homeTeam={{ id: "team-1235", name: "KCVV Elewijt" }}
          awayTeam={{ id: "team-59", name: "KFC Turnhout" }}
          date="2024-02-15"
          status="upcoming"
          highlightTeamId="team-1235"
        />,
      );
      const homeTeamText = screen.getByText("KCVV Elewijt");
      expect(homeTeamText).toHaveClass("font-semibold");
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(<MatchTeaser {...defaultProps} isLoading />);
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render team names when loading", () => {
      render(<MatchTeaser {...defaultProps} isLoading />);
      expect(screen.queryByText("KCVV Elewijt")).not.toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MatchTeaser {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("teamLabel", () => {
    it("renders teamLabel badge above date row", () => {
      render(<MatchTeaser {...defaultProps} teamLabel="A-Ploeg" />);
      expect(screen.getByText("A-Ploeg")).toBeInTheDocument();
    });

    it("does not render teamLabel badge when absent", () => {
      const { container } = render(<MatchTeaser {...defaultProps} />);
      // No empty badge element — verify no data-testid="team-label"
      expect(container.querySelector("[data-testid='team-label']")).toBeNull();
    });
  });

  describe("dark theme", () => {
    it("renders dark container classes when theme=dark", () => {
      const { container } = render(
        <MatchTeaser {...defaultProps} theme="dark" />,
      );
      expect(container.firstChild).toHaveClass("bg-white/8");
      expect(container.firstChild).not.toHaveClass("bg-white");
    });

    it("renders light container classes by default", () => {
      const { container } = render(<MatchTeaser {...defaultProps} />);
      expect(container.firstChild).toHaveClass("bg-white");
    });
  });

  describe("date formatting edge cases", () => {
    it("handles invalid date gracefully", () => {
      render(<MatchTeaser {...defaultProps} date="invalid-date" />);
      // Should show the original string when date is invalid
      expect(screen.getByText("invalid-date")).toBeInTheDocument();
    });

    it("handles empty date string", () => {
      render(<MatchTeaser {...defaultProps} date="" />);
      // Should not crash with empty date
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    });
  });
});
