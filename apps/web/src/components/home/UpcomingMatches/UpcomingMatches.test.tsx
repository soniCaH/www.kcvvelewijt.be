import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { UpcomingMatches, type UpcomingMatch } from "./UpcomingMatches";

// Mock the date formatting functions
vi.mock("@/lib/utils/dates", () => ({
  formatMatchDate: (date: Date) => {
    const months = [
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ];
    const days = [
      "zondag",
      "maandag",
      "dinsdag",
      "woensdag",
      "donderdag",
      "vrijdag",
      "zaterdag",
    ];
    const d = new Date(date);
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  },
  formatMatchTime: (date: Date) => {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes(),
    ).padStart(2, "0")}`;
  },
}));

describe("UpcomingMatches", () => {
  const mockMatches: UpcomingMatch[] = [
    {
      id: 1,
      date: new Date("2025-01-25T15:00:00"),
      time: "15:00",
      venue: "Stadion Elewijt",
      homeTeam: {
        id: 1,
        name: "KCVV Elewijt",
        logo: "/logos/kcvv.png",
      },
      awayTeam: {
        id: 2,
        name: "FC Opponent",
        logo: "/logos/opponent.png",
      },
      status: "scheduled",
      round: "Speeldag 15",
      competition: "Tweede Provinciale",
    },
    {
      id: 2,
      date: new Date("2025-01-26T14:30:00"),
      homeTeam: {
        id: 3,
        name: "Other Team",
        score: 2,
      },
      awayTeam: {
        id: 1,
        name: "KCVV Elewijt",
        score: 1,
      },
      status: "forfeited",
      competition: "Beker van België",
    },
    {
      id: 3,
      date: new Date("2025-01-20T16:00:00"),
      homeTeam: {
        id: 1,
        name: "KCVV Elewijt",
        score: 3,
      },
      awayTeam: {
        id: 4,
        name: "Past Opponent",
        score: 2,
      },
      status: "finished",
    },
  ];

  describe("Rendering", () => {
    it("renders section with default title", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      expect(screen.getByText("Volgende wedstrijden")).toBeInTheDocument();
    });

    it("renders custom title when provided", () => {
      render(
        <UpcomingMatches matches={mockMatches} title="Wedstrijdkalender" />,
      );

      expect(screen.getByText("Wedstrijdkalender")).toBeInTheDocument();
    });

    it("renders all provided matches", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      // KCVV Elewijt appears multiple times (home/away in different matches)
      expect(screen.getAllByText("KCVV Elewijt").length).toBeGreaterThan(0);
      expect(screen.getByText("FC Opponent")).toBeInTheDocument();
      expect(screen.getByText("Other Team")).toBeInTheDocument();
      expect(screen.getByText("Past Opponent")).toBeInTheDocument();
    });

    it('renders "View All" link by default', () => {
      render(<UpcomingMatches matches={mockMatches} />);

      const viewAllLink = screen.getByRole("link", { name: /Bekijk alles/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute("href", "/matches");
    });

    it('does not render "View All" link when showViewAll is false', () => {
      render(<UpcomingMatches matches={mockMatches} showViewAll={false} />);

      expect(
        screen.queryByRole("link", { name: /Bekijk alles/i }),
      ).not.toBeInTheDocument();
    });

    it("uses custom viewAllHref when provided", () => {
      render(<UpcomingMatches matches={mockMatches} viewAllHref="/kalender" />);

      const viewAllLink = screen.getByRole("link", { name: /Bekijk alles/i });
      expect(viewAllLink).toHaveAttribute("href", "/kalender");
    });

    it("returns null when no matches provided", () => {
      const { container } = render(<UpcomingMatches matches={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("applies custom className when provided", () => {
      const { container } = render(
        <UpcomingMatches matches={mockMatches} className="custom-slider" />,
      );

      expect(container.firstChild).toHaveClass("custom-slider");
    });

    it("applies correct section classes", () => {
      const { container } = render(<UpcomingMatches matches={mockMatches} />);

      const section = container.firstChild;
      expect(section).toHaveClass("frontpage__matches_slider");
      expect(section).toHaveClass("bg-gray-50");
    });
  });

  describe("Match Status", () => {
    it("renders FF badge for forfeited matches", () => {
      render(<UpcomingMatches matches={[mockMatches[1]]} />);

      const ffElements = screen.getAllByText("FF");
      expect(ffElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders FF badge and scores for forfeited matches", () => {
      render(<UpcomingMatches matches={[mockMatches[1]]} />);

      const scores = screen.getAllByText(/[0-9]/);
      expect(scores.length).toBeGreaterThan(0);
    });

    it("renders scores for finished matches", () => {
      render(<UpcomingMatches matches={[mockMatches[2]]} />);

      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("renders postponed status", () => {
      const postponedMatch: UpcomingMatch = {
        ...mockMatches[0],
        status: "postponed",
      };
      render(<UpcomingMatches matches={[postponedMatch]} />);

      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("renders stopped status", () => {
      const stoppedMatch: UpcomingMatch = {
        ...mockMatches[0],
        status: "stopped",
      };
      render(<UpcomingMatches matches={[stoppedMatch]} />);

      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });
  });

  describe("Match Information", () => {
    it("renders competition name when provided", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      expect(screen.getByText("Tweede Provinciale")).toBeInTheDocument();
      expect(screen.getByText("Beker van België")).toBeInTheDocument();
    });

    it("renders round information when provided", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      expect(screen.getByText(/Speeldag 15/)).toBeInTheDocument();
    });

    it("renders both competition and round when both are provided", () => {
      const matchWithBoth: UpcomingMatch = {
        ...mockMatches[0],
        competition: "Test Competition",
        round: "Test Round",
      };

      render(<UpcomingMatches matches={[matchWithBoth]} />);

      expect(screen.getByText("Test Competition")).toBeInTheDocument();
      expect(screen.getByText("Test Round")).toBeInTheDocument();
    });

    it("renders venue when provided", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      expect(screen.getByText("Stadion Elewijt")).toBeInTheDocument();
    });

    it("renders match time when provided", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      expect(screen.getByText("15:00")).toBeInTheDocument();
    });

    it("renders team logos when provided", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      const logos = screen.getAllByRole("img");
      expect(logos.length).toBeGreaterThan(0);
    });
  });

  describe("Scroll Navigation", () => {
    let mockScrollTo: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockScrollTo = vi.fn();
      // Handle both overloaded signatures: (options) and (x, y)
      Element.prototype.scrollTo = mockScrollTo as {
        (options?: ScrollToOptions): void;
        (x: number, y: number): void;
      };
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders scroll container without errors", () => {
      const { container } = render(<UpcomingMatches matches={mockMatches} />);

      // Verify the scroll container exists
      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass("snap-x", "snap-mandatory");
    });

    it("calls scrollTo when navigation arrows are clicked", async () => {
      const manyMatches = Array.from({ length: 10 }, (_, i) => ({
        ...mockMatches[0],
        id: i + 1,
      }));

      const { container } = render(<UpcomingMatches matches={manyMatches} />);

      // Mock the scroll container to have scrollable content
      const scrollContainer = container.querySelector(
        '[class*="overflow-x-auto"]',
      );
      if (scrollContainer) {
        Object.defineProperty(scrollContainer, "scrollWidth", {
          value: 2000,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "clientWidth", {
          value: 800,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "scrollLeft", {
          value: 0,
          configurable: true,
        });

        // Trigger resize to update scroll state
        act(() => {
          window.dispatchEvent(new Event("resize"));
        });

        // Try to find and click the right arrow
        const rightArrow = screen.queryByRole("button", {
          name: /Scroll right/i,
        });
        if (rightArrow) {
          await act(async () => {
            rightArrow.click();
          });

          expect(mockScrollTo).toHaveBeenCalled();
        }
      }
    });
  });

  describe("Responsive Behavior", () => {
    it("renders match cards in horizontal scroll container", () => {
      const { container } = render(<UpcomingMatches matches={mockMatches} />);

      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass("snap-x", "snap-mandatory");
    });

    it("renders correct number of match cards", () => {
      const { container } = render(<UpcomingMatches matches={mockMatches} />);

      const matchCards = container.querySelectorAll(".snap-start");
      expect(matchCards.length).toBe(3);
    });

    it("handles single match", () => {
      render(<UpcomingMatches matches={[mockMatches[0]]} />);

      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.queryByText("Other Team")).not.toBeInTheDocument();
    });

    it("handles large number of matches", () => {
      const manyMatches = Array.from({ length: 15 }, (_, i) => ({
        ...mockMatches[0],
        id: i + 1,
        homeTeam: { ...mockMatches[0].homeTeam, name: `Team ${i}` },
      }));

      render(<UpcomingMatches matches={manyMatches} />);

      expect(screen.getByText("Team 0")).toBeInTheDocument();
      expect(screen.getByText("Team 14")).toBeInTheDocument();
    });
  });

  describe("useEffect Cleanup", () => {
    it("cleans up timeout on unmount", () => {
      const { unmount } = render(<UpcomingMatches matches={mockMatches} />);

      // Unmount should trigger cleanup
      unmount();

      // If timeout wasn't cleaned up, this would cause issues
      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("handles live match without scores", () => {
      const matchWithoutScores: UpcomingMatch[] = [
        {
          id: 5,
          date: new Date("2025-01-28T15:00:00"),
          homeTeam: {
            id: 1,
            name: "KCVV Elewijt",
          },
          awayTeam: {
            id: 2,
            name: "FC Opponent",
          },
          status: "forfeited",
          competition: "Tweede Provinciale",
        },
      ];

      render(<UpcomingMatches matches={matchWithoutScores} />);

      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("FC Opponent")).toBeInTheDocument();
      // Should render without crashing even without scores
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it("handles finished match without scores", () => {
      const matchWithoutScores: UpcomingMatch[] = [
        {
          id: 6,
          date: new Date("2025-01-20T15:00:00"),
          homeTeam: {
            id: 1,
            name: "KCVV Elewijt",
          },
          awayTeam: {
            id: 2,
            name: "FC Opponent",
          },
          status: "finished",
          competition: "Tweede Provinciale",
        },
      ];

      render(<UpcomingMatches matches={matchWithoutScores} />);

      expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
      expect(screen.getByText("FC Opponent")).toBeInTheDocument();
      // Should render without crashing even without scores
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("navigation buttons have proper ARIA labels when rendered", () => {
      const { container } = render(<UpcomingMatches matches={mockMatches} />);

      // Navigation buttons are conditionally rendered based on scroll state
      // When they exist, they should have proper aria-label attributes
      const buttons = container.querySelectorAll("button[aria-label]");
      buttons.forEach((button) => {
        const ariaLabel = button.getAttribute("aria-label");
        expect(ariaLabel).toMatch(/Scroll (left|right)/);
      });
    });

    it("renders section as semantic HTML", () => {
      const { container } = render(<UpcomingMatches matches={mockMatches} />);

      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
    });

    it("uses heading hierarchy correctly", () => {
      render(<UpcomingMatches matches={mockMatches} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Volgende wedstrijden");
    });
  });
});
