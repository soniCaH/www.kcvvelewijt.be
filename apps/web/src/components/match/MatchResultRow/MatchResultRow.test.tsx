/**
 * MatchResultRow Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchResultRow } from "./MatchResultRow";
import type { ScheduleMatch } from "../types";

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

describe("MatchResultRow", () => {
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const scheduledMatch: ScheduleMatch = {
    id: 1001,
    date: futureDate,
    time: "15:00",
    homeTeam: { id: 1235, name: "KCVV Elewijt", logo: "/logo1.png" },
    awayTeam: { id: 59, name: "KFC Turnhout", logo: "/logo2.png" },
    status: "scheduled",
    competition: "3de Nationale",
  };

  const finishedMatch: ScheduleMatch = {
    id: 1002,
    date: pastDate,
    time: "15:00",
    homeTeam: { id: 1235, name: "KCVV Elewijt", logo: "/logo1.png" },
    awayTeam: { id: 59, name: "KFC Turnhout", logo: "/logo2.png" },
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    competition: "3de Nationale",
  };

  describe("upcoming match", () => {
    it("renders vs placeholder for scheduled matches", () => {
      render(<MatchResultRow match={scheduledMatch} href="/game/1001" />);
      expect(screen.getByText("vs")).toBeInTheDocument();
    });

    it("renders team names", () => {
      render(<MatchResultRow match={scheduledMatch} href="/game/1001" />);
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
    });

    it("renders match time in result column for scheduled matches", () => {
      render(<MatchResultRow match={scheduledMatch} href="/game/1001" />);
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });

    it("links to match detail page", () => {
      render(<MatchResultRow match={scheduledMatch} href="/game/1001" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/game/1001");
    });
  });

  describe("past match with scores", () => {
    it("renders combined score for finished matches", () => {
      render(
        <MatchResultRow
          match={finishedMatch}
          teamId={1235}
          href="/game/1002"
        />,
      );
      expect(screen.getByText("3 – 1")).toBeInTheDocument();
    });

    it("shows W badge for wins", () => {
      render(
        <MatchResultRow
          match={finishedMatch}
          teamId={1235}
          href="/game/1002"
        />,
      );
      expect(screen.getByText("W")).toBeInTheDocument();
    });

    it("shows L badge for losses", () => {
      const lossMatch: ScheduleMatch = {
        ...finishedMatch,
        homeScore: 0,
        awayScore: 2,
      };
      render(
        <MatchResultRow match={lossMatch} teamId={1235} href="/game/1002" />,
      );
      expect(screen.getByText("L")).toBeInTheDocument();
    });

    it("shows G badge for draws", () => {
      const drawMatch: ScheduleMatch = {
        ...finishedMatch,
        homeScore: 2,
        awayScore: 2,
      };
      render(
        <MatchResultRow match={drawMatch} teamId={1235} href="/game/1002" />,
      );
      expect(screen.getByText("G")).toBeInTheDocument();
    });

    it("applies green styling on W badge", () => {
      render(
        <MatchResultRow
          match={finishedMatch}
          teamId={1235}
          href="/game/1002"
        />,
      );
      const badge = screen.getByText("W");
      expect(badge.className).toContain("text-kcvv-green-bright");
    });

    it("applies red styling on L badge", () => {
      const lossMatch: ScheduleMatch = {
        ...finishedMatch,
        homeScore: 0,
        awayScore: 2,
      };
      render(
        <MatchResultRow match={lossMatch} teamId={1235} href="/game/1002" />,
      );
      const badge = screen.getByText("L");
      expect(badge.className).toContain("text-red-400");
    });

    it("applies yellow styling on G badge", () => {
      const drawMatch: ScheduleMatch = {
        ...finishedMatch,
        homeScore: 2,
        awayScore: 2,
      };
      render(
        <MatchResultRow match={drawMatch} teamId={1235} href="/game/1002" />,
      );
      const badge = screen.getByText("G");
      expect(badge.className).toContain("text-yellow-400");
    });
  });

  describe("status badges", () => {
    it("shows postponed badge", () => {
      const postponedMatch: ScheduleMatch = {
        ...scheduledMatch,
        status: "postponed",
      };
      render(<MatchResultRow match={postponedMatch} href="/game/1001" />);
      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("shows stopped badge", () => {
      const stoppedMatch: ScheduleMatch = {
        ...scheduledMatch,
        status: "stopped",
      };
      render(<MatchResultRow match={stoppedMatch} href="/game/1001" />);
      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });

    it("shows FF badge for forfeited matches", () => {
      const forfeitedMatch: ScheduleMatch = {
        ...finishedMatch,
        status: "forfeited",
      };
      render(<MatchResultRow match={forfeitedMatch} href="/game/1001" />);
      expect(screen.getByText("FF")).toBeInTheDocument();
    });
  });

  describe("next match highlight", () => {
    it("shows Volgende badge when isNext is true", () => {
      render(
        <MatchResultRow match={scheduledMatch} isNext href="/game/1001" />,
      );
      expect(screen.getByText("Volgende")).toBeInTheDocument();
    });

    it("applies green border when isNext is true", () => {
      render(
        <MatchResultRow match={scheduledMatch} isNext href="/game/1001" />,
      );
      const link = screen.getByRole("link");
      expect(link.className).toContain("border-l-kcvv-green-bright");
    });

    it("does not show Volgende badge when isNext is false", () => {
      render(<MatchResultRow match={scheduledMatch} href="/game/1001" />);
      expect(screen.queryByText("Volgende")).not.toBeInTheDocument();
    });
  });

  describe("without logos", () => {
    it("renders placeholder initials when logos are missing", () => {
      const noLogoMatch: ScheduleMatch = {
        ...scheduledMatch,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 59, name: "Opponent FC" },
      };
      render(<MatchResultRow match={noLogoMatch} href="/game/1001" />);
      expect(screen.getByText("K")).toBeInTheDocument();
      expect(screen.getByText("O")).toBeInTheDocument();
    });
  });

  describe("home/away indication", () => {
    it("highlights team name with text-white when teamId matches", () => {
      render(
        <MatchResultRow
          match={scheduledMatch}
          teamId={1235}
          href="/game/1001"
        />,
      );
      const kcvvText = screen.getByText("KCVV Elewijt");
      expect(kcvvText).toHaveClass("text-white");
    });

    it("shows Thuis indicator on mobile when playing at home", () => {
      render(
        <MatchResultRow
          match={scheduledMatch}
          teamId={1235}
          href="/game/1001"
        />,
      );
      expect(screen.getByText(/Thuis/)).toBeInTheDocument();
    });

    it("shows Uit indicator on mobile when playing away", () => {
      const awayMatch: ScheduleMatch = {
        ...scheduledMatch,
        homeTeam: { id: 59, name: "KFC Turnhout", logo: "/logo2.png" },
        awayTeam: { id: 1235, name: "KCVV Elewijt", logo: "/logo1.png" },
      };
      render(
        <MatchResultRow match={awayMatch} teamId={1235} href="/game/1001" />,
      );
      expect(screen.getByText(/Uit/)).toBeInTheDocument();
    });
  });

  describe("competition", () => {
    it("renders competition name in mobile row", () => {
      render(
        <MatchResultRow
          match={scheduledMatch}
          teamId={1235}
          href="/game/1001"
        />,
      );
      expect(screen.getByText(/3de Nationale/)).toBeInTheDocument();
    });
  });
});
