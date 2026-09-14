import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MatchHero,
  type MatchHeroRow,
  type MatchHeroReservation,
  type MatchHeroReduced,
} from "./MatchHero";

// Type-level assertion (#2802 review) — TypeScript, not vitest, is under
// test here. `@ts-expect-error` fails the type check if `MatchHeroReservation`
// or `MatchHeroReduced` ever grow a `homeTeam` field, which is what makes a
// renderer reaching for the two-crest scoreboard on a reservation/reduced
// row a compile error instead of a runtime crash.
const _reservationHasNoHomeTeam: MatchHeroReservation = {
  kind: "reservation",
  team: { id: 1235, name: "KCVV Elewijt" },
  date: new Date(),
  status: "scheduled",
  // @ts-expect-error — a reservation has one `team`, never a `homeTeam`
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
};
const _reducedHasNoHomeTeam: MatchHeroReduced = {
  kind: "reduced",
  team: { id: 99, name: "FC Zemst Sportief" },
  date: new Date(),
  status: "scheduled",
  // @ts-expect-error — a reduced row has one `team`, never a `homeTeam`
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
};

const homeTeam = { id: 1235, name: "KCVV Elewijt", logo: "/logos/kcvv.svg" };
const awayTeam = { id: 9999, name: "RC Mechelen", logo: "/logos/rcm.svg" };

// Saturday 14 June 2025 → Belgian football season ’24/’25 (cutoff: month >= 7)
const scheduledMatchDate = new Date("2025-06-14T13:30:00Z");
// Saturday 13 September 2025 → ’25/’26 season
const finishedMatchDate = new Date("2025-09-13T13:30:00Z");

const baseMatch = {
  kind: "match",
  homeTeam,
  awayTeam,
} as const;

const baseReservation = {
  kind: "reservation",
  team: homeTeam,
} as const;

describe("MatchHero", () => {
  describe("page headline (#2555)", () => {
    it("owns the route's only <h1> — the scoreline itself", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            time: "14:30",
            status: "scheduled",
          }}
        />,
      );
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
      // The name is assembled from sibling elements, so the separators between
      // them are layout, not text — match tolerantly rather than asserting a
      // spacing jsdom does not compute.
      expect(headings[0]).toHaveTextContent(/KCVV Elewijt\s*vs\s*RC Mechelen/);
    });

    it("reads the scoreline once the match is played", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            homeTeam: { ...homeTeam, score: 3 },
            awayTeam: { ...awayTeam, score: 1 },
            date: finishedMatchDate,
            time: "14:30",
            status: "finished",
          }}
        />,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        /KCVV Elewijt\s*3\s*—\s*1\s*RC Mechelen/,
      );
    });

    it.each(["postponed", "cancelled", "stopped", "finished"] as const)(
      "falls back to 'vs' in the name when %s carries no score",
      (status) => {
        render(
          <MatchHero
            match={{ ...baseMatch, date: finishedMatchDate, status }}
          />,
        );
        // The em-dash placeholders still paint — `textContent` keeps them — so
        // this asserts the accessible NAME, which is what `aria-hidden` moves.
        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading.textContent).toContain("—");
        expect(heading).toHaveAccessibleName(/KCVV Elewijt\s*vs\s*RC Mechelen/);
      },
    );

    it("keeps the crests out of the name — they are decorative", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            status: "scheduled",
          }}
        />,
      );
      const heading = screen.getByRole("heading", { level: 1 });
      for (const img of heading.querySelectorAll("img")) {
        expect(img).toHaveAttribute("alt", "");
      }
    });
  });

  describe("kicker copy", () => {
    it("renders VOORBESCHOUWING for scheduled matches", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            time: "14:30",
            status: "scheduled",
          }}
        />,
      );
      expect(screen.getByText(/VOORBESCHOUWING/)).toBeInTheDocument();
    });

    it.each([
      "finished",
      "forfeited",
      "postponed",
      "cancelled",
      "stopped",
    ] as const)("renders MATCHVERSLAG for %s", (status) => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            homeTeam: { ...homeTeam, score: 3 },
            awayTeam: { ...awayTeam, score: 1 },
            date: finishedMatchDate,
            time: "14:30",
            status,
          }}
        />,
      );
      expect(screen.getByText(/MATCHVERSLAG/)).toBeInTheDocument();
    });
  });

  describe("score region", () => {
    it("renders 'vs' for scheduled matches", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            status: "scheduled",
          }}
        />,
      );
      const scoreEl = screen.getByText("vs");
      expect(scoreEl).toBeInTheDocument();
      expect(scoreEl.closest("[data-score-state]")).toHaveAttribute(
        "data-score-state",
        "vs",
      );
    });

    it("renders numeric score for finished matches", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            homeTeam: { ...homeTeam, score: 3 },
            awayTeam: { ...awayTeam, score: 1 },
            date: finishedMatchDate,
            status: "finished",
          }}
        />,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      const homeScore = screen.getByText("3");
      expect(homeScore.closest("[data-score-state]")).toHaveAttribute(
        "data-score-state",
        "numeric",
      );
    });

    it("renders em-dash placeholders when score is missing on a finished status", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: finishedMatchDate,
            status: "cancelled",
          }}
        />,
      );
      // The score region itself + the em-dash separator all use "—".
      // Two missing-score slots + the separator = three em-dashes.
      expect(screen.getAllByText("—")).toHaveLength(3);
    });
  });

  describe("status badge integration", () => {
    it("does not render a badge for scheduled matches", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            status: "scheduled",
          }}
        />,
      );
      expect(screen.queryByText("FT")).not.toBeInTheDocument();
      expect(screen.queryByText("CANC")).not.toBeInTheDocument();
    });

    it("renders the CANC badge for cancelled matches", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: finishedMatchDate,
            status: "cancelled",
          }}
        />,
      );
      const badge = screen.getByText("CANC");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Geannuleerd");
    });
  });

  describe("team names", () => {
    it("exposes the full team name via title attribute (for truncated hover)", () => {
      const longHome = {
        id: 4242,
        name: "KFC Sint-Stevens-Woluwe-Diegem",
        logo: homeTeam.logo,
      };
      render(
        <MatchHero
          match={{
            ...baseMatch,
            homeTeam: longHome,
            date: scheduledMatchDate,
            status: "scheduled",
          }}
        />,
      );
      const nameEl = screen.getByText(longHome.name);
      expect(nameEl).toHaveAttribute("title", longHome.name);
    });

    it("renders a typographic shield fallback when no logo is provided", () => {
      render(
        <MatchHero
          match={{
            kind: "match",
            homeTeam: { id: 1235, name: "KCVV Elewijt" },
            awayTeam: { id: 9999, name: "RC Mechelen" },
            date: scheduledMatchDate,
            status: "scheduled",
          }}
        />,
      );
      // First-letter initials in the shield fallback (aria-hidden span).
      expect(
        screen.getByText("K", { selector: "[aria-hidden='true']" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("R", { selector: "[aria-hidden='true']" }),
      ).toBeInTheDocument();
    });
  });

  describe("stub elements", () => {
    it("renders venue when present", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            time: "14:30",
            venue: "Sportpark Elewijt",
            status: "scheduled",
          }}
        />,
      );
      expect(screen.getByText("Sportpark Elewijt")).toBeInTheDocument();
    });

    it("omits venue when missing", () => {
      const { container } = render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            time: "14:30",
            status: "scheduled",
          }}
        />,
      );
      expect(container.textContent).not.toContain("Sportpark");
    });
  });

  describe("stub date layout (#2300)", () => {
    it("keeps the date wrapper inline on mobile and stacked from md up", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: scheduledMatchDate,
            time: "14:30",
            status: "scheduled",
          }}
        />,
      );
      // "ZA 14" and "JUN" share a wrapper that is a horizontal baseline-aligned
      // row on mobile and reverts to the two-line stack at the md breakpoint.
      const dayLine = screen.getByText(/^ZA 14$/);
      const wrapper = dayLine.parentElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper).toHaveClass(
        "flex",
        "flex-row",
        "items-baseline",
        "gap-x-2",
        "md:flex-col",
        "md:items-start",
        "md:gap-x-0",
      );
      // The month line must not carry an unconditional top margin (which would
      // push it below the day on the mobile inline row); the margin is md-only.
      const monthLine = screen.getByText("JUN");
      expect(monthLine).toHaveClass("md:mt-1");
      expect(monthLine).not.toHaveClass("mt-1");
    });
  });

  describe("competition meta line", () => {
    it("composes competition · kcvvTeamLabel · season", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: finishedMatchDate,
            status: "finished",
            competition: "3e provinciale A",
            kcvvTeamLabel: "KCVV-A",
          }}
        />,
      );
      expect(screen.getByText("3e provinciale A")).toBeInTheDocument();
      expect(screen.getByText("KCVV-A")).toBeInTheDocument();
      // 2025-09 → ’25/’26
      expect(screen.getByText("’25/’26")).toBeInTheDocument();
    });

    it("drops missing parts gracefully", () => {
      render(
        <MatchHero
          match={{
            ...baseMatch,
            date: finishedMatchDate,
            status: "finished",
          }}
        />,
      );
      // Season label is always present (derived from date).
      expect(screen.getByText("’25/’26")).toBeInTheDocument();
    });
  });

  describe("pitch-reservation placeholder (#2606, #2688)", () => {
    it("names one club in the <h1>, never 'vs' a second one", () => {
      render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            time: "09:30",
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("KCVV Elewijt");
      expect(heading.textContent).not.toMatch(/vs/i);
      expect(screen.queryByText("RC Mechelen")).toBeNull();
    });

    it("carries the one marker every reservation renderer carries (#2688)", () => {
      const { container } = render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(
        container.querySelector('[data-row-kind="reservation"]'),
      ).not.toBeNull();
    });

    it("shows the real date/time/venue it has, no score region", () => {
      render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            time: "09:30",
            venue: "Sportpark Elewijt",
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(screen.getByText("09:30")).toBeInTheDocument();
      expect(screen.getByText("Sportpark Elewijt")).toBeInTheDocument();
      expect(screen.queryByText(/^vs$/)).toBeNull();
      expect(screen.queryByText(/—/)).toBeNull();
    });

    it("renders the competition label as the subject — the same vocabulary <TeamAgendaRow> uses", () => {
      render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(screen.getByText("Tornooi")).toBeInTheDocument();
    });

    it("names the squad that reserved the slot — the one useful fact this deliberately empty page owes a visitor", () => {
      render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
            kcvvTeamLabel: "U13",
          }}
        />,
      );
      expect(screen.getByText("U13")).toBeInTheDocument();
    });

    it("falls back to the RESERVATION_SUBJECT_FALLBACK wording when no competition label is sent", () => {
      render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            status: "scheduled",
          }}
        />,
      );
      expect(screen.getByText("Gereserveerd")).toBeInTheDocument();
    });

    it("names an exceptional status via the same MatchStatusBadge table — a reservation can be called off too", () => {
      render(
        <MatchHero
          match={{
            ...baseReservation,
            date: scheduledMatchDate,
            status: "cancelled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(screen.getByText("Geannuleerd")).toBeInTheDocument();
      expect(screen.getAllByText("CANC").length).toBeGreaterThan(0);
    });
  });

  describe("tournament fixture with no result yet (#2696/#2802)", () => {
    const zemst = { id: 77, name: "FC Zemst Sportief", logo: awayTeam.logo };
    const kcvv = { id: 1235, name: "KCVV Elewijt", logo: homeTeam.logo };
    const baseReduced = {
      kind: "reduced",
      team: zemst,
    } as const;

    it("names the other club in the <h1>, never 'vs' — never KCVV's own crest", () => {
      render(
        <MatchHero
          match={{
            ...baseReduced,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("FC Zemst Sportief");
      expect(heading.textContent).not.toMatch(/vs/i);
      expect(screen.queryByText("KCVV Elewijt")).toBeNull();
    });

    // Resolving the other club by id (regardless of which PSD side it lands
    // on) is the adapter's job now — `matchDetailToHeroRow` hands MatchHero
    // an already-resolved `team`. Covered at the source: `otherClubSide`
    // (`lib/utils/match-display.test.ts`) and `matchDetailToHeroRow`
    // (`wedstrijd/[matchId]/utils.test.ts`).

    it("names the subject by competition alone — never repeating the club the <h1> already names (#2802 review)", () => {
      // Unlike the caption-only reduced renderers (<TeamAgendaRow>,
      // <CalendarAgenda>), the <h1> here already prints the full club name
      // as its own text node — composing "competition · club" underneath it
      // would print "FC Zemst Sportief" twice.
      render(
        <MatchHero
          match={{
            ...baseReduced,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(screen.getByText("Tornooi")).toBeInTheDocument();
      expect(screen.queryByText("Tornooi · FC Zemst Sportief")).toBeNull();
      // The club name appears exactly once — the <h1>, not the meta line too.
      expect(screen.getAllByText("FC Zemst Sportief")).toHaveLength(1);
    });

    it("keeps VOORBESCHOUWING/MATCHVERSLAG as the kicker, never 'GERESERVEERD' — a tournament fixture is a real dated match, not a booking (#2802 review)", () => {
      const { rerender } = render(
        <MatchHero
          match={{
            ...baseReduced,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(screen.getByText(/VOORBESCHOUWING/)).toBeInTheDocument();
      expect(screen.queryByText(/GERESERVEERD/)).toBeNull();

      rerender(
        <MatchHero
          match={{
            ...baseReduced,
            date: finishedMatchDate,
            status: "finished",
            competition: "Tornooi",
          }}
        />,
      );
      expect(screen.getByText(/MATCHVERSLAG/)).toBeInTheDocument();
    });

    it("carries the data-row-kind=reduced marker, not reservation", () => {
      const { container } = render(
        <MatchHero
          match={{
            ...baseReduced,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "Tornooi",
          }}
        />,
      );
      expect(
        container.querySelector('[data-row-kind="reduced"]'),
      ).not.toBeNull();
      expect(
        container.querySelector('[data-row-kind="reservation"]'),
      ).toBeNull();
    });

    it("reverts to the full two-crest scoreboard once a result exists", () => {
      const row: MatchHeroRow = {
        kind: "match",
        homeTeam: { ...kcvv, score: 3 },
        awayTeam: { ...zemst, score: 1 },
        date: finishedMatchDate,
        status: "finished",
        competition: "Tornooi",
      };
      render(<MatchHero match={row} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        /KCVV Elewijt\s*3\s*—\s*1\s*FC Zemst Sportief/,
      );
    });

    it("renders an ordinary league fixture as the full two-crest scoreboard, even before kickoff", () => {
      // Classification (league vs. tournament, reduced vs. match) happens
      // upstream in `matchRowKind` — covered by `match-display.test.ts` and
      // `utils.test.ts`'s `matchDetailToHeroRow` suite. This only checks
      // that MatchHero renders the "match" kind it was actually handed.
      render(
        <MatchHero
          match={{
            kind: "match",
            homeTeam: kcvv,
            awayTeam: zemst,
            date: scheduledMatchDate,
            status: "scheduled",
            competition: "3e Provinciale",
          }}
        />,
      );
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(
        /KCVV Elewijt\s*vs\s*FC Zemst Sportief/,
      );
    });
  });
});
