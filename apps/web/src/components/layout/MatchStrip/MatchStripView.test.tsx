import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MatchStripView } from "./MatchStripView";
import { KCVV_CLUB_ID } from "@/lib/constants";
import type {
  ScheduleMatch,
  ScheduleReducedMatch,
  ScheduleReservation,
} from "@/components/match/types";

const OPPONENT = { id: 9999, name: "RC Mechelen", logo: "https://psd/rc.png" };

const result: ScheduleMatch = {
  isPlaceholder: false,
  kind: "match",
  id: 42,
  date: new Date("2026-08-03T15:00:00Z"),
  status: "finished",
  competition: "Tweede Provinciale A",
  homeTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  awayTeam: OPPONENT,
  homeScore: 3,
  awayScore: 1,
  isHome: true,
};

const fixture: ScheduleMatch = {
  isPlaceholder: false,
  kind: "match",
  id: 43,
  date: new Date("2026-08-08T18:00:00Z"),
  time: "18:00",
  status: "scheduled",
  competition: "Beker van Vlaanderen",
  homeTeam: OPPONENT,
  awayTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  isHome: false,
};

describe("MatchStripView", () => {
  it("renders both matches as links to their own match-detail route", () => {
    render(<MatchStripView data={{ result, fixture }} />);
    // `result` is a settled win, so the row's lead word is the outcome
    // ("Winst"), not the plain slot word — see the "names a settled
    // result's outcome, matching the visible stub" describe block below.
    expect(screen.getByRole("link", { name: /^Winst/ })).toHaveAttribute(
      "href",
      "/wedstrijd/42",
    );
    expect(
      screen.getByRole("link", { name: /^Volgende wedstrijd/ }),
    ).toHaveAttribute("href", "/wedstrijd/43");
  });

  it("names the opponent, not KCVV, in each row's accessible name", () => {
    render(<MatchStripView data={{ result, fixture }} />);
    expect(
      screen.getByRole("link", { name: /Winst.*RC Mechelen/ }),
    ).toBeInTheDocument();
  });

  it("spells the score into the result row's accessible name", () => {
    // The aria-label replaces the row's contents as its accessible name, so a
    // screen-reader user hears only what is in the label.
    render(<MatchStripView data={{ result, fixture }} />);
    expect(
      screen.getByRole("link", { name: /KCVV Elewijt 3 - RC Mechelen 1/ }),
    ).toBeInTheDocument();
  });

  it("states KCVV's goals first in the label even when KCVV played away", () => {
    const awayLoss: ScheduleMatch = {
      ...result,
      homeTeam: OPPONENT,
      awayTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
      homeScore: 2,
      awayScore: 0,
      isHome: false,
    };
    render(<MatchStripView data={{ result: awayLoss, fixture: null }} />);
    expect(
      screen.getByRole("link", { name: /KCVV Elewijt 0 - RC Mechelen 2/ }),
    ).toBeInTheDocument();
  });

  it("renders the score in true scoreboard order, home side first", () => {
    render(<MatchStripView data={{ result, fixture }} />);
    // KCVV played at home and won 3-1, so the scoreboard reads 3–1.
    expect(screen.getAllByText("3–1").length).toBeGreaterThan(0);
  });

  it("keeps scoreboard order when KCVV played away", () => {
    const awayLoss: ScheduleMatch = {
      ...result,
      homeTeam: OPPONENT,
      awayTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
      homeScore: 2,
      awayScore: 0,
      isHome: false,
    };
    render(<MatchStripView data={{ result: awayLoss, fixture: null }} />);
    expect(screen.getAllByText("2–0").length).toBeGreaterThan(0);
  });

  it("derives the KCVV side from the club id when isHome is absent", () => {
    // Regression: `isHome ?? undefined` used to take the falsy branch and
    // render KCVV as its own opponent.
    const { isHome: _omitted, ...withoutIsHome } = result;
    render(<MatchStripView data={{ result: withoutIsHome, fixture: null }} />);
    const row = screen.getByRole("link", { name: /^Winst/ });
    // KCVV is the home side by club id, so the opponent must be the away team
    // and the label must read KCVV 3 - RC Mechelen 1, not KCVV against itself.
    expect(row).toHaveAccessibleName(/KCVV Elewijt 3 - RC Mechelen 1/);
  });

  it("labels the result slide correctly when the fixture disappears", () => {
    // The switch starts on the result. Move it to the fixture, then re-render
    // without one: the fallback must still render as the result slide rather
    // than showing the result's teams under a "Volgende" label with `vs.`.
    const { rerender } = render(<MatchStripView data={{ result, fixture }} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Toon de volgende wedstrijd" }),
    );
    rerender(<MatchStripView data={{ result, fixture: null }} />);

    expect(screen.queryByText("vs.")).toBeNull();
    expect(
      screen.getByRole("link", { name: /Wedstrijddetails/i }),
    ).toHaveAttribute("href", "/wedstrijd/42");
  });

  it("marks a home match with the house glyph and an away match with the bus", () => {
    render(<MatchStripView data={{ result, fixture }} />);
    const resultRow = screen.getByRole("link", { name: /^Winst/ });
    const fixtureRow = screen.getByRole("link", { name: /^Volgende/ });
    expect(
      within(resultRow).getByLabelText("Thuiswedstrijd"),
    ).toBeInTheDocument();
    expect(
      within(fixtureRow).getByLabelText("Uitwedstrijd"),
    ).toBeInTheDocument();
  });

  // `toHaveStyle` with an asymmetric matcher does not actually compare, so
  // these read the inline style attribute the component writes.
  it("marks a win with the outcome sweep", () => {
    render(<MatchStripView data={{ result, fixture: null }} />);
    const score = screen.getAllByText("3–1")[0];
    expect(score?.getAttribute("style") ?? "").toContain("inset");
  });

  it("marks a draw with its own ink-muted outcome sweep (#2512/#2656)", () => {
    const draw: ScheduleMatch = { ...result, homeScore: 2, awayScore: 2 };
    render(<MatchStripView data={{ result: draw, fixture: null }} />);
    const score = screen.getAllByText("2–2")[0];
    expect(score?.getAttribute("style") ?? "").toContain("ink-muted");
  });

  it("shows 'Gelijk' in the visible ledger stub but keeps 'Gelijkspel' in the accessible name (#2656 review)", () => {
    // Same split as `<TeamAgendaRow>`: `OUTCOME_WORD.draw` ("Gelijk") is
    // shortened only to fit this row's `w-14` date/word stub — the
    // `aria-label` has no such column, so it reads `OUTCOME_WORD_FULL.draw`
    // ("Gelijkspel") instead.
    const draw: ScheduleMatch = { ...result, homeScore: 2, awayScore: 2 };
    render(<MatchStripView data={{ result: draw, fixture: null }} />);
    const row = screen.getByRole("link", { name: /Gelijkspel/ });
    expect(within(row).getByText("Gelijk")).toBeInTheDocument();
    expect(within(row).queryByText("Gelijkspel")).toBeNull();
  });

  it("renders the fixture alone when there is no result", () => {
    render(<MatchStripView data={{ result: null, fixture }} />);
    expect(screen.queryByRole("link", { name: /^Uitslag/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: /^Volgende wedstrijd/ }),
    ).toBeInTheDocument();
  });

  it("renders the result alone when there is no fixture", () => {
    render(<MatchStripView data={{ result, fixture: null }} />);
    expect(screen.getByRole("link", { name: /^Winst/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Volgende/ })).toBeNull();
  });

  it("renders real PSD logos when provided", () => {
    const { container } = render(
      <MatchStripView data={{ result, fixture: null }} />,
    );
    const srcs = Array.from(container.querySelectorAll("img")).map((i) =>
      i.getAttribute("src"),
    );
    expect(srcs).toContain("https://psd/rc.png");
  });

  it("falls back to an initial badge when the opponent has no logo", () => {
    const noLogo: ScheduleMatch = {
      ...result,
      awayTeam: { id: 9999, name: "VK De Volharding" },
    };
    render(<MatchStripView data={{ result: noLogo, fixture: null }} />);
    expect(screen.getAllByText("V").length).toBeGreaterThan(0);
  });

  it("exposes the desktop CTA to the match currently on the slide", () => {
    render(<MatchStripView data={{ result, fixture }} />);
    expect(
      screen.getByRole("link", { name: /Wedstrijddetails/i }),
    ).toHaveAttribute("href", "/wedstrijd/42");
  });

  // #2390 — `pickLastResult` now routes a kicked-off, not-yet-scored match to
  // the result side, so the strip must render a result that has no scoreline.
  // The desktop slider defaults to that slide, so returning nothing left an
  // empty gap between the crests for the hours after every kickoff.
  describe("result awaiting its score (#2390)", () => {
    const awaiting: ScheduleMatch = {
      ...result,
      time: "19:30",
      status: "scheduled",
      homeScore: undefined,
      awayScore: undefined,
    };

    it("shows the kickoff time in place of the missing scoreline", () => {
      render(<MatchStripView data={{ result: awaiting, fixture: null }} />);
      // Both layouts render, so the time appears on the mobile row and the
      // desktop slide alike — neither may be blank.
      expect(screen.getAllByText("19:30")).toHaveLength(2);
    });

    it("invents no scoreline, in the row's accessible name either", () => {
      render(<MatchStripView data={{ result: awaiting, fixture: null }} />);
      expect(screen.queryByText(/\d+\s*–\s*\d+/)).toBeNull();
      expect(
        screen.getByRole("link", {
          name: /Uitslag.*KCVV Elewijt tegen RC Mechelen/,
        }),
      ).toBeInTheDocument();
    });

    it("falls back to vs. when the feed carries neither score nor time", () => {
      render(
        <MatchStripView
          data={{ result: { ...awaiting, time: undefined }, fixture: null }}
        />,
      );
      expect(screen.getAllByText("vs.").length).toBeGreaterThan(0);
    });
  });

  describe("pitch-reservation placeholder (#2606, #2688)", () => {
    const reservation: ScheduleReservation = {
      isPlaceholder: true,
      kind: "reservation",
      id: 90,
      date: new Date("2026-05-09T09:30:00Z"),
      time: "09:30",
      team: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
      status: "scheduled",
      competition: "Tornooi",
    };

    it("renders the reservation as a mobile ledger row that is not a link — no <Link> wrapper (#2606 decision 5)", () => {
      render(<MatchStripView data={{ result: null, fixture: reservation }} />);
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText("Tornooi")).toBeInTheDocument();
    });

    it("gives the mobile ledger row a real accessible name via <article> — a bare <div> ignores aria-label entirely", () => {
      render(<MatchStripView data={{ result: null, fixture: reservation }} />);
      const article = screen.getByRole("article", { name: /Tornooi/ });
      expect(article).toBeInTheDocument();
      expect(article.tagName).toBe("ARTICLE");
      // The one marker every reservation renderer carries (#2688) — lets a
      // consumer (or a future test) find this row without depending on the
      // element type or the accessible name.
      expect(article).toHaveAttribute("data-row-kind", "reservation");
    });

    it("prints the club crest, never the opponent's — a reservation has no opponent", () => {
      render(<MatchStripView data={{ result: null, fixture: reservation }} />);
      // scoreboardScore/opponentOf would throw a type error at compile time if
      // ever called on a reservation — this asserts the runtime consequence:
      // no "KCVV Elewijt" opponent text renders a second time.
      expect(screen.getAllByText("KCVV Elewijt")).toHaveLength(1);
    });

    it("shows the real kickoff time, never a score slot", () => {
      render(<MatchStripView data={{ result: null, fixture: reservation }} />);
      expect(screen.getAllByText("09:30").length).toBeGreaterThan(0);
      expect(screen.queryByText(/\d+\s*–\s*\d+/)).toBeNull();
    });

    it("sheds the home/away venue glyph — a reservation has no side to name", () => {
      render(<MatchStripView data={{ result: null, fixture: reservation }} />);
      expect(screen.queryByLabelText("Thuiswedstrijd")).toBeNull();
      expect(screen.queryByLabelText("Uitwedstrijd")).toBeNull();
    });

    it("never speaks result vocabulary, even handed a reservation in the result slot", () => {
      render(<MatchStripView data={{ result: reservation, fixture: null }} />);
      // The strip's own slot heading says "Uitslag" — that is chrome and stays.
      // What must never happen is the reservation row claiming that word: its
      // aria-label is its sole accessible content, and a booking has no result.
      expect(screen.queryByRole("article", { name: /Uitslag/i })).toBeNull();
      expect(
        screen.getByRole("article", { name: /Tornooi/ }),
      ).toBeInTheDocument();
    });

    it("falls back to RESERVATION_SUBJECT_FALLBACK when no competition label is sent", () => {
      render(
        <MatchStripView
          data={{
            result: null,
            fixture: { ...reservation, competition: undefined },
          }}
        />,
      );
      expect(screen.getByText("Gereserveerd")).toBeInTheDocument();
    });

    it("desktop slide: no second crest, no Wedstrijddetails CTA (mirrors #2606 decision 5)", () => {
      render(<MatchStripView data={{ result: null, fixture: reservation }} />);
      expect(
        screen.queryByRole("link", { name: /Wedstrijddetails/i }),
      ).toBeNull();
    });

    it("still lets the switch move between a real result and a reservation fixture", () => {
      render(<MatchStripView data={{ result, fixture: reservation }} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Toon de volgende wedstrijd" }),
      );
      expect(screen.getAllByText("Tornooi").length).toBeGreaterThan(0);
    });

    it("keeps the desktop slide's aria-live region across the switch to a reservation — the region itself must not be unmounted", () => {
      const { container } = render(
        <MatchStripView data={{ result, fixture: reservation }} />,
      );
      expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(
        1,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Toon de volgende wedstrijd" }),
      );
      // A live region inserted together with its content is not announced —
      // hanging aria-live on only the normal branch's own wrapper would drop
      // it from the DOM entirely once the reservation slide replaces it.
      expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(
        1,
      );
    });
  });

  // #2696/#2802 — the gap this ticket closes: `<MatchStripView>` never
  // called `isReducedMatchRow`, so a not-yet-played tournament fixture
  // rendered the ordinary linked two-crest scoreboard against a club PSD
  // hasn't confirmed as a genuine opponent.
  describe("tournament fixture with no result yet (#2696/#2802)", () => {
    const tournament: ScheduleReducedMatch = {
      isPlaceholder: false,
      kind: "reduced",
      id: 91,
      date: new Date("2026-08-30T09:30:00Z"),
      time: "09:30",
      team: { id: 1391, name: "FC Zemst Sportief" },
      status: "scheduled",
      competition: "Tornooi",
      competitionType: "tournament",
    };

    it("renders the mobile ledger row as reduced — no <Link>, names the other club", () => {
      render(<MatchStripView data={{ result: null, fixture: tournament }} />);
      expect(screen.queryByRole("link")).toBeNull();
      expect(
        screen.getByText("Tornooi · FC Zemst Sportief"),
      ).toBeInTheDocument();
    });

    it("marks the row data-row-kind=reduced, not reservation", () => {
      render(<MatchStripView data={{ result: null, fixture: tournament }} />);
      const article = screen.getByRole("article", { name: /Tornooi/ });
      expect(article).toHaveAttribute("data-row-kind", "reduced");
      expect(article).not.toHaveAttribute("data-row-kind", "reservation");
    });

    it("desktop slide: no CTA, no second crest", () => {
      render(<MatchStripView data={{ result: null, fixture: tournament }} />);
      expect(
        screen.queryByRole("link", { name: /Wedstrijddetails/i }),
      ).toBeNull();
      expect(screen.queryByText("RC Mechelen")).toBeNull();
    });
  });

  it("offers the desktop switch only when both sides exist", () => {
    const { rerender } = render(<MatchStripView data={{ result, fixture }} />);
    expect(
      screen.getByRole("button", { name: "Toon de volgende wedstrijd" }),
    ).toBeInTheDocument();

    rerender(<MatchStripView data={{ result, fixture: null }} />);
    expect(
      screen.queryByRole("button", { name: "Toon de volgende wedstrijd" }),
    ).toBeNull();
  });
});

/**
 * #2616 — on the day of its Match the strip relabels the fixture to "Vandaag"
 * and takes the dark jersey ground. `matchDay` is a plain boolean prop
 * (computed once, server-side, by `<MatchStrip>` — see its own docblock) so
 * these tests drive it directly rather than freezing the system clock.
 */
describe("matchDay ground (#2616)", () => {
  const todaysFixture: ScheduleMatch = { ...fixture };

  it("keeps the cream ground when matchDay is false — the default, unchanged from today's behaviour", () => {
    render(<MatchStripView data={{ result, fixture: todaysFixture }} />);
    expect(screen.getByRole("complementary")).toHaveClass("bg-cream");
    expect(screen.queryByText("Vandaag")).toBeNull();
  });

  it("takes the dark jersey ground when matchDay is true", () => {
    render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("bg-jersey-deep-dark");
    expect(aside).not.toHaveClass("bg-cream");
  });

  // No venue: PSD supplies none on this path today (`transformPsdGame` /
  // `transformPsdMatchDetail` in apps/api/src/psd/transforms.ts both hardcode
  // `venue: undefined`, #2398) — ScheduleMatch carries no such field, so the
  // strip only ever names today and the kickoff, never a ground it cannot
  // confirm.
  it("relabels the mobile fixture row to Vandaag with its kickoff", () => {
    render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    const row = screen.getByRole("link", { name: /^Volgende wedstrijd/ });
    expect(within(row).getByText("Vandaag")).toBeInTheDocument();
    expect(within(row).getByText("18:00")).toBeInTheDocument();
    // The numeric day/month stub is redundant with "Vandaag" and drops out.
    expect(within(row).queryByText("8")).toBeNull();
  });

  // The result row above it keeps its fixed-width date stub (`w-14`) — a
  // narrower "Vandaag" column would shift the crest/name/score columns
  // between the two rows of the same mobile ledger.
  it("keeps the date column's fixed width on the Vandaag stub", () => {
    render(
      <MatchStripView data={{ result, fixture: todaysFixture }} matchDay />,
    );
    const row = screen.getByRole("link", { name: /^Volgende wedstrijd/ });
    expect(within(row).getByText("Vandaag")).toHaveClass("w-14");
  });

  it("names today in the fixture row's accessible name", () => {
    render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    expect(
      screen.getByRole("link", { name: /^Volgende wedstrijd vandaag/ }),
    ).toBeInTheDocument();
  });

  it("does not relabel the result row — only the fixture is today's Match", () => {
    render(
      <MatchStripView data={{ result, fixture: todaysFixture }} matchDay />,
    );
    expect(screen.getByRole("link", { name: /^Uitslag/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Uitslag.*[Vv]andaag/ }),
    ).toBeNull();
  });

  // Regression (#2656 review): `outcomeWord` was computed without checking
  // `matchDay`, so a settled result on the dark match-day ground read
  // "Winst" instead of "Uitslag" — #2512 asked only for the light-ground
  // ledger to name a settled result, not for the dark ledger to change.
  it("keeps the plain slot word, visible and accessible, for a settled result on the match-day ground", () => {
    render(
      <MatchStripView data={{ result, fixture: todaysFixture }} matchDay />,
    );
    const row = screen.getByRole("link", { name: /^Uitslag/ });
    expect(within(row).getByText("Uitslag")).toBeInTheDocument();
    expect(within(row).queryByText("Winst")).toBeNull();
  });

  // Regression (#2656 review): the visible stub and the accessible name used
  // to read the word from two independently-gated places — the exact drift
  // #2404 introduced `MATCH_KIND_WORD` to end — so a settled result named
  // its outcome ("Winst") visibly while the label still opened with the
  // plain slot word ("Uitslag").
  it("names a settled result's outcome identically in the visible stub and the accessible name off the match-day ground", () => {
    render(<MatchStripView data={{ result, fixture: null }} />);
    const row = screen.getByRole("link", { name: /^Winst/ });
    expect(within(row).getByText("Winst")).toBeInTheDocument();
  });

  // jersey-deep on jersey-deep-dark is 2.3:1 — the same ratio that forces the
  // CTA's primary -> inverted swap below. The focus ring needs the same
  // dark-ground counterpart, or a keyboard user tabbing the ledger on match
  // day gets no usable indicator at all.
  it("gives the mobile row's focus ring a dark-ground counterpart", () => {
    render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    const row = screen.getByRole("link", { name: /^Volgende wedstrijd/ });
    expect(row).toHaveClass("focus-visible:outline-cream");
    expect(row).not.toHaveClass("focus-visible:outline-jersey-deep");
  });

  it("defaults the desktop slider to the fixture slide, not the result, when it is match day", () => {
    render(
      <MatchStripView data={{ result, fixture: todaysFixture }} matchDay />,
    );
    // Unlike the non-match-day default (which opens on the result), today's
    // strip must lead with the reason it exists — otherwise a desktop visitor
    // sees yesterday's score first and has to click through to find out there
    // is a Match today at all.
    expect(
      screen.getByRole("link", { name: /Wedstrijddetails/i }),
    ).toHaveAttribute("href", `/wedstrijd/${todaysFixture.id}`);
  });

  it("swaps the desktop CTA from primary to the inverted variant", () => {
    render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    const cta = screen.getByRole("link", { name: /Wedstrijddetails/i });
    expect(cta).toHaveClass("bg-cream");
    expect(cta).not.toHaveClass("bg-jersey-deep");
  });

  it("shows the kickoff in the desktop score slot, in place of vs., and keeps the competition on the meta line", () => {
    const { container } = render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    const slide = container.querySelector('[aria-live="polite"]');
    expect(slide?.textContent).toContain("18:00");
    expect(slide?.textContent).toContain(todaysFixture.competition);
    expect(slide?.textContent).not.toMatch(/vs\./);
  });

  // "Vandaag" lives once, on the slide label — the mobile row's own
  // rationale ("restating 'Volgende' under 'Vandaag' would argue with
  // itself") applies just as much to stacking the word twice on one desktop
  // slide, so the meta line must not repeat it.
  it("says Vandaag on the desktop slide label but not the meta line", () => {
    // Both layouts render in the DOM regardless of viewport (only CSS
    // visibility differs), so "Vandaag" legitimately appears twice overall —
    // once in the mobile ledger row, once as the desktop slide label. What
    // must not happen is a THIRD copy on the desktop slide's own meta line,
    // stacking the word on one slide the way the mobile row's own rationale
    // ("restating 'Volgende' under 'Vandaag' would argue with itself")
    // explicitly rules out.
    const { container } = render(
      <MatchStripView
        data={{ result: null, fixture: todaysFixture }}
        matchDay
      />,
    );
    expect(screen.getAllByText("Vandaag")).toHaveLength(2);
    const slide = container.querySelector('[aria-live="polite"]');
    expect(slide?.textContent).not.toContain("Vandaag");
  });

  // Reachable whenever matchDay && !showing.time — not reachable through
  // today's PSD path (parseDateString defaults to "00:00"), but ScheduleMatch
  // still types `time` as optional, so the fallback must not assume cream.
  // Today's fixture with no known kickoff routes through <Score> (which
  // owns the ground colour and the has-a-score/no-score fallback) rather
  // than a hand-built "vs." span — so it renders cream, not the light
  // ink-muted fallback, with no separate pairing needed (#2616 review,
  // simplify pass item 2).
  it("renders today's vs. fallback through Score, in cream, when the fixture carries no time", () => {
    const { container } = render(
      <MatchStripView
        data={{ result: null, fixture: { ...todaysFixture, time: undefined } }}
        matchDay
      />,
    );
    const slide = container.querySelector('[aria-live="polite"]');
    const vs = within(slide as HTMLElement).getByText("vs.");
    expect(vs).toHaveClass("text-cream");
    expect(vs).not.toHaveClass("text-ink-muted");
  });

  // The plain "vs." literal is reachable only for a future, non-today
  // fixture — which means matchDay is always false wherever it renders (a
  // fixture slide is only ever "today" when matchDay is true) — so it never
  // needs a dark counterpart at all.
  it("keeps the plain vs. literal ink-only — it never renders on the match-day ground", () => {
    render(<MatchStripView data={{ result: null, fixture }} />);
    expect(screen.getByText("vs.")).toHaveClass("text-ink-muted");
  });

  it("claims no live or in-progress state anywhere on the match-day ground", () => {
    const { container } = render(
      <MatchStripView data={{ result, fixture: todaysFixture }} matchDay />,
    );
    expect(container.textContent).not.toMatch(/live/i);
  });
});
