/**
 * CalendarMonth Component Tests (Phase 6.D reskin — #1994).
 *
 * Covers the 6d3-v2 cell (events-on-top titles + card-red match pips, no count
 * badge), the paper/ink grid, and the selected-day detail (TeamAgendaRow + event
 * rows).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";
import { CalendarMonth } from "./CalendarMonth";
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
    date: "2026-03-15T15:00:00",
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
    title: "Spaghetti-avond",
    dateStart: "2026-03-15T18:00:00",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
    source: "event",
    ...overrides,
  };
}

const baseProps = {
  selectedDate: "2026-03-15",
  onSelectDate: vi.fn(),
  currentMonth: 3,
  currentYear: 2026,
};

describe("CalendarMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(DateTime, "now").mockReturnValue(
      DateTime.fromISO("2026-03-15T12:00:00") as DateTime<true>,
    );
  });

  it("renders the month grid", () => {
    render(<CalendarMonth {...baseProps} matches={[]} events={[]} />);
    expect(screen.getByTestId("month-grid")).toBeInTheDocument();
  });

  describe("match pips (no count badge)", () => {
    it("renders a filled card-red pip for a home match", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[makeMatch({ id: 1, isHome: true })]}
          events={[]}
        />,
      );
      const pips = within(
        screen.getByTestId("day-pips-2026-03-15"),
      ).getAllByTestId("match-pip");
      expect(pips).toHaveLength(1);
      expect(pips[0]).toHaveAttribute("data-venue", "home");
      expect(pips[0]!.className).toContain("bg-card-red");
    });

    it("renders a ring (away) pip for an away match", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[makeMatch({ id: 2, isHome: false })]}
          events={[]}
        />,
      );
      const pip = within(screen.getByTestId("day-pips-2026-03-15")).getByTestId(
        "match-pip",
      );
      expect(pip).toHaveAttribute("data-venue", "away");
      expect(pip.className).toContain("border-card-red");
    });

    it("renders one pip per match without a numeric count badge", () => {
      const matches = Array.from({ length: 5 }, (_, i) =>
        makeMatch({ id: i + 1 }),
      );
      render(<CalendarMonth {...baseProps} matches={matches} events={[]} />);
      const pips = within(
        screen.getByTestId("day-pips-2026-03-15"),
      ).getAllByTestId("match-pip");
      expect(pips).toHaveLength(5);
      expect(screen.queryByTestId("count-badge")).not.toBeInTheDocument();
    });
  });

  describe("events on top", () => {
    it("renders an event as an in-cell title (not a pip)", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[]}
          events={[makeEvent({ id: "e1", title: "Spaghetti-avond" })]}
        />,
      );
      const cell = screen.getByTestId("day-events-2026-03-15");
      expect(within(cell).getByText("Spaghetti-avond")).toBeInTheDocument();
    });
  });

  describe("selected-day detail", () => {
    it("renders a TeamAgendaRow per match on the selected day", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[makeMatch({ id: 1 }), makeMatch({ id: 2 })]}
          events={[]}
        />,
      );
      expect(screen.getAllByTestId("team-agenda-row")).toHaveLength(2);
    });

    it("renders an event row linking to its detail route with a type tag", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[]}
          events={[
            makeEvent({ id: "e1", href: "/evenementen/spaghetti-avond" }),
          ]}
        />,
      );
      const row = screen.getByTestId("day-event-row");
      expect(row).toHaveAttribute("href", "/evenementen/spaghetti-avond");
      expect(within(row).getByTestId("event-type-tag")).toHaveAttribute(
        "data-event-type",
        "Clubevent",
      );
    });

    it("shows the day heading with a pluralised count caption", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[makeMatch({ id: 1 }), makeMatch({ id: 2 })]}
          events={[makeEvent({ id: "e1" })]}
        />,
      );
      const heading = screen.getByTestId("day-panel-heading");
      expect(heading).toHaveTextContent(/zondag 15 maart/i);
      expect(heading).toHaveTextContent("2 wedstrijden · 1 evenement");
    });

    it("shows an empty message when the selected day has no items", () => {
      render(
        <CalendarMonth
          {...baseProps}
          selectedDate="2026-03-20"
          matches={[makeMatch({ id: 1 })]}
          events={[]}
        />,
      );
      expect(
        screen.getByText(/Geen wedstrijden of activiteiten op deze dag/i),
      ).toBeInTheDocument();
    });
  });

  it("calls onSelectDate when a day cell is clicked", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <CalendarMonth
        {...baseProps}
        onSelectDate={onSelectDate}
        matches={[]}
        events={[]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "20 maart" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-03-20");
  });

  describe("kalender_item_click (selected-day detail)", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fires source=match when a detail match row is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarMonth
          {...baseProps}
          matches={[makeMatch({ id: 1 })]}
          events={[]}
        />,
      );
      await user.click(screen.getByTestId("team-agenda-row"));
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source: "match",
      });
    });

    it("fires the event's source when a detail event row is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarMonth
          {...baseProps}
          matches={[]}
          events={[makeEvent({ id: "e1", source: "article" })]}
        />,
      );
      await user.click(screen.getByTestId("day-event-row"));
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source: "article",
      });
    });
  });
});
