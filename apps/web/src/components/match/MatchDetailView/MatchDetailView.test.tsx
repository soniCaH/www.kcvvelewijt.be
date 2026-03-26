/**
 * MatchDetailView Component Tests
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchDetailView } from "./MatchDetailView";
import type { LineupPlayer } from "../MatchLineup";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock formatMatchDate
vi.mock("@/lib/utils/dates", () => ({
  formatMatchDate: (date: Date) => date.toLocaleDateString("nl-BE"),
}));

describe("MatchDetailView", () => {
  const mockHomeLineup: LineupPlayer[] = [
    {
      id: 1,
      name: "Home Player 1",
      number: 1,
      isCaptain: false,
      status: "starter",
    },
    {
      id: 2,
      name: "Home Player 2",
      number: 10,
      isCaptain: true,
      status: "starter",
    },
  ];

  const mockAwayLineup: LineupPlayer[] = [
    {
      id: 101,
      name: "Away Player 1",
      number: 1,
      isCaptain: true,
      status: "starter",
    },
    {
      id: 102,
      name: "Away Player 2",
      number: 9,
      isCaptain: false,
      status: "starter",
    },
  ];

  const defaultProps = {
    homeTeam: { name: "KCVV Elewijt", logo: "/home-logo.png", score: 3 },
    awayTeam: { name: "KFC Turnhout", logo: "/away-logo.png", score: 1 },
    date: new Date("2025-12-07T15:00:00"),
    time: "15:00",
    status: "finished" as const,
    competition: "3de Nationale",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
  };

  describe("rendering", () => {
    it("renders MatchHeader content", () => {
      render(<MatchDetailView {...defaultProps} />);
      // Team names appear in both header and lineup sections
      const kcvvElements = screen.getAllByText("KCVV Elewijt");
      expect(kcvvElements.length).toBeGreaterThanOrEqual(1);
      const turnhoutElements = screen.getAllByText("KFC Turnhout");
      expect(turnhoutElements.length).toBeGreaterThanOrEqual(1);
      // Score elements
      expect(screen.getByText("3")).toBeInTheDocument();
      // Note: "1" appears multiple times (score, jersey numbers)
      const onesElements = screen.getAllByText("1");
      expect(onesElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders MatchLineup content", () => {
      render(<MatchDetailView {...defaultProps} />);
      expect(screen.getByText("Opstellingen")).toBeInTheDocument();
      expect(screen.getByText("Home Player 1")).toBeInTheDocument();
      expect(screen.getByText("Away Player 1")).toBeInTheDocument();
    });

    it("renders competition badge", () => {
      render(<MatchDetailView {...defaultProps} />);
      expect(screen.getByText("3de Nationale")).toBeInTheDocument();
    });
  });

  describe("empty lineups", () => {
    it("shows message when no lineup available", () => {
      render(
        <MatchDetailView {...defaultProps} homeLineup={[]} awayLineup={[]} />,
      );
      // MatchLineup handles the empty state with its own message
      expect(
        screen.getByText("Geen opstellingen beschikbaar voor deze wedstrijd."),
      ).toBeInTheDocument();
    });

    it("shows lineup when at least one team has players", () => {
      render(
        <MatchDetailView
          {...defaultProps}
          homeLineup={mockHomeLineup}
          awayLineup={[]}
        />,
      );
      expect(screen.getByText("Opstellingen")).toBeInTheDocument();
      expect(screen.getByText("Home Player 1")).toBeInTheDocument();
    });
  });

  describe("match statuses", () => {
    it("renders scheduled match correctly", () => {
      render(
        <MatchDetailView
          {...defaultProps}
          homeTeam={{ name: "KCVV Elewijt" }}
          awayTeam={{ name: "KFC Turnhout" }}
          status="scheduled"
          homeLineup={[]}
          awayLineup={[]}
        />,
      );
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("renders forfeited match correctly", () => {
      render(<MatchDetailView {...defaultProps} status="forfeited" />);
      expect(screen.getByText("FF")).toBeInTheDocument();
    });

    it("renders postponed match correctly", () => {
      render(
        <MatchDetailView
          {...defaultProps}
          status="postponed"
          homeLineup={[]}
          awayLineup={[]}
        />,
      );
      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("renders stopped match correctly", () => {
      render(
        <MatchDetailView
          {...defaultProps}
          status="stopped"
          homeLineup={[]}
          awayLineup={[]}
        />,
      );
      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(
        <MatchDetailView {...defaultProps} isLoading />,
      );
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render content when loading", () => {
      render(<MatchDetailView {...defaultProps} isLoading />);
      expect(screen.queryByText("Home Player 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Opstellingen")).not.toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MatchDetailView {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("back link", () => {
    it("renders back link when backUrl is provided", () => {
      render(
        <MatchDetailView
          {...defaultProps}
          backUrl="/ploegen/a-ploeg?tab=wedstrijden"
        />,
      );
      const link = screen.getByRole("link", {
        name: /terug naar wedstrijden/i,
      });
      expect(link).toHaveAttribute("href", "/ploegen/a-ploeg?tab=wedstrijden");
    });

    it("does not render back link when backUrl is not provided", () => {
      render(<MatchDetailView {...defaultProps} />);
      expect(
        screen.queryByRole("link", { name: /terug naar wedstrijden/i }),
      ).not.toBeInTheDocument();
    });
  });
});
