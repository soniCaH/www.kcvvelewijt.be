/**
 * CalendarWeek Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarWeek } from "./CalendarWeek";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";
import { getScoreDisplay } from "@/lib/utils/match-display";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

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

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeMatch(
  overrides: Partial<CalendarMatch> & { id: number },
): CalendarMatch {
  const merged = {
    date: "2026-03-28T15:00:00", // Saturday
    homeTeam: { id: 1, name: "KCVV Elewijt A", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Racing Mechelen" },
    status: "scheduled" as CalendarMatch["status"],
    team: "A-ploeg",
    ...overrides,
  };
  return {
    ...merged,
    scoreDisplay:
      merged.scoreDisplay ??
      getScoreDisplay({
        home_team: { score: merged.homeScore },
        away_team: { score: merged.awayScore },
        status: merged.status,
      }),
  };
}

function makeEvent(
  overrides: Partial<CalendarEvent> & { id: string },
): CalendarEvent {
  return {
    title: "Paastoernooi",
    dateStart: "2026-03-28T10:00:00",
    href: "/events/paastoernooi",
    ...overrides,
  };
}

const defaultProps = {
  matches: [] as CalendarMatch[],
  events: [] as CalendarEvent[],
  weekStart: "2026-03-23", // Monday March 23
  onPrevWeek: vi.fn(),
  onNextWeek: vi.fn(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CalendarWeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders 7 day column headers", () => {
      render(<CalendarWeek {...defaultProps} />);
      expect(screen.getByText(/Ma.*23/)).toBeInTheDocument();
      expect(screen.getByText(/Zo.*29/)).toBeInTheDocument();
    });

    it("shows week date range label", () => {
      render(<CalendarWeek {...defaultProps} />);
      expect(screen.getByText("23 - 29 maart 2026")).toBeInTheDocument();
    });

    it("renders match in correct day column showing opponent", () => {
      const matches = [
        makeMatch({ id: 1, date: "2026-03-28T15:00:00" }), // Saturday
      ];
      render(<CalendarWeek {...defaultProps} matches={matches} />);
      const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
      // Mini card shows opponent name (KCVV is home, so away team is shown)
      expect(saturdayColumn).toHaveTextContent("Racing Mechelen");
      expect(saturdayColumn).toHaveTextContent("A-ploeg");
    });

    it("renders event in correct day column", () => {
      const events = [
        makeEvent({ id: "e1", dateStart: "2026-03-25T10:00:00" }), // Wednesday
      ];
      render(<CalendarWeek {...defaultProps} events={events} />);
      const wednesdayColumn = screen.getByTestId("week-col-2026-03-25");
      expect(wednesdayColumn).toHaveTextContent("Paastoernooi");
    });

    it("renders empty columns with no content", () => {
      render(<CalendarWeek {...defaultProps} />);
      const mondayColumn = screen.getByTestId("week-col-2026-03-23");
      // Empty column should exist but have no match/event content
      expect(mondayColumn.querySelectorAll("[data-match]")).toHaveLength(0);
    });
  });

  describe("navigation", () => {
    it("calls onPrevWeek when clicking prev arrow", async () => {
      const user = userEvent.setup();
      const onPrevWeek = vi.fn();
      render(<CalendarWeek {...defaultProps} onPrevWeek={onPrevWeek} />);
      await user.click(screen.getByLabelText("Vorige week"));
      expect(onPrevWeek).toHaveBeenCalled();
    });

    it("calls onNextWeek when clicking next arrow", async () => {
      const user = userEvent.setup();
      const onNextWeek = vi.fn();
      render(<CalendarWeek {...defaultProps} onNextWeek={onNextWeek} />);
      await user.click(screen.getByLabelText("Volgende week"));
      expect(onNextWeek).toHaveBeenCalled();
    });
  });
});
