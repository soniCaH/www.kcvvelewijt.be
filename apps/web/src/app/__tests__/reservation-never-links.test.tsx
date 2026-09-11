/**
 * A pitch-reservation placeholder is never a link — on every renderer (#2801)
 *
 * A fixture where both sides are the same club (`homeClubId === awayClubId`,
 * docs/ubiquitous-language.md § "Pitch-Reservation Placeholder") resolves to
 * `/wedstrijd/{id}`, a page that renders nothing worth clicking through to —
 * #2606 decision 5 dropped the `<Link>` for this reason. That rule is not
 * held by anything shared (#2688's `/simplify` round declined the extraction
 * into a wrapper component, #2699 decision 3), so it is held by six
 * independent implementations plus this file.
 *
 * **This is the growth guard, not a pin.** `failed-read-boundaries.test.ts`
 * names the split its own docblock draws: a file that *"pins the routes
 * #2563 touched; it is not the growth guard … the rule that scales is rule 5
 * in `cross-page-consistency.test.ts`"*. This file is that rule's sibling for
 * a different concept — table-driven, one row per renderer, so a rule that
 * must hold across every renderer *and any renderer added later* has exactly
 * one place to grow. **A new reservation renderer adds one line to
 * `RESERVATION_RENDERERS` below — nothing else.**
 *
 * It matters because reservations are not rare-and-forgettable: #2606's
 * census records seasonal batches (next May's eight rows across four
 * tournaments, the A-team's August friendly), while the renderers themselves
 * get edited in the ten months when none is on screen — exactly when a
 * regression is invisible to whoever is looking at the page.
 *
 * **Coverage.** #2801 names eight renderers: `TeamAgendaRow` and
 * `MatchStripView` already asserted this locally
 * (`TeamAgendaRow.test.tsx:796`/`:1022`, `MatchStripView.test.tsx:259`) and
 * are still listed here — a renderer having its own local test does not
 * exempt it from the shared rule, and the two entries prove this table
 * matches what those tests already established. The other six —
 * `CalendarWeek`, `CalendarAgenda`, `CalendarMonth`, `UpcomingMatchesClient`,
 * `FirstTeamAgendaRow`, and `MatchHero`'s reservation branch — had no
 * assertion anywhere before this file. `FirstTeamAgendaRow` and
 * `CalendarMonth`'s selected-day panel both delegate to `<TeamAgendaRow>`
 * rather than rendering their own reservation markup, so their rows below
 * are regression cover against a future host that stops delegating, not
 * proof of a second implementation.
 *
 * **The shared assertion has two parts, and the first is load-bearing.**
 * `expect(...queryByRole("link")).toBeNull()` alone passes on an empty DOM —
 * a row whose fixture misses its own renderer's date/month/selected-day
 * window renders nothing at all, and "renders nothing" satisfies "no link"
 * for free. `data-row-kind="reservation"`/`"reduced"` is the one marker every
 * reservation renderer carries (#2688, consolidated onto `data-row-kind` in
 * #2829) regardless of role (`<article>`, `<div>`,
 * `<section>`) or whether the subject text is its own text node — several
 * renderers, e.g. `UpcomingMatchesClient`'s row, compose it into a joined
 * caption string (`"U13 · Tornooi"`), so a shared `screen.getByText` check
 * can't reach it uniformly the way `MatchStripView.test.tsx:259`'s own
 * local `getByText("Tornooi")` can for that one component. Every row below
 * asserts *both*: the reservation actually rendered, then that it renders no
 * link. `MatchHero` has no `next/link` import anywhere in its 400+ lines, so
 * its null-link half is a tautology on its own — the presence half is what
 * makes that row assert anything at all; without it, flipping its fixture to
 * `isPlaceholder={false}` (the full two-crest scoreboard #2606 exists to
 * prevent) still passed.
 *
 * **What this file found, not just what it guards.** Every one of the eight
 * was already correct when this file was written — #2606/#2688 built the
 * reduced (`isPlaceholder` / `isReducedMatchRow`) branch into all of them
 * before this ticket existed. Confirmed red by hand, twice over:
 *
 * - **A real production regression.** Temporarily forcing `CalendarWeek`'s
 *   `WeekMatchCard` to skip its `isReducedMatchRow` branch (so a reservation
 *   fell through to the normal `<Link>` row) turned that one case red.
 *   `CalendarWeek` was the renderer mutated, not a stand-in for all eight —
 *   the other seven were not independently regressed this way; see the PR
 *   body for the exact diff and the restored/green rerun.
 * - **A vacuous pass, before the presence assertion existed.** Pointing
 *   `CalendarWeek` at `weekStart="2026-06-15"`, `CalendarAgenda`/
 *   `CalendarMonth` at `currentMonth={7}` (`CalendarMonth` also needs
 *   `selectedDate="2026-07-15"` — its day-detail panel looks up
 *   `selectedDate` independently of `currentMonth`), and `MatchHero` at
 *   `isPlaceholder={false}` — windows/fixtures that render nothing or the
 *   wrong thing — still reported 8/8 passed with only the null-link check.
 *   With the presence assertion added, the same four mutations now fail.
 *
 * Every case here was green on its first real run against production code,
 * which on its own proves nothing about the six that were previously
 * untested; the hand mutations above are what stand in for a real red run.
 *
 * **Not in scope** (#2801): the view-model union (#2699 decisions 1-2 /
 * #2802) — a `<Link>` is a render choice no data shape can forbid, so this
 * guard is independent of it.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2801
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection/TeamAgendaRow";
import { MatchStripView } from "@/components/layout/MatchStrip/MatchStripView";
import { CalendarWeek } from "@/components/calendar/CalendarWeek/CalendarWeek";
import { CalendarAgenda } from "@/components/calendar/CalendarAgenda/CalendarAgenda";
import { CalendarMonth } from "@/components/calendar/CalendarMonth/CalendarMonth";
import { UpcomingMatchesClient } from "@/components/home/UpcomingMatches/UpcomingMatchesClient";
import { FirstTeamAgendaRow } from "@/components/home/FirstTeamsBlock/FirstTeamAgendaRow";
import { MatchHero } from "@/components/match/MatchHero";
import {
  reservationMatch,
  tournamentMatch,
} from "@/components/calendar/calendar-mocks";
import { KCVV_CLUB_ID } from "@/lib/constants";
import type {
  ScheduleReducedMatch,
  ScheduleReservation,
  UpcomingReducedMatch,
  UpcomingReservation,
} from "@/components/match/types";

// Every renderer below either mounts no <Link> for a reservation row at all
// (the assertion this file exists to make) or, for the day-panel/homepage
// wrapper rows, delegates to one that doesn't — so the real `next/link` is
// never actually rendered by any case here. Mocked anyway, matching
// `TeamAgendaRow.test.tsx` / `MatchStripView.test.tsx` / the three
// `Calendar*.test.tsx` files this table draws its fixtures and components
// from: a real `<Link>` needs the app-router context none of these render
// trees provide, and the mock is what those peer files reach for instead.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

// Load-bearing for `CalendarAgenda` and `CalendarMonth` (its delegated
// `<TeamAgendaRow>` crest): both rows' fixture is `reservationMatch()`,
// whose `homeTeam`/`awayTeam` (`calendar-mocks.ts`'s `kcvv`) carry a real
// `logo` path, and `<Crest>` (`Crest.tsx:27`) reaches for `next/image`
// whenever `logo` is truthy. `CalendarWeek`'s reduced card renders no crest
// at all, so it doesn't need this — mocked anyway to match
// `CalendarWeek.test.tsx` / `CalendarAgenda.test.tsx` /
// `CalendarMonth.test.tsx`, the three files this table's
// `reservationMatch()` fixture and its `Calendar*` props convention come
// from.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

/** The `ScheduleReservation` shape `<TeamAgendaRow>`/`<MatchStripView>`/
 *  `<FirstTeamAgendaRow>`/`<MatchHero>` consume — the same literal
 *  `TeamAgendaRow.test.tsx`'s `PLACEHOLDER` and `MatchStripView.test.tsx`'s
 *  `reservation` already use, so this table asserts the same fixture those
 *  two files' own local tests do. */
const scheduleReservation: ScheduleReservation = {
  isPlaceholder: true,
  kind: "reservation",
  id: 90,
  date: new Date("2026-05-09T09:30:00.000Z"),
  time: "09:30",
  team: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  status: "scheduled",
  competition: "Tornooi",
};

/** The `UpcomingReservation` shape `<UpcomingMatchesClient>` consumes —
 *  mirrors `UpcomingMatches.mocks.ts`'s (unexported) `mockUpcomingReservation`. */
const upcomingReservation: UpcomingReservation = {
  isPlaceholder: true,
  kind: "reservation",
  id: 90,
  date: new Date("2026-05-09T09:30:00.000Z"),
  time: "09:30",
  team: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  status: "scheduled",
  competition: "Tornooi",
  kcvvTeamLabel: "U13",
};

/**
 * A tournament fixture with no result yet (#2696/#2802) — not a self-match,
 * but reduced the same way: no opponent link, no CTA. The `ScheduleRow`
 * twin of `scheduleReservation` above, so `<TeamAgendaRow>`/
 * `<MatchStripView>`/`<FirstTeamAgendaRow>`/`<MatchHero>` each get a second
 * row asserting the *other* reduced member, not just the reservation one.
 */
const scheduleReduced: ScheduleReducedMatch = {
  isPlaceholder: false,
  kind: "reduced",
  id: 91,
  date: new Date("2026-08-30T09:30:00.000Z"),
  time: "09:30",
  team: { id: 1391, name: "FC Zemst Sportief" },
  status: "scheduled",
  competition: "Tornooi",
  competitionType: "tournament",
};

/** The `UpcomingReducedMatch` twin of `upcomingReservation` above. */
const upcomingReduced: UpcomingReducedMatch = {
  isPlaceholder: false,
  kind: "reduced",
  id: 91,
  date: new Date("2026-08-30T09:30:00.000Z"),
  time: "09:30",
  team: { id: 1391, name: "FC Zemst Sportief" },
  status: "scheduled",
  competition: "Tornooi",
  competitionType: "tournament",
  kcvvTeamLabel: "U9",
};

/** One table row: a name for the `it.each` title, and a closure that mounts
 *  the renderer with a reduced fixture (a reservation or a tournament
 *  fixture with no result yet). `render()` itself is the assertion target's
 *  *cause*; the shared `it.each` body below asserts the *effect* (no link
 *  role) so every row states only what differs. */
interface ReducedRenderer {
  name: string;
  render: () => void;
}

// Within the same calendar week as `reservationMatch()`'s default date
// (2026-03-15, a Sunday) so `CalendarWeek`'s `weekStart="2026-03-09"` and
// `CalendarMonth`'s `currentMonth={3}` cover both fixtures without a second
// window per state.
const tournamentDate = "2026-03-13T09:30:00";

const RESERVATION_RENDERERS: ReducedRenderer[] = [
  {
    name: "TeamAgendaRow",
    render: () => render(<TeamAgendaRow match={scheduleReservation} />),
  },
  {
    name: "MatchStripView",
    render: () =>
      render(
        <MatchStripView
          data={{ result: null, fixture: scheduleReservation }}
        />,
      ),
  },
  {
    name: "CalendarWeek",
    render: () =>
      render(
        <CalendarWeek
          matches={[reservationMatch()]}
          events={[]}
          weekStart="2026-03-09" // Monday March 9
        />,
      ),
  },
  {
    name: "CalendarAgenda",
    render: () =>
      render(
        <CalendarAgenda
          matches={[reservationMatch()]}
          events={[]}
          currentMonth={3}
          currentYear={2026}
        />,
      ),
  },
  {
    name: "CalendarMonth",
    render: () =>
      render(
        <CalendarMonth
          matches={[reservationMatch()]}
          events={[]}
          selectedDate="2026-03-15"
          onSelectDate={() => {}}
          currentMonth={3}
          currentYear={2026}
        />,
      ),
  },
  {
    name: "UpcomingMatchesClient",
    render: () =>
      render(
        <UpcomingMatchesClient
          matches={[upcomingReservation]}
          initialVisible={5}
          kcvvTeamId={KCVV_CLUB_ID}
        />,
      ),
  },
  {
    name: "FirstTeamAgendaRow",
    render: () =>
      render(
        <FirstTeamAgendaRow
          match={scheduleReservation}
          teamSlug="eerste-ploeg"
          kind="fixture"
        />,
      ),
  },
  {
    name: "MatchHero (reservation branch)",
    render: () =>
      render(
        <MatchHero
          match={{
            kind: "reservation",
            isPlaceholder: true,
            team: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
            date: scheduleReservation.date,
            time: scheduleReservation.time,
            status: scheduleReservation.status,
            competition: scheduleReservation.competition,
          }}
        />,
      ),
  },
  // ── Tournament fixture, no result yet (#2696/#2802) — the union's other
  // reduced member. Not a self-match, so it needs its own row per renderer
  // rather than reusing the reservation fixtures above: a fix that only
  // widens `isPlaceholder` to `kind !== "match"` at the reservation call
  // site would leave this half unguarded.
  {
    name: "TeamAgendaRow (reduced tournament branch)",
    render: () => render(<TeamAgendaRow match={scheduleReduced} />),
  },
  {
    name: "MatchStripView (reduced tournament branch)",
    render: () =>
      render(
        <MatchStripView data={{ result: null, fixture: scheduleReduced }} />,
      ),
  },
  {
    name: "CalendarWeek (reduced tournament branch)",
    render: () =>
      render(
        <CalendarWeek
          matches={[tournamentMatch({ date: tournamentDate })]}
          events={[]}
          weekStart="2026-03-09"
        />,
      ),
  },
  {
    name: "CalendarAgenda (reduced tournament branch)",
    render: () =>
      render(
        <CalendarAgenda
          matches={[tournamentMatch({ date: tournamentDate })]}
          events={[]}
          currentMonth={3}
          currentYear={2026}
        />,
      ),
  },
  {
    name: "CalendarMonth (reduced tournament branch)",
    render: () =>
      render(
        <CalendarMonth
          matches={[tournamentMatch({ date: tournamentDate })]}
          events={[]}
          selectedDate="2026-03-13"
          onSelectDate={() => {}}
          currentMonth={3}
          currentYear={2026}
        />,
      ),
  },
  {
    name: "UpcomingMatchesClient (reduced tournament branch)",
    render: () =>
      render(
        <UpcomingMatchesClient
          matches={[upcomingReduced]}
          initialVisible={5}
          kcvvTeamId={KCVV_CLUB_ID}
        />,
      ),
  },
  {
    name: "FirstTeamAgendaRow (reduced tournament branch)",
    render: () =>
      render(
        <FirstTeamAgendaRow
          match={scheduleReduced}
          teamSlug="eerste-ploeg"
          kind="fixture"
        />,
      ),
  },
  {
    name: "MatchHero (reduced tournament branch)",
    render: () =>
      render(
        <MatchHero
          match={{
            kind: "reduced",
            isPlaceholder: false,
            team: { id: 1391, name: "FC Zemst Sportief" },
            date: scheduleReduced.date,
            time: scheduleReduced.time,
            status: scheduleReduced.status,
            competition: scheduleReduced.competition,
          }}
        />,
      ),
  },
];

describe("a reservation or a reduced tournament fixture is never a link (#2801/#2802)", () => {
  it.each(RESERVATION_RENDERERS)(
    "$name — renders with no <Link>",
    ({ render: renderRow }) => {
      renderRow();
      // Proves the row actually rendered before proving it renders no link —
      // see the docblock above for why a shared accessible query
      // (`getByText`) can't reach every row's subject uniformly, and why this
      // half is what makes the `MatchHero` row (no `next/link` import at
      // all) assert anything. Every renderer now marks its reduced state
      // with the single `data-row-kind` `MatchHero` introduced in #2802 —
      // the older two-boolean `data-placeholder`/`data-tournament` pair was
      // retired repo-wide in #2829.
      expect(
        document.querySelector(
          '[data-row-kind="reservation"], [data-row-kind="reduced"]',
        ),
      ).not.toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
    },
  );
});
