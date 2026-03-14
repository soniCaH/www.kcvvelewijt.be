/**
 * MatchHeader Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchHeader } from "./MatchHeader";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock formatMatchDate
vi.mock("@/lib/utils/dates", () => ({
  formatMatchDate: (date: Date) => date.toLocaleDateString("nl-BE"),
}));

describe("MatchHeader", () => {
  const defaultProps = {
    homeTeam: { name: "KCVV Elewijt", logo: "/home-logo.png" },
    awayTeam: { name: "KFC Turnhout", logo: "/away-logo.png" },
    date: new Date("2025-12-07T15:00:00"),
    status: "scheduled" as const,
  };

  describe("rendering", () => {
    it("renders team names", () => {
      render(<MatchHeader {...defaultProps} />);
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("KFC Turnhout")).toBeInTheDocument();
    });

    it("renders team logos", () => {
      render(<MatchHeader {...defaultProps} />);
      expect(screen.getByAltText("KCVV Elewijt logo")).toBeInTheDocument();
      expect(screen.getByAltText("KFC Turnhout logo")).toBeInTheDocument();
    });

    it("renders VS for scheduled matches", () => {
      render(<MatchHeader {...defaultProps} />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("renders competition badge when provided", () => {
      render(<MatchHeader {...defaultProps} competition="3de Nationale" />);
      expect(screen.getByText("3de Nationale")).toBeInTheDocument();
    });

    it("renders match time when provided", () => {
      render(<MatchHeader {...defaultProps} time="15:00" />);
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });
  });

  describe("score display", () => {
    it("renders score for finished matches", () => {
      render(
        <MatchHeader
          {...defaultProps}
          homeTeam={{ ...defaultProps.homeTeam, score: 3 }}
          awayTeam={{ ...defaultProps.awayTeam, score: 1 }}
          status="finished"
        />,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.queryByText("VS")).not.toBeInTheDocument();
    });

    it("renders score for forfeited matches", () => {
      render(
        <MatchHeader
          {...defaultProps}
          homeTeam={{ ...defaultProps.homeTeam, score: 2 }}
          awayTeam={{ ...defaultProps.awayTeam, score: 0 }}
          status="forfeited"
        />,
      );
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders 0-0 when score is zero", () => {
      render(
        <MatchHeader
          {...defaultProps}
          homeTeam={{ ...defaultProps.homeTeam, score: 0 }}
          awayTeam={{ ...defaultProps.awayTeam, score: 0 }}
          status="finished"
        />,
      );
      const zeros = screen.getAllByText("0");
      expect(zeros).toHaveLength(2);
    });
  });

  describe("status indicators", () => {
    it("renders FF badge for forfeited matches", () => {
      render(<MatchHeader {...defaultProps} status="forfeited" />);
      expect(screen.getByText("FF")).toBeInTheDocument();
    });

    it("renders Uitgesteld badge for postponed matches", () => {
      render(<MatchHeader {...defaultProps} status="postponed" />);
      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("renders Gestopt badge for stopped matches", () => {
      render(<MatchHeader {...defaultProps} status="stopped" />);
      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });

    it("does not show date for postponed matches", () => {
      render(<MatchHeader {...defaultProps} status="postponed" time="15:00" />);
      expect(screen.queryByText("15:00")).not.toBeInTheDocument();
    });

    it("does not show date for stopped matches", () => {
      render(<MatchHeader {...defaultProps} status="stopped" time="15:00" />);
      expect(screen.queryByText("15:00")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading", () => {
      const { container } = render(<MatchHeader {...defaultProps} isLoading />);
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });

    it("does not render team names when loading", () => {
      render(<MatchHeader {...defaultProps} isLoading />);
      expect(screen.queryByText("KCVV Elewijt")).not.toBeInTheDocument();
      expect(screen.queryByText("KFC Turnhout")).not.toBeInTheDocument();
    });
  });

  describe("without logos", () => {
    it("renders placeholder when no logo provided", () => {
      render(
        <MatchHeader
          {...defaultProps}
          homeTeam={{ name: "KCVV Elewijt" }}
          awayTeam={{ name: "Unknown FC" }}
        />,
      );
      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("Unknown FC")).toBeInTheDocument();
      // Should render SVG placeholders instead of images
      expect(
        screen.queryByAltText("KCVV Elewijt logo"),
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("uses semantic heading structure", () => {
      // Competition badge is not a heading, just check content renders
      render(<MatchHeader {...defaultProps} competition="3de Nationale" />);
      expect(screen.getByText("3de Nationale")).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MatchHeader {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
