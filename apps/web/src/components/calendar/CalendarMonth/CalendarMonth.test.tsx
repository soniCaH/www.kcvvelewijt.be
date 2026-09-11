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
import type {
  CalendarMatchFixture,
  CalendarEvent,
} from "@/app/(main)/kalender/utils";
import { getScoreDisplay } from "@/lib/utils/match-display";
import { trackEvent } from "@/lib/analytics/track-event";
import { reservationMatch, tournamentMatch } from "../calendar-mocks";

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
    date: "2026-03-15T15:00:00",
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

    it("renders a dashed ring pip for a pitch-reservation placeholder, not a home pip (#2606, #2688, #2802)", () => {
      // `CalendarReservation` carries no `isHome` at all (#2802) — the old
      // "even when isHome is true" bug this test named is now a compile
      // error, not a runtime one.
      render(
        <CalendarMonth
          {...baseProps}
          matches={[
            reservationMatch({
              id: 3,
              date: "2026-03-15T15:00:00",
              club: { id: 1235, name: "KCVV Elewijt" },
            }),
          ]}
          events={[]}
        />,
      );
      const pip = within(screen.getByTestId("day-pips-2026-03-15")).getByTestId(
        "match-pip",
      );
      expect(pip).toHaveAttribute("data-venue", "reservation");
      expect(pip.className).toContain("border-dashed");
      expect(pip.className).not.toContain("bg-card-red");
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

    it("renders a pitch-reservation placeholder as the reduced TeamAgendaRow — no opponent, no link (#2606, #2688)", () => {
      // The bug this closes: before #2688, `calendarMatchToScheduleMatch`
      // dropped `isPlaceholder`, so this row rendered as an ordinary linked
      // "KCVV Elewijt – KCVV Elewijt" scoreboard.
      render(
        <CalendarMonth
          {...baseProps}
          matches={[
            reservationMatch({
              id: 90,
              date: "2026-03-15T15:00:00",
              club: { id: 1235, name: "KCVV Elewijt" },
              competition: "Tornooi",
              team: "A-ploeg",
            }),
          ]}
          events={[]}
        />,
      );
      const row = screen.getByTestId("team-agenda-row");
      expect(row).toHaveAttribute("data-row-kind", "reservation");
      expect(row.tagName).toBe("ARTICLE");
      expect(row.closest("a")).toBeNull();
      expect(row.textContent).not.toMatch(/KCVV Elewijt.*KCVV Elewijt/);
      // The squad chip a normal row carries via homeTeam/awayTeam.teamLabel
      // has no equivalent slot on the reduced Crest+caption tree, so
      // SelectedDayDetail supplies it as captionLabel instead (#2688) — a
      // parent on a mixed-squad day must still be able to tell whose
      // reservation this is.
      expect(row.textContent).toContain("A-ploeg");
    });

    /**
     * A tournament fixture (#2696, competitionType === "tournament") reuses
     * the same reduced TeamAgendaRow register as a placeholder — one crest
     * (the opponent's, not KCVV's), no link. Before this fix,
     * `calendarMatchToScheduleMatch` dropped `competitionType`, so this row
     * rendered as an ordinary linked two-crest scoreboard on the calendar
     * even though the team page already rendered it reduced.
     */
    it("renders a tournament fixture as the reduced TeamAgendaRow, with its squad captionLabel carried through", () => {
      render(
        <CalendarMonth
          {...baseProps}
          matches={[
            tournamentMatch({
              id: 91,
              date: "2026-03-15T15:00:00",
              club: { id: 1391, name: "FC Zemst Sportief" },
              competition: "Tornooi",
              team: "U9",
            }),
          ]}
          events={[]}
        />,
      );
      const row = screen.getByTestId("team-agenda-row");
      expect(row).toHaveAttribute("data-row-kind", "reduced");
      expect(row.closest("a")).toBeNull();
      expect(row.textContent).toContain("FC Zemst Sportief");
      // The squad chip a normal row carries via homeTeam.teamLabel has no
      // equivalent slot on the reduced tree — SelectedDayDetail must widen
      // its captionLabel gate to cover this state too, not just
      // isPlaceholder, or a mixed-squad day loses which team this is.
      expect(row.textContent).toContain("U9");
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

    it("shows an empty message when the selected day has no items, exposed as a live status", () => {
      render(
        <CalendarMonth
          {...baseProps}
          selectedDate="2026-03-20"
          matches={[makeMatch({ id: 1 })]}
          events={[]}
        />,
      );
      // `live` on the tier-"slot" box: this panel swaps client-side when a
      // different day is selected, so a screen-reader user picking an empty
      // date must still hear something (round 4 review).
      expect(screen.getByRole("status")).toHaveTextContent(
        /Geen wedstrijden of activiteiten op deze dag/i,
      );
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
