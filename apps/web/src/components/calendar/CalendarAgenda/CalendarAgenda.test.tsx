/**
 * CalendarAgenda Component Tests (Phase 6.D — #1994).
 *
 * The "labelled wall": a month-windowed list with an EditorialHeading month
 * header, per-day groups (count sub-header + DashedDivider) and every item shown,
 * events tinted so a dense day never buries them.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CalendarAgenda } from "./CalendarAgenda";
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
    date: "2026-09-12T10:00:00", // Saturday
    homeTeam: { id: 1, name: "KCVV Elewijt", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Zemst" },
    status: "scheduled" as CalendarMatch["status"],
    team: "U7",
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
    dateStart: "2026-09-12T18:00:00",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
    ...overrides,
  };
}

const baseProps = { currentMonth: 9, currentYear: 2026 };

describe("CalendarAgenda", () => {
  it("renders the month header", () => {
    render(<CalendarAgenda {...baseProps} matches={[]} events={[]} />);
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
      /Geen wedstrijden of evenementen deze maand/i,
    );
  });

  it("renders the empty-month message when there are no items", () => {
    render(<CalendarAgenda {...baseProps} matches={[]} events={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /Geen wedstrijden of evenementen deze maand/i,
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
});
