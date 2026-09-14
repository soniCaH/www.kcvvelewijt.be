/**
 * TeamMatchesSection unit tests.
 *
 * Covers:
 *  - Auto-hides when matches is empty
 *  - Auto-hides when no playable matches (nothing upcoming, nothing finished)
 *  - Renders featured "Eerstvolgende" row for the next scheduled match
 *  - Renders recent finished results (max 3)
 *  - Renders "Volledige kalender →" link to /ploegen/[slug]/wedstrijden
 *  - No crash when only future matches exist (season-start)
 *  - No crash when only past matches exist (end of season)
 *  - The `now` prop, not the ambient clock, decides next/recent (#2636
 *    review round 3 — the page must be able to pin the exact instant it
 *    already used for `hasVisibleMatches`, since the two can otherwise
 *    disagree by up to the ISR cache window rather than milliseconds)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamMatchesSection } from "./TeamMatchesSection";
import type { ScheduleMatch } from "@/components/match/types";

const NOW = new Date("2026-09-15T12:00:00.000Z");

function makeMatch(
  overrides: Partial<ScheduleMatch> & { id: number },
): ScheduleMatch {
  return {
    kind: "match",
    date: new Date("2026-09-20T15:00:00.000Z"),
    time: "15:00",
    homeTeam: { id: 10, name: "KCVV Elewijt" },
    awayTeam: { id: 20, name: "FC Opponent" },
    status: "scheduled",
    competition: "3e Provinciale A",
    isHome: true,
    ...overrides,
  };
}

describe("TeamMatchesSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when matches array is empty", () => {
    const { container } = render(
      <TeamMatchesSection matches={[]} teamSlug="kcvv-a" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when no upcoming or finished matches exist", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "postponed",
        date: new Date("2026-09-10T15:00:00.000Z"),
      }),
    ];
    const { container } = render(
      <TeamMatchesSection matches={matches} teamSlug="kcvv-a" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the featured next match", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "scheduled",
        date: new Date("2026-09-20T15:00:00.000Z"),
      }),
    ];
    render(<TeamMatchesSection matches={matches} teamSlug="kcvv-a" />);
    const featured = screen
      .getAllByTestId("team-agenda-row")
      .find((el) => el.getAttribute("data-featured") === "true");
    expect(featured).not.toBeUndefined();
  });

  it("renders up to 3 recent finished results", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "finished",
        date: new Date("2026-09-10T15:00:00.000Z"),
        homeScore: 1,
        awayScore: 0,
      }),
      makeMatch({
        id: 2,
        status: "finished",
        date: new Date("2026-09-07T15:00:00.000Z"),
        homeScore: 2,
        awayScore: 2,
      }),
      makeMatch({
        id: 3,
        status: "finished",
        date: new Date("2026-09-03T15:00:00.000Z"),
        homeScore: 0,
        awayScore: 1,
      }),
      makeMatch({
        id: 4,
        status: "finished",
        date: new Date("2026-08-27T15:00:00.000Z"),
        homeScore: 3,
        awayScore: 0,
      }),
    ];
    render(<TeamMatchesSection matches={matches} teamSlug="kcvv-a" />);
    const rows = screen
      .getAllByTestId("team-agenda-row")
      .filter((el) => el.getAttribute("data-featured") === "false");
    expect(rows).toHaveLength(3);
  });

  it("renders the calendar link to /ploegen/[slug]/wedstrijden", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "finished",
        date: new Date("2026-09-10T15:00:00.000Z"),
        homeScore: 1,
        awayScore: 0,
      }),
    ];
    render(<TeamMatchesSection matches={matches} teamSlug="kcvv-elewijt-a" />);
    const link = screen.getByTestId("team-matches-calendar-link");
    expect(link.getAttribute("href")).toBe(
      "/ploegen/kcvv-elewijt-a/wedstrijden",
    );
    expect(link.textContent).toContain("Volledige kalender");
  });

  it("renders only the next match when no finished results exist (season-start)", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "scheduled",
        date: new Date("2026-09-20T15:00:00.000Z"),
      }),
      makeMatch({
        id: 2,
        status: "scheduled",
        date: new Date("2026-09-27T15:00:00.000Z"),
      }),
    ];
    render(<TeamMatchesSection matches={matches} teamSlug="kcvv-a" />);
    const rows = screen.getAllByTestId("team-agenda-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.getAttribute("data-featured")).toBe("true");
  });

  it("renders only recent rows when no next match exists (end of season)", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "finished",
        date: new Date("2026-09-10T15:00:00.000Z"),
        homeScore: 1,
        awayScore: 0,
      }),
    ];
    render(<TeamMatchesSection matches={matches} teamSlug="kcvv-a" />);
    const featured = screen
      .getAllByTestId("team-agenda-row")
      .filter((el) => el.getAttribute("data-featured") === "true");
    expect(featured).toHaveLength(0);
  });

  it("decides next/recent from the passed now prop, not the ambient clock", () => {
    // The ambient (faked) clock is 2026-09-15. A fixture on 2026-09-20 reads
    // as "next" against that — but if the caller pins a LATER `now`
    // (mirroring an ISR-cached page's snapshot outliving that fixture's
    // kickoff before the client hydrates), the section must follow the prop,
    // not the ambient clock.
    const matches = [
      makeMatch({
        id: 1,
        status: "scheduled",
        date: new Date("2026-09-20T15:00:00.000Z"),
      }),
    ];
    const pinnedNow = new Date("2026-09-25T00:00:00.000Z"); // after the fixture
    // Relative to pinnedNow the fixture is in the past and still unfinished
    // (PSD hasn't synced a result), so there is neither a next match nor a
    // finished result — the section auto-hides instead of trusting the
    // ambient clock, which would still read it as upcoming.
    const { container } = render(
      <TeamMatchesSection
        matches={matches}
        teamSlug="kcvv-a"
        now={pinnedNow}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
