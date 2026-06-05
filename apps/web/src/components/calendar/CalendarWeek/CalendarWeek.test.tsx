/**
 * CalendarWeek Component Tests (Phase 6.D reskin — #1994).
 *
 * The period nav is lifted to the widget toolbar; CalendarWeek now only renders
 * the 7-day paper/ink column grid for a given week window.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarWeek } from "./CalendarWeek";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";
import { getScoreDisplay } from "@/lib/utils/match-display";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

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
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className} {...rest}>
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
    isHome: true,
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
    href: "/evenementen/paastoernooi",
    eventType: "Clubevent",
    source: "event",
    ...overrides,
  };
}

const defaultProps = {
  matches: [] as CalendarMatch[],
  events: [] as CalendarEvent[],
  weekStart: "2026-03-23", // Monday March 23
};

describe("CalendarWeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the week grid with 7 day column headers", () => {
    render(<CalendarWeek {...defaultProps} />);
    expect(screen.getByTestId("week-grid")).toBeInTheDocument();
    expect(screen.getByText(/Ma.*23/)).toBeInTheDocument();
    expect(screen.getByText(/Zo.*29/)).toBeInTheDocument();
  });

  it("renders a match in its day column showing squad + opponent", () => {
    const matches = [makeMatch({ id: 1, date: "2026-03-28T15:00:00" })];
    render(<CalendarWeek {...defaultProps} matches={matches} />);
    const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
    expect(saturdayColumn).toHaveTextContent("Racing Mechelen");
    expect(saturdayColumn).toHaveTextContent("A-ploeg");
  });

  it("renders an event in its day column", () => {
    const events = [makeEvent({ id: "e1", dateStart: "2026-03-25T10:00:00" })];
    render(<CalendarWeek {...defaultProps} events={events} />);
    const wednesdayColumn = screen.getByTestId("week-col-2026-03-25");
    expect(wednesdayColumn).toHaveTextContent("Paastoernooi");
  });

  it("renders empty columns with no match/event content", () => {
    render(<CalendarWeek {...defaultProps} />);
    const mondayColumn = screen.getByTestId("week-col-2026-03-23");
    expect(mondayColumn.querySelectorAll("[data-match]")).toHaveLength(0);
  });

  it("does not render its own period nav (lifted to the widget)", () => {
    render(<CalendarWeek {...defaultProps} />);
    expect(screen.queryByLabelText("Vorige week")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Volgende week")).not.toBeInTheDocument();
  });

  describe("kalender_item_click", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fires source=match when a played match card is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CalendarWeek
          {...defaultProps}
          matches={[
            makeMatch({
              id: 1,
              status: "finished",
              homeScore: 2,
              awayScore: 1,
              scoreDisplay: { type: "score", home: 2, away: 1 },
            }),
          ]}
          events={[]}
        />,
      );
      await user.click(container.querySelector("[data-match]")!);
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source: "match",
      });
    });

    it("fires the event's source when an event link is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarWeek
          {...defaultProps}
          matches={[]}
          events={[makeEvent({ id: "e1", source: "article" })]}
        />,
      );
      const col = screen.getByTestId("week-col-2026-03-28");
      await user.click(within(col).getByText("Paastoernooi"));
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source: "article",
      });
    });
  });
});
