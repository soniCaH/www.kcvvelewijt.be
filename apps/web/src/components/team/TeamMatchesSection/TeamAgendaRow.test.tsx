/**
 * TeamAgendaRow unit tests.
 *
 * Covers:
 *  - Date stub day/month render
 *  - Score rendered for finished matches (desktop score slot)
 *  - Kickoff time rendered for upcoming matches
 *  - Outcome underline: win / draw / loss box-shadow on the score, each its own tint
 *  - Featured (jersey-deep) vs normal card data-attribute
 *  - Mobile: home/away icon (House/Bus) visible
 *  - Long name truncation (title attribute)
 *  - Symmetric scoreboard: both sides keep an even split (score stays centred)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamAgendaRow } from "./TeamAgendaRow";
import type {
  ScheduleMatch,
  ScheduleReducedMatch,
  ScheduleReservation,
} from "@/components/match/types";

// Render Link as a plain anchor that forwards onClick (no router in tests).
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

const BASE: ScheduleMatch = {
  isPlaceholder: false,
  kind: "match",
  id: 1,
  date: new Date("2026-08-15T15:00:00.000Z"),
  time: "15:00",
  homeTeam: { id: 10, name: "KCVV Elewijt" },
  awayTeam: { id: 20, name: "FC Opponent" },
  status: "scheduled",
  competition: "3e Provinciale A",
  isHome: true,
};

const FINISHED_WIN: ScheduleMatch = {
  ...BASE,
  status: "finished",
  homeScore: 3,
  awayScore: 1,
  isHome: true,
};

const FINISHED_DRAW: ScheduleMatch = {
  ...BASE,
  status: "finished",
  homeScore: 1,
  awayScore: 1,
  isHome: true,
};

const FINISHED_LOSS: ScheduleMatch = {
  ...BASE,
  status: "finished",
  homeScore: 0,
  awayScore: 2,
  isHome: true,
};

/** An opponent whose name outruns the row, carrying a squad suffix (#2405). */
const LONG_AWAY: ScheduleMatch = {
  ...BASE,
  awayTeam: {
    id: 20,
    name: "Yellow Red Koninklijke Voetbalclub Mechelen",
    teamLabel: "U23",
  },
};

// Both layouts are in the DOM under jsdom (no CSS breakpoints), so a
// normal row's combined `textContent` cannot tell them apart. Shared by
// "Kind word" below — the normal row's two `data-layout` trees genuinely
// differ. The placeholder row (further below) collapsed to one tree and
// needs no such helper.
const desktopText = () =>
  document.querySelector('[data-layout="desktop"]')?.textContent ?? "";
const mobileText = () =>
  document.querySelector('[data-layout="mobile"]')?.textContent ?? "";

/** A pitch-reservation placeholder (#2606) — both sides are the same club. */
const PLACEHOLDER: ScheduleReservation = {
  isPlaceholder: true,
  kind: "reservation",
  id: 99,
  date: new Date("2026-05-09T09:30:00.000Z"),
  time: "09:30",
  team: { id: 1235, name: "KCVV Elewijt" },
  status: "scheduled",
  competition: "Tornooi",
};

/**
 * A genuine tournament fixture (#2696) with no result yet — not a
 * self-match, but reduced all the same until a scoreline arrives. The
 * adapter (`transformMatchToSchedule`) is what decides `kind: "reduced"`
 * for a raw `Match` shaped this way; this fixture spells out that decision
 * directly since the component now trusts `kind` rather than re-deriving it
 * from `competitionType`/`status`/scores (#2802).
 */
const TOURNAMENT: ScheduleReducedMatch = {
  isPlaceholder: false,
  kind: "reduced",
  id: 200,
  date: new Date("2026-08-30T09:30:00.000Z"),
  time: "09:30",
  team: {
    id: 77,
    name: "FC Zemst Sportief",
    logo: "https://example.com/zemst.png",
  },
  status: "scheduled",
  competition: "Tornooi",
  competitionType: "tournament",
};

/**
 * The reduced-row content box both the placeholder and tournament registers
 * share — hand-spelling this five-utility selector at each call site meant
 * a cosmetic Tailwind edit (e.g. `gap-2` → `gap-2.5`) would break three
 * tests in two describes at once.
 */
const contentBox = (row: HTMLElement) =>
  row.querySelector(".flex.w-full.items-center.gap-2.px-3.py-2");

describe("TeamAgendaRow", () => {
  describe("Date stub", () => {
    it("renders the day number", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain("15");
    });

    it("renders the abbreviated Dutch month", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toMatch(/aug/i);
    });

    it("renders the date stub by default", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByLabelText("15 aug")).toBeInTheDocument();
    });

    it("omits the date stub when showDateStub is false", () => {
      render(<TeamAgendaRow match={BASE} showDateStub={false} />);
      expect(screen.queryByLabelText("15 aug")).not.toBeInTheDocument();
      // the row itself still renders.
      expect(screen.getByTestId("team-agenda-row")).toBeInTheDocument();
    });
  });

  /**
   * The row is a client component, so every date it formats is rendered twice —
   * once on Vercel (UTC) and once in the visitor's browser. A BFF match date
   * carries Belgian wall-clock in its UTC fields, so reading it in the runtime
   * zone printed 22:00 on the server and 18:00 in New York: a React text
   * mismatch on every fixture the feed sends without a `time` (#2601).
   *
   * `process.env.TZ` moves Luxon's system zone live, which is what makes the
   * two halves of the mismatch reachable from one process. Restored, never
   * deleted — an adjacent block reads the same variable.
   */
  describe("Runtime-zone independence", () => {
    const TIMELESS: ScheduleMatch = {
      ...BASE,
      // 22:00 Belgian kickoff, as the BFF spells it. Late enough that a
      // converting parse rolls it into the next day.
      date: new Date(Date.UTC(2026, 7, 3, 22, 0)),
      time: undefined,
    };

    let savedTz: string | undefined;
    beforeEach(() => {
      savedTz = process.env.TZ;
    });
    afterEach(() => {
      if (savedTz !== undefined) process.env.TZ = savedTz;
      else delete process.env.TZ;
    });

    /** The row's rendered kickoff, day and month under one runtime zone. */
    function renderIn(tz: string): string {
      process.env.TZ = tz;
      const { unmount } = render(<TeamAgendaRow match={TIMELESS} />);
      const text = screen.getByTestId("team-agenda-row").textContent ?? "";
      const stub = screen
        .getByTestId("team-agenda-row")
        .querySelector("[aria-label]");
      unmount();
      return `${text}|${stub?.getAttribute("aria-label")}`;
    }

    it("renders identically on a UTC host and in a far-off browser zone", () => {
      expect(renderIn("America/New_York")).toBe(renderIn("UTC"));
    });

    it("renders identically on a UTC host and in the visitor's own zone", () => {
      expect(renderIn("Europe/Brussels")).toBe(renderIn("UTC"));
    });

    it("prints the fixture's own wall clock, not a converted one", () => {
      process.env.TZ = "America/New_York";
      render(<TeamAgendaRow match={TIMELESS} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "22:00",
      );
      expect(screen.getByLabelText("3 aug")).toBeInTheDocument();
    });
  });

  describe("Score / time", () => {
    it("shows the score for a finished match", () => {
      render(<TeamAgendaRow match={FINISHED_WIN} />);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("3");
      expect(row.textContent).toContain("1");
    });

    it("shows the kickoff time for an upcoming match", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "15:00",
      );
    });
  });

  describe("upcomingLabel", () => {
    it("shows the upcoming label instead of the kickoff time for a scheduled match", () => {
      render(<TeamAgendaRow match={BASE} upcomingLabel="Gepland" />);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("Gepland");
      expect(row.textContent).not.toContain("15:00");
    });

    it("still shows the scoreline for a finished match even when set", () => {
      render(<TeamAgendaRow match={FINISHED_WIN} upcomingLabel="Gepland" />);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("3");
      expect(row.textContent).not.toContain("Gepland");
    });

    it("falls back to the kickoff time when no upcoming label is given", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "15:00",
      );
    });

    it("never shows the upcoming label for a finished match with missing scores", () => {
      render(
        <TeamAgendaRow
          match={{
            ...BASE,
            status: "finished",
            homeScore: undefined,
            awayScore: undefined,
          }}
          upcomingLabel="Gepland"
        />,
      );
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("15:00");
      expect(row.textContent).not.toContain("Gepland");
    });
  });

  describe("Outcome underline (box-shadow)", () => {
    it("applies win shadow on the score span", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_WIN} />);
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("jersey-deep");
    });

    it("applies loss shadow on the score span", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_LOSS} />);
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("color-alert");
    });

    it("applies its own ink-muted shadow for a draw (#2512/#2656)", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_DRAW} />);
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("ink-muted");
    });

    it("tints a forfeit like any other win (#2423)", () => {
      // <MatchStripView> derives its outcome from the scores alone, so gating
      // this on `status === "finished"` made the two surfaces disagree about
      // the same match.
      const { container } = render(
        <TeamAgendaRow match={{ ...FINISHED_WIN, status: "forfeited" }} />,
      );
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("jersey-deep");
    });

    it("leaves an abandoned match untinted — nothing is settled", () => {
      const { container } = render(
        <TeamAgendaRow match={{ ...FINISHED_WIN, status: "stopped" }} />,
      );
      expect(container.querySelectorAll("[style*='box-shadow']").length).toBe(
        0,
      );
    });
  });

  describe("Status marker in the caption (#2423)", () => {
    it.each([
      ["forfeited", "FF", "Forfait"],
      ["postponed", "PP", "Uitgesteld"],
      ["cancelled", "CANC", "Geannuleerd"],
      ["stopped", "STOP", "Gestopt"],
    ] as const)(
      "marks a %s match with the <MatchStatusBadge> short form",
      (status, abbreviation, longForm) => {
        render(<TeamAgendaRow match={{ ...FINISHED_WIN, status }} />);
        // Both layouts render the caption, so the marker appears more than once.
        const markers = screen.getAllByText(abbreviation);
        expect(markers.length).toBeGreaterThan(0);
        // The long form still reaches hover + assistive tech via <abbr title>.
        expect(markers[0]?.tagName).toBe("ABBR");
        expect(markers[0]?.getAttribute("title")).toBe(longForm);
      },
    );

    it("leaves a finished match unmarked — the scoreline already says it", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_WIN} />);
      expect(container.querySelector("abbr")).toBeNull();
    });

    it("leaves a scheduled match unmarked — the kickoff time already says it", () => {
      const { container } = render(<TeamAgendaRow match={BASE} />);
      expect(container.querySelector("abbr")).toBeNull();
    });

    it("keeps the competition alongside the marker", () => {
      render(
        <TeamAgendaRow match={{ ...FINISHED_WIN, status: "forfeited" }} />,
      );
      expect(screen.getAllByText("FF").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/3e Provinciale A/).length).toBeGreaterThan(0);
    });
  });

  describe("Featured card", () => {
    it("sets data-featured=true when featured prop is true", () => {
      render(<TeamAgendaRow match={BASE} featured />);
      expect(
        screen.getByTestId("team-agenda-row").getAttribute("data-featured"),
      ).toBe("true");
    });

    it("sets data-featured=false by default", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(
        screen.getByTestId("team-agenda-row").getAttribute("data-featured"),
      ).toBe("false");
    });
  });

  describe("kcvvTeamId fallback for home/away resolution", () => {
    it("uses kcvvTeamId to resolve home when match.isHome is undefined", () => {
      const match: ScheduleMatch = {
        ...FINISHED_WIN,
        isHome: undefined,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 99, name: "FC Opponent" },
        homeScore: 3,
        awayScore: 1,
      };
      const { container } = render(
        <TeamAgendaRow match={match} kcvvTeamId={1235} />,
      );
      // KCVV is home (id 1235 matches homeTeam.id 1235), home wins 3-1 → win shadow
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("jersey-deep");
    });

    it("uses kcvvTeamId to resolve away when match.isHome is undefined", () => {
      const match: ScheduleMatch = {
        ...FINISHED_LOSS,
        isHome: undefined,
        homeTeam: { id: 99, name: "FC Opponent" },
        awayTeam: { id: 1235, name: "KCVV Elewijt" },
        homeScore: 2,
        awayScore: 0,
      };
      const { container } = render(
        <TeamAgendaRow match={match} kcvvTeamId={1235} />,
      );
      // KCVV is away (id 1235 matches awayTeam.id? No, kcvvTeamId=1235 ≠ homeTeam.id=99 → isHome=false)
      // isHome=false + homeScore(2) > awayScore(0) → loss shadow
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("color-alert");
    });
  });

  describe("Competition caption", () => {
    it("renders the competition name", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "3e Provinciale A",
      );
    });

    it("omits the competition slot when absent", () => {
      render(<TeamAgendaRow match={{ ...BASE, competition: undefined }} />);
      expect(screen.getByTestId("team-agenda-row").textContent).not.toContain(
        "Provinciale",
      );
    });
  });

  describe("captionLabel (KCVV squad in the caption, P2)", () => {
    it("renders the caption label joined to the competition", () => {
      render(<TeamAgendaRow match={BASE} captionLabel="A-Ploeg" />);
      // Appears once per layout (desktop + mobile).
      expect(screen.getAllByText("A-Ploeg").length).toBeGreaterThan(0);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("A-Ploeg");
      expect(row.textContent).toContain("·");
      expect(row.textContent).toContain("3e Provinciale A");
    });

    it("renders the caption label in jersey-deep on a normal row", () => {
      const { container } = render(
        <TeamAgendaRow match={BASE} captionLabel="A-Ploeg" />,
      );
      const label = container.querySelector("span.text-jersey-deep");
      expect(label).not.toBeNull();
      expect(label).toHaveTextContent("A-Ploeg");
    });

    it("renders the caption label alone when there is no competition", () => {
      render(
        <TeamAgendaRow
          match={{ ...BASE, competition: undefined }}
          captionLabel="U21"
        />,
      );
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("U21");
      expect(row.textContent).not.toContain("·");
    });

    it("renders only the competition when no caption label is given", () => {
      const { container } = render(<TeamAgendaRow match={BASE} />);
      expect(
        container.querySelector("span.text-jersey-deep"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "3e Provinciale A",
      );
    });
  });

  describe("Long team name", () => {
    it("sets title attribute on home team in desktop layout", () => {
      const { container } = render(
        <TeamAgendaRow
          match={{
            ...BASE,
            homeTeam: { id: 10, name: "KSV Schoonbeek-Beverst A" },
          }}
        />,
      );
      const el = container.querySelector('[title="KSV Schoonbeek-Beverst A"]');
      expect(el).not.toBeNull();
    });
  });

  describe("Symmetric scoreboard (#2397)", () => {
    // jsdom has no layout, so symmetry is asserted through the flex classes that
    // produce it; the VR stories carry the real pixel coverage. Both sides stay
    // `flex-1` (an even split) whoever is playing, so the score sits dead centre
    // and never drifts from one row to the next.
    const side = (container: HTMLElement, teamName: string) =>
      container.querySelector(`[title="${teamName}"]`)?.className;

    it.each([true, false, undefined])(
      "splits the row evenly with isHome=%s",
      (isHome) => {
        const { container } = render(
          <TeamAgendaRow match={{ ...BASE, isHome }} />,
        );
        expect(side(container, BASE.homeTeam.name)).toContain("flex-1");
        expect(side(container, BASE.awayTeam.name)).toContain("flex-1");
      },
    );
  });

  describe("Link to match detail", () => {
    it("wraps the row in a link to /wedstrijd/{id}", () => {
      render(<TeamAgendaRow match={{ ...BASE, id: 4242 }} />);
      expect(screen.getByRole("link").getAttribute("href")).toBe(
        "/wedstrijd/4242",
      );
    });

    it("uses the full home–away label as the link's accessible name", () => {
      render(<TeamAgendaRow match={BASE} />);
      const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
      // Lock the full accessible-name contract — both teams in home→away order,
      // a space-padded dash separator, plus the date suffix (see `matchLabel`
      // in TeamAgendaRow). The `[–—-]` class tolerates en-/em-dash or hyphen
      // without locking the exact glyph, but still fails on a format change.
      expect(label).toMatch(
        /^KCVV Elewijt [–—-] FC Opponent, 15 aug om 15:00$/,
      );
    });

    // #2404 — the label REPLACES the row's contents as its accessible name, so
    // a score missing from it is a score no screen-reader user ever hears. The
    // outcome leads it on any settled match, slot or no slot: the tint that
    // would otherwise carry it reaches no screen reader at all.
    it("spells the scoreline out beside each name, led by the outcome", () => {
      render(<TeamAgendaRow match={FINISHED_WIN} />);
      const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
      expect(label).toMatch(
        /^Winst: KCVV Elewijt 3 [–—-] FC Opponent 1, 15 aug$/,
      );
    });

    it("omits the kickoff from the name when the row shows an upcoming label", () => {
      render(<TeamAgendaRow match={BASE} upcomingLabel="Gepland" />);
      const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
      expect(label).not.toContain("om 15:00");
    });

    it("prefixes the kind word when a slot is given", () => {
      render(<TeamAgendaRow match={FINISHED_WIN} kind="result" />);
      const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
      expect(label).toMatch(/^Winst: KCVV Elewijt 3 /);
    });

    /**
     * The label REPLACES the row's contents, so the status marker rendered in
     * the visible caption never reaches a screen reader on its own. Announcing
     * a kickoff for a match that is off is the #2423 failure in audio.
     */
    it.each([
      ["postponed", "Uitgesteld"],
      ["cancelled", "Geannuleerd"],
    ] as const)(
      "names a %s match and asserts no kickoff",
      (status, longForm) => {
        render(<TeamAgendaRow match={{ ...BASE, status }} />);
        const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
        expect(label).toContain(longForm);
        expect(label).not.toContain("om 15:00");
      },
    );

    it("names a forfeit rather than announcing it as a plain win", () => {
      render(
        <TeamAgendaRow
          match={{ ...FINISHED_WIN, status: "forfeited" }}
          kind="result"
        />,
      );
      const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
      expect(label).toContain("Forfait");
    });
  });

  // #2404 — cream-vs-green and left-vs-right were the only carriers of
  // "this is a result" / "this is the next fixture".
  describe("Kind word", () => {
    describe("when the surface names its rows (kind given)", () => {
      it.each([
        [FINISHED_WIN, "Winst"],
        [FINISHED_DRAW, "Gelijk"],
        [FINISHED_LOSS, "Verlies"],
      ] as const)("names the outcome on both layouts: %#", (match, word) => {
        render(<TeamAgendaRow match={match} kind="result" />);
        expect(desktopText()).toContain(word);
        expect(mobileText()).toContain(word);
      });

      it("reads 'Volgende' in the fixture slot", () => {
        render(<TeamAgendaRow match={BASE} kind="fixture" />);
        expect(desktopText()).toContain("Volgende");
      });

      /**
       * The regression this prop exists for. `pickLastResult` hands the result
       * column a match whose kickoff has passed while PSD still says
       * `scheduled` — deriving the word from status labelled it "Volgende", the
       * same word as the fixture card beside it.
       */
      it("says 'Uitslag', not 'Volgende', for a scheduled match in the result slot", () => {
        render(<TeamAgendaRow match={BASE} kind="result" />);
        expect(desktopText()).toContain("Uitslag");
        expect(desktopText()).not.toContain("Volgende");
      });

      it("still names the winner of a forfeit, alongside the FF marker", () => {
        render(
          <TeamAgendaRow
            match={{ ...FINISHED_WIN, status: "forfeited" }}
            kind="result"
          />,
        );
        expect(desktopText()).toContain("Winst");
        expect(desktopText()).toContain("FF");
      });

      it.each(["postponed", "cancelled", "stopped"] as const)(
        "defers to the %s status marker rather than adding a slot word",
        (status) => {
          render(<TeamAgendaRow match={{ ...BASE, status }} kind="fixture" />);
          expect(desktopText()).not.toContain("Volgende");
          expect(desktopText()).not.toContain("Uitslag");
        },
      );
    });

    /**
     * The desktop scoreboard prints both clubs either side of the score, so
     * "K Lyra-Lierse 4 – 0 KCVV Elewijt" already says who lost and the word
     * would restate the row — down a season of results, as a column of the same
     * word. The mobile column shows the opponent alone, so the same scoreline
     * needs it.
     */
    describe("when the surface does not (kind omitted)", () => {
      it.each([
        [FINISHED_WIN, "Winst"],
        [FINISHED_DRAW, "Gelijk"],
        [FINISHED_LOSS, "Verlies"],
      ] as const)("names the outcome on mobile only: %#", (match, word) => {
        render(<TeamAgendaRow match={match} />);
        expect(mobileText()).toContain(word);
        expect(desktopText()).not.toContain(word);
      });

      it("leaves the desktop caption on the competition alone", () => {
        render(<TeamAgendaRow match={FINISHED_WIN} />);
        expect(desktopText()).toContain("3e Provinciale A");
        expect(desktopText()).not.toContain("Uitslag");
      });

      it("adds no slot word to an unsettled match on either layout", () => {
        render(<TeamAgendaRow match={BASE} />);
        for (const text of [desktopText(), mobileText()]) {
          expect(text).not.toContain("Volgende");
          expect(text).not.toContain("Uitslag");
        }
      });

      // Regression (#2656 review): `OUTCOME_WORD.draw` shortened to "Gelijk"
      // only to fit `<MatchStripView>`'s `w-14` mobile-ledger stub — this
      // row's own caption is not column-constrained the way that stub is
      // (#2512 accepted "Gelijk" here anyway, for consistency), but its
      // `aria-label` has no column at all, so the full word belongs there.
      it("keeps 'Gelijkspel' — not the caption's shortened 'Gelijk' — in a drawn row's accessible name", () => {
        render(<TeamAgendaRow match={FINISHED_DRAW} />);
        const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
        expect(label).toMatch(/\bGelijkspel\b/);
        expect(label).not.toMatch(/\bGelijk\b/);
      });
    });
  });

  describe("Team designation (team_label)", () => {
    it("renders the opponent's team designation suffix", () => {
      render(<TeamAgendaRow match={LONG_AWAY} />);
      // Appears once per layout (desktop away + mobile opponent column).
      const labels = screen.getAllByText("U23");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("does not render a suffix when teamLabel is absent", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.queryByText("U23")).toBeNull();
    });

    // #2405 — truncation priority. jsdom has no layout, so it is asserted
    // structurally: the suffix lives INSIDE the truncating box, which is what
    // makes the ellipsis reach it before the club name. The old markup pinned
    // it outside as a `shrink-0` sibling, so the club name absorbed the whole
    // cost ("Yellow Red KV Mech… U23"). VR carries the pixel coverage.
    it("nests the suffix inside the truncating box, with a space before it", () => {
      render(<TeamAgendaRow match={LONG_AWAY} />);
      for (const suffix of screen.getAllByText("U23")) {
        expect(suffix.parentElement?.className).toContain("truncate");
        // The space has to survive into textContent, not just be a margin, or
        // the row reads as "MechelenU23".
        expect(suffix.parentElement?.textContent).toContain(
          `${LONG_AWAY.awayTeam.name} U23`,
        );
      }
    });
  });

  describe("onNavigate", () => {
    it("fires onNavigate when the row is clicked through", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<TeamAgendaRow match={BASE} onNavigate={onNavigate} />);
      await user.click(screen.getByTestId("team-agenda-row"));
      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Placeholder fixture (#2606) — both sides are the same club, a
   * pitch-reservation the club enters when a team has something on the
   * calendar but the opponent and programme aren't settled yet. Unlike the
   * normal row, this state is ONE DOM tree at every viewport (no
   * `data-layout` split — its two breakpoints differ only in a font size
   * and a spacer), scoped for these tests via `[data-row-kind="reservation"]`.
   */
  describe("Placeholder fixture (#2606)", () => {
    const placeholderRow = () =>
      document.querySelector('[data-row-kind="reservation"]') as HTMLElement;

    it("marks itself with data-row-kind=reservation — a normal row never carries the attribute", () => {
      const { container: withPlaceholder } = render(
        <TeamAgendaRow match={PLACEHOLDER} />,
      );
      expect(
        withPlaceholder.querySelector('[data-row-kind="reservation"]'),
      ).not.toBeNull();

      const { container: normal } = render(<TeamAgendaRow match={BASE} />);
      expect(normal.querySelector("[data-row-kind]")).toBeNull();
    });

    it("keeps the date stub", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      expect(screen.getByLabelText("9 mei")).toBeInTheDocument();
    });

    it("keeps the real kickoff time — never 'hele dag'", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      expect(placeholderRow().textContent).toContain("09:30");
    });

    it("renders the competition label verbatim in the mono-uppercase caption register (casing gotcha)", () => {
      // PSD sends this competition name lowercase; the fix must lean on the
      // caption's CSS uppercase transform rather than normalising the string.
      render(
        <TeamAgendaRow
          match={{ ...PLACEHOLDER, competition: "vriendschappelijk" }}
        />,
      );
      const subjects = Array.from(
        placeholderRow().querySelectorAll(".font-mono.uppercase"),
      ).filter((el) => el.textContent === "vriendschappelijk");
      expect(subjects.length).toBeGreaterThan(0);
    });

    it("renders exactly one crest", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      expect(
        placeholderRow().querySelectorAll('img, span[aria-hidden="true"]')
          .length,
      ).toBe(1);
    });

    it("sheds the home/away venue icon", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      expect(screen.queryByLabelText("Thuiswedstrijd")).toBeNull();
      expect(screen.queryByLabelText("Uitwedstrijd")).toBeNull();
    });

    it("sheds the score slot AND its outcome tint even for a 'finished' status", () => {
      // A win/draw/loss underline is a claim about a score. A placeholder has
      // no opponent to have won or lost against — `ScheduleReservation`
      // carries no `homeScore`/`awayScore` at all (#2688), so this only needs
      // to confirm a status that would otherwise trigger the outcome tint
      // still renders neither a scoreline nor a box-shadow.
      const { container } = render(
        <TeamAgendaRow match={{ ...PLACEHOLDER, status: "finished" }} />,
      );
      expect(placeholderRow().textContent).not.toMatch(/0\s*[–—-]\s*0/);
      expect(container.querySelectorAll("[style*='box-shadow']").length).toBe(
        0,
      );
    });

    it("is not a link — no <Link> wrapper", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      expect(screen.queryByRole("link")).toBeNull();
    });

    it("never fires onNavigate — a reservation has no match detail to click through to", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<TeamAgendaRow match={PLACEHOLDER} onNavigate={onNavigate} />);
      await user.click(screen.getByTestId("team-agenda-row"));
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("gives the row its own accessible label naming the subject, not both teams", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      const label = placeholderRow().getAttribute("aria-label");
      expect(label).toBe("Tornooi, 9 mei om 09:30");
      expect(label).not.toContain("KCVV Elewijt");
    });

    it("hides its visible content from assistive tech so aria-label is the row's sole spoken content, not a duplicate", () => {
      // Unlike the normal row's <Link aria-label>, which replaces the
      // accessible name for an atomic interactive element, an <article>
      // does not suppress its own children — they stay separately walkable
      // in linear/browse mode. Content is hidden explicitly instead.
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      const row = placeholderRow();
      expect(row.getAttribute("aria-label")).not.toBeNull();
      expect(row.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(row.textContent).toContain("Tornooi");
    });

    it("never announces a reason for the missing opponent", () => {
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      expect(placeholderRow().textContent).not.toMatch(/tegenstander/i);
    });

    it("falls back to a generic subject when the competition label is absent — reachable both visibly and in the accessible label", () => {
      render(
        <TeamAgendaRow match={{ ...PLACEHOLDER, competition: undefined }} />,
      );
      const row = placeholderRow();
      expect(row.textContent).toContain("Gereserveerd");
      expect(row.getAttribute("aria-label")).toContain("Gereserveerd");
    });

    /**
     * The branch must not silently drop props other host surfaces rely on.
     * `<TeamAgendaRow>` is shared by the homepage (`kind`, `onNavigate`) and
     * `/tegenstander` (`captionLabel`, `upcomingLabel`), neither of which is
     * in #2632's build scope, but both of which render this same component
     * today.
     */
    describe("Honours host-surface props on a placeholder row", () => {
      it("prefixes the homepage's kind word onto the subject, visibly and in the label", () => {
        render(<TeamAgendaRow match={PLACEHOLDER} kind="fixture" />);
        const row = placeholderRow();
        expect(row.textContent).toContain("Volgende");
        expect(row.getAttribute("aria-label")).toContain("Volgende");
      });

      it("prints the opponent-history page's squad captionLabel, visibly and in the label", () => {
        render(<TeamAgendaRow match={PLACEHOLDER} captionLabel="A-Ploeg" />);
        const row = placeholderRow();
        expect(row.textContent).toContain("A-Ploeg");
        expect(row.textContent).toContain("Tornooi");
        // Two reservations on the same /tegenstander page (mixing A-Ploeg,
        // B-Ploeg, youth against one opponent) are otherwise indistinguishable
        // to a screen reader — neither carries a real opponent name to tell
        // them apart.
        const label = row.getAttribute("aria-label");
        expect(label).toContain("A-Ploeg");
        expect(label).toContain("Tornooi");
      });

      it("shows upcomingLabel instead of the precise kickoff, at its own size — never the display face's", () => {
        render(<TeamAgendaRow match={PLACEHOLDER} upcomingLabel="Gepland" />);
        const row = placeholderRow();
        expect(row.textContent).toContain("Gepland");
        expect(row.textContent).not.toContain("09:30");
        // Regression: a size class appended AFTER the mono/11px recipe (via a
        // second `cn()` call) once silently overrode it via `twMerge`'s
        // "last wins" rule, rendering "GEPLAND" at the display face's 18px.
        const timeSpan = Array.from(row.querySelectorAll("span")).find(
          (el) => el.textContent === "Gepland",
        );
        expect(timeSpan?.className).toContain("text-[11px]");
        expect(timeSpan?.className).not.toMatch(/text-\[1[68]px\]/);
      });
    });

    it("does not add font-semibold at the caption-wrapper level — identical weight to the normal row's caption", () => {
      // Regression: the subject span once carried its own `font-semibold` on
      // top of `buildCaption`'s per-segment emphasis, rendering a placeholder
      // row's caption bolder than the same content on a normal row.
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      const subjectSpan = placeholderRow().querySelector("span.truncate");
      expect(subjectSpan?.className.split(/\s+/)).not.toContain(
        "font-semibold",
      );
    });

    it("keeps the kickoff in the same centred slot an ordinary desktop row uses (#2397)", () => {
      // Asserted structurally: a trailing flex-1 spacer balances the leading
      // crest+subject flex-1, mirroring the normal row's [home][score][away]
      // triple. jsdom has no layout; VR carries the pixel coverage.
      render(<TeamAgendaRow match={PLACEHOLDER} />);
      const contentRow = contentBox(placeholderRow());
      const flexOneChildren = Array.from(contentRow?.children ?? []).filter(
        (el) => el.className.split(/\s+/).includes("flex-1"),
      );
      expect(flexOneChildren.length).toBe(2);
    });

    describe("Exceptional status", () => {
      it.each([
        ["postponed", "PP", "Uitgesteld"],
        ["cancelled", "CANC", "Geannuleerd"],
        ["forfeited", "FF", "Forfait"],
        ["stopped", "STOP", "Gestopt"],
      ] as const)(
        "marks a %s placeholder with the <MatchStatusBadge> short form",
        (status, abbreviation, longForm) => {
          render(<TeamAgendaRow match={{ ...PLACEHOLDER, status }} />);
          const marker = screen.getByText(abbreviation);
          expect(marker.tagName).toBe("ABBR");
          expect(marker.getAttribute("title")).toBe(longForm);
        },
      );

      it("drops 'om <kickoff>' from the accessible label for a cancelled placeholder", () => {
        render(
          <TeamAgendaRow match={{ ...PLACEHOLDER, status: "cancelled" }} />,
        );
        const label = placeholderRow().getAttribute("aria-label");
        expect(label).not.toContain("om 09:30");
        expect(label).toContain("Geannuleerd");
      });
    });

    it("truncates a long subject instead of wrapping", () => {
      render(
        <TeamAgendaRow
          match={{
            ...PLACEHOLDER,
            competition: "Beker van Vlaams-Brabant",
          }}
        />,
      );
      const subjects = placeholderRow().querySelectorAll(
        'span[class*="truncate"]',
      );
      expect(subjects.length).toBe(1);
      expect(subjects[0]?.textContent).toBe("Beker van Vlaams-Brabant");
    });
  });

  /**
   * Tournament fixture (#2696) — a genuine fixture (not a self-match) whose
   * structured `competitionType` is `"tournament"` (#2692). Reuses the
   * placeholder register's shape (#2606/#2632) rather than a third layout:
   * one crest, one mono subject, the real start time, no link. Unlike a
   * placeholder the crest is the OPPONENT's — the named club is presented as
   * where the tournament is, not who KCVV plays, because PSD does not say
   * which. #2693 (design decision) ruled the two rows' shared layout is
   * accepted as sufficient distinctness: different crest, a club in the
   * subject, and a different detector — no further visual difference is to
   * be invented here.
   */
  describe("Tournament fixture (#2696)", () => {
    const tournamentRow = () =>
      document.querySelector('[data-row-kind="reduced"]') as HTMLElement;

    it("marks itself with data-row-kind=reduced — a normal row never carries the attribute", () => {
      const { container: withTournament } = render(
        <TeamAgendaRow match={TOURNAMENT} />,
      );
      expect(
        withTournament.querySelector('[data-row-kind="reduced"]'),
      ).not.toBeNull();

      const { container: normal } = render(<TeamAgendaRow match={BASE} />);
      expect(normal.querySelector("[data-row-kind]")).toBeNull();
    });

    it("gates on the structured competitionType, never on the Dutch competition label", () => {
      // The Dutch word "Tornooi" alone must not trigger the reduced row —
      // proves the detector isn't string-matching `competition`.
      const { container: leagueWithTornooiLabel } = render(
        <TeamAgendaRow
          match={{ ...BASE, competition: "Tornooi", competitionType: "league" }}
        />,
      );
      expect(
        leagueWithTornooiLabel.querySelector('[data-row-kind="reduced"]'),
      ).toBeNull();
      // It's the ordinary two-team row — both layouts render in jsdom (no
      // CSS breakpoints), so home+away show on desktop and the opponent
      // again on mobile: 3 crests, not the reduced row's 1.
      expect(
        leagueWithTornooiLabel.querySelectorAll('img, span[aria-hidden="true"]')
          .length,
      ).toBe(3);

      // A different competition string entirely still triggers the reduced
      // row as long as competitionType says tournament.
      const { container: tournamentWithOtherLabel } = render(
        <TeamAgendaRow
          match={{ ...TOURNAMENT, competition: "Zomertornooi Mechelen" }}
        />,
      );
      expect(
        tournamentWithOtherLabel.querySelector('[data-row-kind="reduced"]'),
      ).not.toBeNull();
    });

    it("renders exactly one crest, no home/away icon, no score slot", () => {
      render(<TeamAgendaRow match={TOURNAMENT} />);
      const row = tournamentRow();
      expect(row.querySelectorAll('img, span[aria-hidden="true"]').length).toBe(
        1,
      );
      expect(screen.queryByLabelText("Thuiswedstrijd")).toBeNull();
      expect(screen.queryByLabelText("Uitwedstrijd")).toBeNull();
    });

    it("is not a link and never fires onNavigate", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<TeamAgendaRow match={TOURNAMENT} onNavigate={onNavigate} />);
      expect(screen.queryByRole("link")).toBeNull();
      await user.click(tournamentRow());
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("shows the crest of the named club, not KCVV's", () => {
      // `TOURNAMENT.team` is already the resolved non-KCVV side — the
      // home/away-vs-club-id derivation this test used to exercise at the
      // render layer happens once now, in the adapter
      // (`transformMatchToSchedule`'s `otherClub()`), not per-renderer: the
      // row only ever sees the already-resolved crest, so it can no longer
      // get the side wrong. See `transform.test.ts` for the derivation
      // itself, exercised both ways (#2802).
      const { container } = render(<TeamAgendaRow match={TOURNAMENT} />);
      expect(
        container.querySelector('img[src="https://example.com/zemst.png"]'),
      ).not.toBeNull();
    });

    it("names the competition then the club, with no slot word — even featured", () => {
      render(<TeamAgendaRow match={TOURNAMENT} featured kind="fixture" />);
      const row = tournamentRow();
      expect(row.textContent).toContain("Tornooi");
      expect(row.textContent).toContain("FC Zemst Sportief");
      expect(row.textContent).not.toContain("Volgende");
      // Competition before the club, joined by the caption's separator.
      expect(row.textContent).toMatch(/Tornooi\s*·\s*FC Zemst Sportief/);
    });

    it("keeps the real start time — never a kickoff label", () => {
      render(<TeamAgendaRow match={TOURNAMENT} />);
      expect(tournamentRow().textContent).toContain("09:30");
    });

    it("gives the row its own accessible label naming the subject and time, asserting no opponent", () => {
      render(<TeamAgendaRow match={TOURNAMENT} />);
      const label = tournamentRow().getAttribute("aria-label");
      expect(label).toBe("Tornooi · FC Zemst Sportief, 30 aug om 09:30");
      expect(label).not.toContain("KCVV Elewijt");
    });

    it("drops the slot word from the accessible label too, even when kind is given", () => {
      render(<TeamAgendaRow match={TOURNAMENT} kind="fixture" />);
      const label = tournamentRow().getAttribute("aria-label");
      expect(label).not.toContain("Volgende");
    });

    it("honours the opponent-history page's squad captionLabel ahead of the subject", () => {
      render(<TeamAgendaRow match={TOURNAMENT} captionLabel="A-Ploeg" />);
      const row = tournamentRow();
      expect(row.textContent).toContain("A-Ploeg");
      expect(row.textContent).toMatch(
        /A-Ploeg\s*·\s*Tornooi\s*·\s*FC Zemst Sportief/,
      );
    });

    it("may be the featured 'Eerstvolgende' card", () => {
      render(<TeamAgendaRow match={TOURNAMENT} featured />);
      expect(tournamentRow().getAttribute("data-featured")).toBe("true");
    });

    /**
     * A played tournament match is no longer the "not yet confirmed" case
     * this reduced state exists for — the club really was the opponent, so
     * the row reverts to the full linked scoreboard: two crests, the
     * scoreline, its outcome tint, and a link to the match detail (#2696
     * review).
     */
    it("reverts to the full scoreboard once played — score, outcome tint, and a link", () => {
      // The same underlying fixture as `TOURNAMENT`, but shaped the way
      // `transformMatchToSchedule` would emit it once PSD reports a
      // scoreline: `kind: "match"`, with `homeTeam`/`awayTeam` restored —
      // not a mutation of `TOURNAMENT` itself, which as `kind: "reduced"`
      // no longer carries those fields to spread (#2802).
      const played: ScheduleMatch = {
        isPlaceholder: false,
        kind: "match",
        id: TOURNAMENT.id,
        date: TOURNAMENT.date,
        time: TOURNAMENT.time,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: TOURNAMENT.team,
        status: "finished",
        competition: TOURNAMENT.competition,
        competitionType: TOURNAMENT.competitionType,
        homeScore: 3,
        awayScore: 1,
        isHome: true,
      };
      const { container } = render(<TeamAgendaRow match={played} />);

      expect(container.querySelector("[data-row-kind]")).toBeNull();
      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(screen.getByTestId("team-agenda-row").textContent).toContain("3");
      expect(screen.getByTestId("team-agenda-row").textContent).toContain("1");
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("jersey-deep");
    });
  });

  /**
   * The min-w-0 defect (#2696) — see the comment on the content box in
   * `TeamAgendaRow.tsx`. Both reduced registers share the exact same box, so
   * one parameterised test locks the fix for both rather than two
   * byte-identical assertions in two describes.
   */
  describe.each([
    ["placeholder", PLACEHOLDER],
    ["tournament", TOURNAMENT],
  ] as const)("Reduced row content box (#2696) — %s", (_label, match) => {
    it("carries min-w-0 so its truncating child can shrink", () => {
      render(<TeamAgendaRow match={match} />);
      const row = screen.getByTestId("team-agenda-row");
      expect(contentBox(row)?.className.split(/\s+/)).toContain("min-w-0");
    });
  });
});
