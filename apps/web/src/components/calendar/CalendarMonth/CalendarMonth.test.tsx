/**
 * CalendarMonth Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";
import { CalendarMonth } from "./CalendarMonth";
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
    date: "2026-03-15T15:00:00",
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
    dateStart: "2026-03-15T10:00:00",
    href: "/events/paastoernooi",
    ...overrides,
  };
}

const defaultProps = {
  matches: [] as CalendarMatch[],
  events: [] as CalendarEvent[],
  selectedDate: "2026-03-15",
  onSelectDate: vi.fn(),
  currentMonth: 3, // March (1-based, as Luxon uses)
  currentYear: 2026,
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CalendarMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock DateTime.now() for consistent "today" in tests
    vi.spyOn(DateTime, "now").mockReturnValue(
      DateTime.fromISO("2026-03-15T12:00:00") as DateTime<true>,
    );
  });

  // ── Grid rendering ────────────────────────────────────────────────────

  describe("grid rendering", () => {
    it("renders 7 day-of-week headers", () => {
      render(<CalendarMonth {...defaultProps} />);
      const headers = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
      for (const h of headers) {
        expect(screen.getByText(h)).toBeInTheDocument();
      }
    });

    it("renders day cells for the month", () => {
      render(<CalendarMonth {...defaultProps} />);
      const grid = screen.getByTestId("month-grid");
      const buttons = within(grid).getAllByRole("button");
      // March 2026 starts Sunday → grid has 42 cells (6 rows)
      expect(buttons.length).toBe(42);
    });

    it("renders month/year label", () => {
      render(<CalendarMonth {...defaultProps} />);
      expect(screen.getByText("maart 2026")).toBeInTheDocument();
    });

    it("highlights today with a distinct background", () => {
      render(<CalendarMonth {...defaultProps} selectedDate="2026-03-01" />);
      // Find the button for the 15th (today)
      const todayButton = screen.getByRole("button", { name: /15/i });
      expect(todayButton.className).toContain("bg-gray-100");
    });

    it("highlights selected date with green background", () => {
      render(<CalendarMonth {...defaultProps} selectedDate="2026-03-15" />);
      const selectedButton = screen.getByRole("button", { name: /15/i });
      expect(selectedButton.className).toContain("bg-kcvv-green-bright");
    });

    it("mutes days outside current month", () => {
      render(<CalendarMonth {...defaultProps} />);
      // March 2026 starts on Sunday, so Feb 23-28 are leading days
      // The grid should have Feb days with muted styling
      const grid = screen.getByTestId("month-grid");
      const buttons = within(grid).getAllByRole("button");
      // First button is Feb 23 → should be muted
      expect(buttons[0].className).toContain("text-gray-300");
    });
  });

  // ── Dots ──────────────────────────────────────────────────────────────

  describe("match/event dots", () => {
    it("shows filled green dot for home match", () => {
      const matches = [
        makeMatch({
          id: 1,
          date: "2026-03-15T15:00:00",
          homeTeam: { id: 1, name: "KCVV Elewijt A" },
          awayTeam: { id: 2, name: "Racing Mechelen" },
        }),
      ];
      render(<CalendarMonth {...defaultProps} matches={matches} />);
      const dot = screen.getByTestId("dot-home-2026-03-15");
      expect(dot.className).toContain("bg-kcvv-green-bright");
    });

    it("shows outlined green dot for away match", () => {
      const matches = [
        makeMatch({
          id: 1,
          date: "2026-03-15T15:00:00",
          homeTeam: { id: 2, name: "Racing Mechelen" },
          awayTeam: { id: 1, name: "KCVV Elewijt A" },
        }),
      ];
      render(<CalendarMonth {...defaultProps} matches={matches} />);
      const dot = screen.getByTestId("dot-away-2026-03-15");
      expect(dot.className).toContain("border-kcvv-green-bright");
    });

    it("shows blue dot for events", () => {
      const events = [
        makeEvent({ id: "e1", dateStart: "2026-03-20T10:00:00" }),
      ];
      render(<CalendarMonth {...defaultProps} events={events} />);
      const dot = screen.getByTestId("dot-event-2026-03-20");
      expect(dot.className).toContain("bg-blue-500");
    });
  });

  // ── Interaction ───────────────────────────────────────────────────────

  describe("interaction", () => {
    it("calls onSelectDate when clicking a day", async () => {
      const user = userEvent.setup();
      const onSelectDate = vi.fn();
      render(<CalendarMonth {...defaultProps} onSelectDate={onSelectDate} />);
      await user.click(screen.getByRole("button", { name: /20/ }));
      expect(onSelectDate).toHaveBeenCalledWith("2026-03-20");
    });

    it("calls onPrevMonth when clicking prev arrow", async () => {
      const user = userEvent.setup();
      const onPrevMonth = vi.fn();
      render(<CalendarMonth {...defaultProps} onPrevMonth={onPrevMonth} />);
      await user.click(screen.getByLabelText("Vorige maand"));
      expect(onPrevMonth).toHaveBeenCalled();
    });

    it("calls onNextMonth when clicking next arrow", async () => {
      const user = userEvent.setup();
      const onNextMonth = vi.fn();
      render(<CalendarMonth {...defaultProps} onNextMonth={onNextMonth} />);
      await user.click(screen.getByLabelText("Volgende maand"));
      expect(onNextMonth).toHaveBeenCalled();
    });
  });

  // ── Day panel ─────────────────────────────────────────────────────────

  describe("day panel", () => {
    it("shows formatted date heading for selected day", () => {
      render(<CalendarMonth {...defaultProps} selectedDate="2026-03-22" />);
      // March 22, 2026 is a Sunday
      const heading = screen.getByTestId("day-panel-heading");
      expect(heading.textContent?.toLowerCase()).toContain("22");
      expect(heading.textContent?.toLowerCase()).toContain("maart");
    });

    it("shows compact MatchTeaser for matches on selected day", () => {
      const matches = [
        makeMatch({ id: 1, date: "2026-03-15T15:00:00", time: "15:00" }),
      ];
      render(
        <CalendarMonth
          {...defaultProps}
          matches={matches}
          selectedDate="2026-03-15"
        />,
      );
      // MatchTeaser renders team names
      expect(screen.getByText("KCVV Elewijt A")).toBeInTheDocument();
      expect(screen.getByText("Racing Mechelen")).toBeInTheDocument();
    });

    it("shows event info for events on selected day", () => {
      const events = [
        makeEvent({ id: "e1", dateStart: "2026-03-15T10:00:00" }),
      ];
      render(
        <CalendarMonth
          {...defaultProps}
          events={events}
          selectedDate="2026-03-15"
        />,
      );
      expect(screen.getByText("Paastoernooi")).toBeInTheDocument();
    });

    it("shows empty state when no matches or events on day", () => {
      render(<CalendarMonth {...defaultProps} selectedDate="2026-03-20" />);
      expect(
        screen.getByText("Geen wedstrijden of activiteiten op deze dag."),
      ).toBeInTheDocument();
    });
  });
});
