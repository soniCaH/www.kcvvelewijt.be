/**
 * CalendarAgenda Component Tests (Phase 6.D — #1994).
 *
 * The "labelled wall": a month-windowed list with an EditorialHeading month
 * header, per-day groups (count sub-header + DashedDivider) and every item shown,
 * events tinted so a dense day never buries them.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarAgenda } from "./CalendarAgenda";
import type {
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
    date: "2026-09-12T10:00:00", // Saturday
    homeTeam: { id: 1, name: "KCVV Elewijt", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Zemst" },
    status: "scheduled" as CalendarMatchFixture["status"],
    team: "U7",
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
    dateStart: "2026-09-12T18:00:00",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
    source: "event",
    ...overrides,
  };
}

const baseProps = { currentMonth: 9, currentYear: 2026 };

describe("CalendarAgenda", () => {
  it("renders the month header", () => {
    render(<CalendarAgenda {...baseProps} matches={[]} events={[]} />);
    // The empty branch's own <EmptyState> heading renders at level 3 (not 2)
    // specifically so it never collides with this one — see headingLevel={3}
    // at its call site.
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toContain("September");
    expect(heading.textContent).toContain("'26");
  });

  it("renders a day group with a heading and pluralised count", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[makeMatch({ id: 1 }), makeMatch({ id: 2 })]}
        events={[makeEvent({ id: "e1" })]}
      />,
    );
    const group = screen.getByLabelText(/zaterdag 12 september/i);
    expect(group).toHaveTextContent("2 wedstrijden · 1 evenement");
  });

  it("renders a match row per match and a tinted event row per event", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[makeMatch({ id: 1 }), makeMatch({ id: 2 })]}
        events={[makeEvent({ id: "e1" })]}
      />,
    );
    expect(screen.getAllByTestId("agenda-match-row")).toHaveLength(2);
    const eventRow = screen.getByTestId("agenda-event-row");
    expect(eventRow).toHaveAttribute("href", "/evenementen/spaghetti-avond");
    // Tinted (jersey-deep wash) so it stands out from the match stack.
    expect(eventRow.className).toContain("bg-jersey-deep/6");
    expect(within(eventRow).getByTestId("event-type-tag")).toHaveAttribute(
      "data-event-type",
      "Clubevent",
    );
  });

  // List Row Fill Rule (DESIGN.md § Motion) — a hovered list row fills
  // rather than moves, and AC 5 (#2624) requires keyboard focus to get the
  // SAME treatment as hover, not merely an equivalent one: the identical
  // background fill, plus the inset outline `<MatchStripView>` already uses
  // for its own flush row list so the ring survives even where the fill
  // alone would be easy to miss.
  it("gives the match row the same fill on focus-visible as on hover, plus a matching inset outline, never a translate", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[makeMatch({ id: 1 })]}
        events={[]}
      />,
    );
    const matchRow = screen.getByTestId("agenda-match-row");
    expect(matchRow.className).toContain("hover:bg-cream-soft/50");
    expect(matchRow.className).toContain("focus-visible:bg-cream-soft/50");
    expect(matchRow.className).toContain("focus-visible:outline-offset-[-2px]");
    expect(matchRow.className).toContain("focus-visible:outline-jersey-deep");
    expect(matchRow.className).not.toContain("translate");
  });

  it("gives the event row the same fill on focus-visible as on hover, plus a matching inset outline, never a translate", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[]}
        events={[makeEvent({ id: "e1" })]}
      />,
    );
    const eventRow = screen.getByTestId("agenda-event-row");
    expect(eventRow.className).toContain("hover:bg-jersey-deep/12");
    expect(eventRow.className).toContain("focus-visible:bg-jersey-deep/12");
    expect(eventRow.className).toContain("focus-visible:outline-offset-[-2px]");
    expect(eventRow.className).toContain("focus-visible:outline-jersey-deep");
    expect(eventRow.className).not.toContain("translate");
  });

  it("renders a pitch-reservation placeholder as a reduced row — no opponent, no link (#2606, #2688)", () => {
    // The bug this closes: before #2688, AgendaMatchRow rendered
    // `match.homeTeam.name — match.awayTeam.name` unconditionally, so a
    // self-match read as an ordinary linked "KCVV Elewijt — KCVV Elewijt" row.
    const { container } = render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          reservationMatch({
            id: 90,
            date: "2026-09-12T09:30:00",
            club: { id: 1235, name: "KCVV Elewijt" },
            competition: "Tornooi",
            team: "U7",
          }),
        ]}
        events={[]}
      />,
    );
    const row = container.querySelector('[data-row-kind="reservation"]');
    expect(row).not.toBeNull();
    expect(row!.tagName).not.toBe("A");
    expect(row!.querySelector("a")).toBeNull();
    expect(row).toHaveTextContent("Tornooi");
    expect(row!.textContent).not.toMatch(/KCVV Elewijt.*KCVV Elewijt/);
    expect(screen.queryByTestId("agenda-match-row")).toBeNull();
    // The default fixture's squad ("U7") must still show — a mixed-squad day
    // (`AgendaMatchRow` renders this chip for every real row) otherwise
    // leaves a reservation indistinguishable from any other squad's
    // (code-review finding on #2688's first draft).
    expect(row).toHaveTextContent("U7");
  });

  it("renders a tournament fixture as a reduced row — one crest, no vs framing, no link (#2715)", () => {
    // The bug this closes: a tournament fixture (competitionType ===
    // "tournament", a real named opponent, no result yet) rendered as an
    // ordinary linked two-crest scoreboard on this view, even though
    // <TeamAgendaRow> already rendered it reduced (#2696).
    const { container } = render(
      <CalendarAgenda
        {...baseProps}
        matches={[tournamentMatch({ id: 91, date: "2026-09-12T09:30:00" })]}
        events={[]}
      />,
    );
    const row = container.querySelector('[data-row-kind="reduced"]');
    expect(row).not.toBeNull();
    expect(row!.tagName).not.toBe("A");
    expect(row!.querySelector("a")).toBeNull();
    expect(row).toHaveTextContent("Tornooi");
    expect(row).toHaveTextContent(tournamentOpponent.name);
    expect(screen.queryByTestId("agenda-match-row")).toBeNull();
  });

  it("renders a played tournament fixture (a real scoreline exists) as an ordinary linked row (#2696 review)", () => {
    // Once a result exists, the named club really was the opponent, so the
    // row reverts to the full scoreboard — `transformMatchToCalendar`
    // (`kalender/utils.test.ts`) is where this transition is actually
    // exercised end-to-end (a raw `Match` gaining a scoreline flips `kind`
    // from `"reduced"` to `"match"`); this render-level test only guards
    // that a `kind: "match"` row with a tournament `competitionType` still
    // renders the ordinary linked scoreboard rather than the reduced one.
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          makeMatch({
            id: 92,
            date: "2026-09-12T09:30:00",
            status: "finished",
            homeScore: 4,
            awayScore: 1,
            competitionType: "tournament",
            awayTeam: tournamentOpponent,
          }),
        ]}
        events={[]}
      />,
    );
    const row = screen.getByTestId("agenda-match-row");
    expect(row).toHaveTextContent("4 – 1");
    expect(row).toHaveAttribute("href", "/wedstrijd/92");
  });

  it("never triggers the reduced row from the Dutch competition label alone (#2715)", () => {
    // The competition string "Tornooi" with a non-tournament competitionType
    // must render as an ordinary match row — the lawful detector is
    // `competitionType === "tournament"`, never the Dutch label.
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          makeMatch({
            id: 93,
            competition: "Tornooi",
            competitionType: "league",
          }),
        ]}
        events={[]}
      />,
    );
    const row = screen.getByTestId("agenda-match-row");
    expect(row).toHaveTextContent("KCVV Elewijt — Zemst");
  });

  it("interleaves matches and events by time within a day", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[makeMatch({ id: 1, date: "2026-09-12T20:00:00" })]}
        events={[makeEvent({ id: "e1", dateStart: "2026-09-12T10:00:00" })]}
      />,
    );
    const rows = screen.getAllByTestId(/agenda-(match|event)-row/);
    // 10:00 event sorts before the 20:00 match.
    expect(rows[0]).toHaveAttribute("data-testid", "agenda-event-row");
    expect(rows[1]).toHaveAttribute("data-testid", "agenda-match-row");
  });

  it("windows to the given month — items in other months are excluded", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[makeMatch({ id: 1, date: "2026-10-03T15:00:00" })]}
        events={[]}
      />,
    );
    expect(screen.queryByTestId("agenda-match-row")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /Nog geen wedstrijden of evenementen deze maand/i,
    );
  });

  it("renders the empty-month message when there are no items", () => {
    render(<CalendarAgenda {...baseProps} matches={[]} events={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /Nog geen wedstrijden of evenementen deze maand/i,
    );
  });

  it("renders an outcome underline on a played match score", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          makeMatch({
            id: 1,
            status: "finished",
            homeScore: 3,
            awayScore: 1,
            isHome: true,
          }),
        ]}
        events={[]}
      />,
    );
    const row = screen.getByTestId("agenda-match-row");
    expect(row).toHaveTextContent("3 – 1");
  });

  it("tints a settled result's score with the shared outcome band (#2656)", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          makeMatch({
            id: 1,
            status: "finished",
            homeScore: 3,
            awayScore: 1,
            isHome: true,
          }),
        ]}
        events={[]}
      />,
    );
    const score = screen.getByText("3 – 1");
    expect(score.getAttribute("style") ?? "").toContain("jersey-deep");
  });

  it("tints a draw with the shared ink-muted band, not the old solid alert copy", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          makeMatch({
            id: 1,
            status: "finished",
            homeScore: 1,
            awayScore: 1,
            isHome: true,
          }),
        ]}
        events={[]}
      />,
    );
    const score = screen.getByText("1 – 1");
    expect(score.getAttribute("style") ?? "").toContain("ink-muted");
  });

  // `isPlayedMatch` (which `<TeamAgendaRow>`'s own scoreline gate also uses)
  // still shows a `stopped` match's partial score — only the *tint* narrows
  // to `isSettledMatch`, matching `<TeamAgendaRow>`'s `computeOutcome`
  // (#2656 review: the two surfaces read one shared `OUTCOME_UNDERLINE`
  // record, but had drifted on which statuses may use it).
  it("shows an abandoned match's partial score untinted — nothing is settled", () => {
    render(
      <CalendarAgenda
        {...baseProps}
        matches={[
          makeMatch({
            id: 1,
            status: "stopped",
            homeScore: 1,
            awayScore: 1,
            isHome: true,
          }),
        ]}
        events={[]}
      />,
    );
    const score = screen.getByText("1 – 1");
    expect(score.getAttribute("style") ?? "").not.toContain("box-shadow");
  });

  describe("kalender_item_click", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fires source=match when a match row is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarAgenda
          {...baseProps}
          matches={[makeMatch({ id: 1 })]}
          events={[]}
        />,
      );
      await user.click(screen.getByTestId("agenda-match-row"));
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source: "match",
      });
    });

    it("fires the event's source when an event row is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarAgenda
          {...baseProps}
          matches={[]}
          events={[makeEvent({ id: "e1", source: "article" })]}
        />,
      );
      await user.click(screen.getByTestId("agenda-event-row"));
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source: "article",
      });
    });
  });
});
