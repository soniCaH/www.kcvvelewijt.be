import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchStrip } from "./MatchStrip";
import {
  mockFinishedMatchWin,
  mockUpcomingMatch,
} from "@/components/home/MatchWidget/MatchWidget.mocks";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("MatchStrip", () => {
  describe("finished match", () => {
    it("renders score line for finished match", () => {
      render(<MatchStrip match={mockFinishedMatchWin} />);
      expect(screen.getByText(/KCVV Elewijt/)).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/FC Wezel Sport/)).toBeInTheDocument();
    });

    it("links to match detail page", () => {
      render(<MatchStrip match={mockFinishedMatchWin} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `/wedstrijd/${mockFinishedMatchWin.id}`,
      );
    });
  });

  describe("scheduled match", () => {
    it("renders next match info", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      expect(screen.getByText(/Volgende/)).toBeInTheDocument();
      expect(screen.getByText(/KVC Wilrijk/)).toBeInTheDocument();
    });

    it("shows time for scheduled match", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      expect(screen.getByText(/15:00/)).toBeInTheDocument();
    });

    it("links to match detail page", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `/wedstrijd/${mockUpcomingMatch.id}`,
      );
    });
  });

  describe("competition name", () => {
    it("renders competition name with hidden-on-mobile class", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      const competition = screen.getByText(/3e Afdeling VV/);
      expect(competition).toBeInTheDocument();
      expect(competition.className).toContain("hidden");
      expect(competition.className).toContain("md:inline");
    });
  });

  describe("null match", () => {
    it("renders nothing when match is null", () => {
      const { container } = render(<MatchStrip match={null} />);
      expect(container.innerHTML).toBe("");
    });
  });
});
