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
import type {
  CalendarMatch,
  CalendarMatchFixture,
  CalendarEvent,
} from "@/app/(main)/kalender/utils";
import { getScoreDisplay } from "@/lib/utils/match-display";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  reservationMatch,
  tournamentMatch,
  tournamentOpponent,
} from "../calendar-mocks";

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
  overrides: Partial<CalendarMatchFixture> & { id: number },
): CalendarMatchFixture {
  const merged = {
    date: "2026-03-28T15:00:00", // Saturday
    homeTeam: { id: 1, name: "KCVV Elewijt A", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Racing Mechelen" },
    status: "scheduled" as CalendarMatchFixture["status"],
    team: "A-ploeg",
    isHome: true,
    isPlaceholder: false as const,
    kind: "match" as const,
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

  it("renders a pitch-reservation placeholder without an opponent name or a link (#2606, #2688)", () => {
    const matches = [
      reservationMatch({
        id: 90,
        date: "2026-03-28T09:30:00",
        time: "09:30",
        club: { id: 1235, name: "KCVV Elewijt" },
        competition: "Tornooi",
      }),
    ];
    render(<CalendarWeek {...defaultProps} matches={matches} />);
    const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
    expect(saturdayColumn).toHaveTextContent("Tornooi");
    expect(saturdayColumn).toHaveTextContent("09:30");
    expect(saturdayColumn.querySelector("a")).toBeNull();
    // The whole point of the reduced card: the self-match's club name never
    // reaches it, so the card cannot read as KCVV playing itself.
    expect(saturdayColumn).not.toHaveTextContent("KCVV Elewijt");
  });

  it("marks a cancelled reservation with the same status badge a real match gets — a cancelled slot must not read as live (#2688)", () => {
    const matches = [
      reservationMatch({
        id: 91,
        date: "2026-03-28T09:30:00",
        time: "09:30",
        club: { id: 1235, name: "KCVV Elewijt" },
        competition: "Tornooi",
        status: "cancelled",
      }),
    ];
    render(<CalendarWeek {...defaultProps} matches={matches} />);
    const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
    expect(saturdayColumn).toHaveTextContent("CANC");
  });

  it("renders a tournament fixture as a reduced card — one crest, no opponent link (#2715)", () => {
    // The bug this closes: a tournament fixture (competitionType ===
    // "tournament", a real named opponent, no result yet) rendered as an
    // ordinary linked match card on this view, even though <TeamAgendaRow>
    // already rendered it reduced (#2696).
    const matches = [tournamentMatch({ id: 91, date: "2026-03-28T09:30:00" })];
    render(<CalendarWeek {...defaultProps} matches={matches} />);
    const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
    const card = saturdayColumn.querySelector('[data-row-kind="reduced"]');
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent("Tornooi");
    expect(card).toHaveTextContent(tournamentOpponent.name);
    expect(saturdayColumn.querySelector("a")).toBeNull();
  });

  it("renders a played tournament fixture (a real scoreline exists) as an ordinary linked card (#2696 review)", () => {
    // Once a result exists, `transformMatchToCalendar` (`kalender/utils.test.ts`)
    // is where the reduced-to-full transition is actually exercised; this
    // render-level test only guards that a `kind: "match"` row with a
    // tournament `competitionType` still renders the ordinary linked card.
    const matches = [
      makeMatch({
        id: 92,
        date: "2026-03-28T09:30:00",
        status: "finished",
        homeScore: 4,
        awayScore: 1,
        scoreDisplay: { type: "score", home: 4, away: 1 },
        competitionType: "tournament",
        awayTeam: tournamentOpponent,
      }),
    ];
    render(<CalendarWeek {...defaultProps} matches={matches} />);
    const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
    expect(saturdayColumn).toHaveTextContent(tournamentOpponent.name);
    expect(saturdayColumn).toHaveTextContent("4-1");
    expect(saturdayColumn.querySelector("a")).not.toBeNull();
  });

  it("never triggers the reduced card from the Dutch competition label alone (#2715)", () => {
    const matches = [
      makeMatch({
        id: 93,
        date: "2026-03-28T15:00:00",
        competition: "Tornooi",
        competitionType: "league",
      }),
    ];
    render(<CalendarWeek {...defaultProps} matches={matches} />);
    const saturdayColumn = screen.getByTestId("week-col-2026-03-28");
    expect(saturdayColumn).toHaveTextContent("Racing Mechelen");
    expect(
      saturdayColumn.querySelector('[data-row-kind="reduced"]'),
    ).toBeNull();
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
