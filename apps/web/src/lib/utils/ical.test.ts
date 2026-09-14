import { describe, expect, it } from "vitest";
import type { Match } from "@kcvv/api-contract";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { buildEventIcs } from "./event-ics";
import { buildEventUid } from "./event-uid";
import {
  buildIcalFeed,
  normalizeCacheKey,
  resolveFeedVariant,
  type MatchSide,
} from "./ical";

/**
 * Drives the full `matchesToEntries`/`eventsToEntries` → `generateIcal`
 * pipeline the same way `route.ts` does (#2717), via the same `buildIcalFeed`
 * composition — mirrors the pre-refactor `generateIcal(matches, options)`
 * call shape so the ~40 assertions below could be rewritten to a new call
 * site without touching any expected value. Passes `events` only when the
 * flag is on, the same way `route.ts` only ever fetches it then — matching
 * `buildIcalFeed`'s own contract that it never re-gates `events` on
 * `variant` itself (see that function's doc).
 */
function renderIcal(
  matches: readonly Match[],
  options: {
    side?: MatchSide;
    includeEvents?: boolean;
    events?: readonly EventListItemVM[];
  } = {},
): string {
  const { side = "all", includeEvents = false, events = [] } = options;
  return buildIcalFeed(
    matches,
    includeEvents ? events : [],
    resolveFeedVariant(includeEvents),
    side,
  );
}

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 12345,
    date: new Date("2025-03-22T14:00:00.000Z"),
    time: "15:00",
    venue: undefined,
    home_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    away_team: { id: 2, name: "KFC Turnhout", score: undefined },
    status: "scheduled",
    squadLabel: "A-Ploeg",
    competition: "2e Nationale",
    ...overrides,
  } as Match;
}

/**
 * A pitch-reservation placeholder (#2606): both sides are the same club, so
 * `home_team`/`away_team` carry identical ids and names.
 */
function makePlaceholderMatch(overrides: Partial<Match> = {}): Match {
  return makeMatch({
    id: 54321,
    home_team: { id: 5, name: "KCVV Elewijt", score: undefined },
    away_team: { id: 5, name: "KCVV Elewijt", score: undefined },
    is_placeholder: true,
    competition: "Jeugdtornooi",
    ...overrides,
  });
}

describe("generateIcal", () => {
  it("generates a valid iCal with a scheduled match", () => {
    const matches = [makeMatch()];
    const output = renderIcal(matches);

    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("KCVV Elewijt//Wedstrijdkalender//NL");
    expect(output).toContain("X-WR-CALNAME:KCVV Elewijt");
    expect(output).toContain("BEGIN:VTIMEZONE");
    expect(output).toContain("TZID:Europe/Brussels");
    expect(output).toContain("BEGIN:VEVENT");
    expect(output).toContain("SUMMARY:KCVV Elewijt - KFC Turnhout");
    expect(output).toContain("kcvv-match-12345@kcvvelewijt.be");
    expect(output).toContain("https://www.kcvvelewijt.be/wedstrijd/12345");
    expect(output).toContain("2e Nationale — A-Ploeg");
    expect(output).toContain("END:VCALENDAR");
  });

  it("shows score in SUMMARY for finished matches", () => {
    const match = makeMatch({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 2, name: "KFC Turnhout", score: 1 },
    } as Partial<Match>);
    const output = renderIcal([match]);

    expect(output).toContain("SUMMARY:KCVV Elewijt 3-1 KFC Turnhout");
  });

  it("uses the BFF-supplied venue as LOCATION when provided", () => {
    const match = makeMatch({ venue: "Stadion De Kuip" });
    const output = renderIcal([match]);

    expect(output).toContain("Stadion De Kuip");
  });

  // #2491: the BFF is the sole source of `venue` now — a home fixture with
  // no `venue` gets no LOCATION line, never a locally-synthesised fallback
  // (`HOME_VENUE_FALLBACK` is retired, not moved).
  it("omits LOCATION for a home match without venue — no local fallback", () => {
    const match = makeMatch({ venue: undefined, is_home: true });
    const output = renderIcal([match]);

    expect(output).not.toMatch(/^LOCATION:/m);
  });

  it("omits LOCATION for away matches without venue", () => {
    const match = makeMatch({
      venue: undefined,
      is_home: false,
      home_team: { id: 2, name: "KFC Turnhout", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = renderIcal([match]);

    expect(output).not.toMatch(/^LOCATION:/m);
  });

  it("filters by side=home", () => {
    const home = makeMatch({ id: 1, is_home: true });
    const away = makeMatch({
      id: 2,
      is_home: false,
      home_team: { id: 3, name: "FC Away", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = renderIcal([home, away], { side: "home" });

    expect(output).toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).not.toContain("kcvv-match-2@kcvvelewijt.be");
  });

  it("filters by side=away", () => {
    const home = makeMatch({ id: 1, is_home: true });
    const away = makeMatch({
      id: 2,
      is_home: false,
      home_team: { id: 3, name: "FC Away", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = renderIcal([home, away], { side: "away" });

    expect(output).not.toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).toContain("kcvv-match-2@kcvvelewijt.be");
  });

  it("side=home excludes a match whose is_home is unresolved", () => {
    const unresolved = makeMatch({ id: 3, is_home: undefined });
    const output = renderIcal([unresolved], { side: "home" });

    expect(output).not.toContain("kcvv-match-3@kcvvelewijt.be");
  });

  it("deduplicates matches by id", () => {
    const match1 = makeMatch({ id: 100 });
    const match2 = makeMatch({ id: 100 });
    const output = renderIcal([match1, match2]);

    const eventCount = output.split("BEGIN:VEVENT").length - 1;
    expect(eventCount).toBe(1);
  });

  it("side=all includes all matches", () => {
    const home = makeMatch({ id: 1 });
    const away = makeMatch({
      id: 2,
      home_team: { id: 3, name: "FC Away", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = renderIcal([home, away], { side: "all" });

    expect(output).toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).toContain("kcvv-match-2@kcvvelewijt.be");
  });

  it("uses CET offset (UTC+1) for winter dates", () => {
    const match = makeMatch({
      date: new Date("2025-01-15T00:00:00.000Z"),
      time: "15:00",
    });
    const output = renderIcal([match]);
    // 15:00 Brussels local time preserved with TZID
    expect(output).toContain("DTSTART;TZID=Europe/Brussels:20250115T150000");
  });

  it("uses CEST offset (UTC+2) for summer dates", () => {
    const match = makeMatch({
      date: new Date("2025-07-15T00:00:00.000Z"),
      time: "15:00",
    });
    const output = renderIcal([match]);
    // 15:00 Brussels local time preserved with TZID
    expect(output).toContain("DTSTART;TZID=Europe/Brussels:20250715T150000");
  });

  /**
   * The `time`-less branch. A BFF match date carries Belgian wall-clock in its
   * UTC fields, so converting it to Brussels adds a phantom +1/+2h — and this
   * feed is *subscribed*, so a wrong DTSTART follows people into their calendar
   * app until they unsubscribe. The branch shipped untested (#2601).
   */
  describe("a fixture with no kickoff time", () => {
    it("emits the date's own wall clock rather than converting it", () => {
      const match = makeMatch({
        date: new Date(Date.UTC(2025, 2, 22, 15, 0)),
        time: undefined,
      });
      const output = renderIcal([match]);

      expect(output).toContain("DTSTART;TZID=Europe/Brussels:20250322T150000");
    });

    it("keeps a midnight fixture at midnight, in winter too", () => {
      const match = makeMatch({
        date: new Date(Date.UTC(2025, 0, 15, 0, 0)),
        time: undefined,
      });
      const output = renderIcal([match]);

      expect(output).toContain("DTSTART;TZID=Europe/Brussels:20250115T000000");
    });

    it("agrees with the same kickoff spelled out in `time`", () => {
      const date = new Date(Date.UTC(2025, 6, 15, 15, 0));
      const implicit = renderIcal([makeMatch({ date, time: undefined })]);
      const explicit = renderIcal([makeMatch({ date, time: "15:00" })]);

      // The event's own DTSTART, not the VTIMEZONE transition rules above it —
      // those are identical whatever the fixture, so a looser match passes
      // while the two branches disagree by two hours.
      const dtstart = (ics: string) => /^DTSTART;TZID=.*$/m.exec(ics)?.[0];
      expect(dtstart(implicit)).toBe(dtstart(explicit));
      expect(dtstart(implicit)).toBeDefined();
    });

    it("keeps a 22:00 kickoff on its own day", () => {
      const match = makeMatch({
        date: new Date(Date.UTC(2025, 7, 3, 22, 0)),
        time: undefined,
      });
      const output = renderIcal([match]);

      expect(output).toContain("DTSTART;TZID=Europe/Brussels:20250803T220000");
    });
  });

  it("sorts matches by date", () => {
    const earlier = makeMatch({
      id: 1,
      date: new Date("2025-03-01T14:00:00Z"),
    });
    const later = makeMatch({
      id: 2,
      date: new Date("2025-04-01T14:00:00Z"),
    });
    const output = renderIcal([later, earlier]);

    const idx1 = output.indexOf("kcvv-match-1@kcvvelewijt.be");
    const idx2 = output.indexOf("kcvv-match-2@kcvvelewijt.be");
    expect(idx1).toBeLessThan(idx2);
  });

  /**
   * `match.time` is unvalidated free text upstream — PSD is known-messy — so
   * a malformed value must be dropped, not thrown, the same way an
   * unparseable event `dateStart` is (see the events-flag describe below).
   * Pre-refactor this same input threw inside `generateIcal` and 500'd the
   * whole feed for every subscriber over one bad fixture; this pins the fix.
   */
  it("drops a match with an unparseable time instead of throwing", () => {
    const bad = makeMatch({ id: 999, time: "aa:bb" });
    const good = makeMatch({ id: 1000, time: "15:00" });

    expect(() => renderIcal([bad, good])).not.toThrow();

    const output = renderIcal([bad, good]);
    expect(output).not.toContain("kcvv-match-999@kcvvelewijt.be");
    expect(output).toContain("kcvv-match-1000@kcvvelewijt.be");
  });
});

describe("a pitch-reservation placeholder", () => {
  it("never renders a home===away SUMMARY", () => {
    const output = renderIcal([makePlaceholderMatch()]);

    expect(output).not.toContain("SUMMARY:KCVV Elewijt - KCVV Elewijt");
  });

  it("uses the reservation subject as the SUMMARY, mirroring formatMatchTitle", () => {
    const output = renderIcal([
      makePlaceholderMatch({ competition: "Jeugdtornooi" }),
    ]);

    expect(output).toContain("SUMMARY:Jeugdtornooi — KCVV Elewijt");
  });

  it("falls back to the reservation word when no competition is set", () => {
    const output = renderIcal([
      makePlaceholderMatch({ competition: undefined }),
    ]);

    expect(output).toContain("SUMMARY:Gereserveerd — KCVV Elewijt");
  });

  it("is treated as a home fixture for side filtering — it is the club's own booking, and both sides are literally the same club name", () => {
    const match = makePlaceholderMatch();

    expect(renderIcal([match], { side: "home" })).toContain("BEGIN:VEVENT");
    expect(renderIcal([match], { side: "away" })).not.toContain("BEGIN:VEVENT");
  });

  it("folds a cancelled status into the SUMMARY, the way every other reservation renderer does", () => {
    const output = renderIcal([makePlaceholderMatch({ status: "postponed" })]);

    expect(output).toContain(
      "SUMMARY:Jeugdtornooi — KCVV Elewijt — Uitgesteld",
    );
  });

  it("omits LOCATION when no venue is set — a reservation can be an external tournament, not necessarily at the home venue", () => {
    const output = renderIcal([makePlaceholderMatch({ venue: undefined })]);

    expect(output).not.toMatch(/^LOCATION:/m);
  });

  it("uses the given venue for LOCATION when one is set", () => {
    const output = renderIcal([
      makePlaceholderMatch({ venue: "Sportcomplex De Nekker" }),
    ]);

    expect(output).toContain("Sportcomplex De Nekker");
  });
});

describe("normalizeCacheKey", () => {
  it("sorts teamIds so order does not matter", () => {
    expect(normalizeCacheKey("2456,1235", "all")).toBe(
      normalizeCacheKey("1235,2456", "all"),
    );
  });

  it("uses 'all' when no teamIds provided", () => {
    expect(normalizeCacheKey(null, "home")).toBe("ical:all:home");
  });

  it("includes side in cache key", () => {
    expect(normalizeCacheKey("1235", "home")).toBe("ical:1235:home");
    expect(normalizeCacheKey("1235", "away")).toBe("ical:1235:away");
  });

  it("has no events dimension — #2711 round 2 moved club activities to their own separately-cached key, so the fixture key is unaffected by the flag and stable at its pre-#2704 form", () => {
    expect(normalizeCacheKey("1235", "all")).toBe("ical:1235:all");
  });
});

/**
 * Fixture for the merged `/kalender` event feed (`EventRepository.findUpcomingForList()`).
 * `dateStart`/`dateEnd` are genuine UTC instants (not Belgian wall-clock like a
 * `Match.date`) — see `event-datetime.ts`. `2026-04-14T22:00:00.000Z` is
 * Brussels midnight (2026-04-15, CEST +2).
 */
function makeEventItem(
  overrides: Partial<EventListItemVM> = {},
): EventListItemVM {
  return {
    id: "event-1",
    title: "Mosselfestijn",
    href: "/evenementen/mosselfestijn",
    dateStart: "2026-04-14T22:00:00.000Z",
    dateEnd: null,
    eventType: "Clubevent",
    location: "Sportpark Driesput, Elewijt",
    source: "event",
    ...overrides,
  };
}

describe("generateIcal — club activities (events flag)", () => {
  it("emits no event VEVENT when the events option is omitted (flag off)", () => {
    const output = renderIcal([makeMatch()]);

    expect(output).not.toContain("kcvv-event-");
  });

  it("emits an event VEVENT when events are passed (flag on)", () => {
    const output = renderIcal([makeMatch()], {
      includeEvents: true,
      events: [makeEventItem()],
    });

    expect(output).toContain("kcvv-event-event-1@kcvvelewijt.be");
    expect(output).toContain("SUMMARY:Mosselfestijn");
  });

  it("carries the event's LOCATION when present", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [makeEventItem({ location: "Sportpark Driesput, Elewijt" })],
    });

    expect(output).toContain("LOCATION:Sportpark Driesput\\, Elewijt");
  });

  it("omits LOCATION when the event has none", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [makeEventItem({ location: null })],
    });

    expect(output).not.toMatch(/^LOCATION:/m);
  });

  it("points URL at the item's own detail page, using the repository-resolved href", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          href: "/evenementen/mosselfestijn",
          source: "event",
        }),
      ],
    });

    expect(output).toContain(
      "URL;VALUE=URI:https://www.kcvvelewijt.be/evenementen/mosselfestijn",
    );
  });

  it("points URL at /nieuws/[slug] for an event-article-sourced item", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          href: "/nieuws/jeugdtornooi-verslag",
          source: "article",
        }),
      ],
    });

    expect(output).toContain(
      "URL;VALUE=URI:https://www.kcvvelewijt.be/nieuws/jeugdtornooi-verslag",
    );
  });

  it("emits a Brussels-midnight event as all-day, matching buildEventIcs's rule", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          dateStart: "2026-04-14T22:00:00.000Z", // 2026-04-15T00:00 Brussels
          dateEnd: null,
        }),
      ],
    });

    expect(output).toContain("DTSTART;VALUE=DATE:20260415");
    expect(output).toContain("DTEND;VALUE=DATE:20260416");
  });

  it("spans a multi-day all-day event to the day after its last day, matching buildEventIcs's rule", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          dateStart: "2026-09-13T22:00:00.000Z", // 2026-09-14T00:00 Brussels
          dateEnd: "2026-09-15T22:00:00.000Z", // 2026-09-16T00:00 Brussels
        }),
      ],
    });

    expect(output).toContain("DTSTART;VALUE=DATE:20260914");
    expect(output).toContain("DTEND;VALUE=DATE:20260917");
  });

  it("emits a timed event with a real DTSTART and no fabricated DTEND when there is no end", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          dateStart: "2026-04-15T17:00:00.000Z", // 19:00 Brussels (CEST)
          dateEnd: null,
        }),
      ],
    });

    expect(output).toContain("DTSTART;TZID=Europe/Brussels:20260415T190000");
    expect(output).not.toMatch(/^DTEND/m);
  });

  it("keeps a timed event's own DTEND when the item has an end", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          dateStart: "2026-04-15T17:00:00.000Z",
          dateEnd: "2026-04-15T20:00:00.000Z",
        }),
      ],
    });

    expect(output).toContain("DTEND;TZID=Europe/Brussels:20260415T220000");
  });

  it("gives an event UID a distinct prefix from a match UID so the two can never collide", () => {
    const output = renderIcal([makeMatch({ id: 1 })], {
      includeEvents: true,
      events: [makeEventItem({ id: "1" })],
    });

    expect(output).toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).toContain("kcvv-event-1@kcvvelewijt.be");
  });

  it("drops an event with an unparseable dateStart instead of throwing — mergeEventFeed and EventMonthList drop such a row too, never fatal", () => {
    const badItem = makeEventItem({ id: "bad", dateStart: "" });
    const goodItem = makeEventItem({ id: "good" });

    expect(() =>
      renderIcal([makeMatch()], {
        includeEvents: true,
        events: [badItem, goodItem],
      }),
    ).not.toThrow();

    const output = renderIcal([makeMatch()], {
      includeEvents: true,
      events: [badItem, goodItem],
    });
    expect(output).not.toContain("kcvv-event-bad@kcvvelewijt.be");
    expect(output).toContain("kcvv-event-good@kcvvelewijt.be");
    expect(output).toContain("kcvv-match-12345@kcvvelewijt.be");
  });

  it("drops an event's DTEND rather than throwing when dateEnd is unparseable, keeping the item as a timed event with no fabricated end", () => {
    const output = renderIcal([], {
      includeEvents: true,
      events: [
        makeEventItem({
          dateStart: "2026-04-15T17:00:00.000Z",
          dateEnd: "not-a-date",
        }),
      ],
    });

    expect(output).toContain("DTSTART;TZID=Europe/Brussels:20260415T190000");
    expect(output).not.toMatch(/^DTEND/m);
  });

  it("describes the feed honestly (NAME / X-WR-CALDESC) when activities are included", () => {
    const withoutEvents = renderIcal([makeMatch()]);
    const withEvents = renderIcal([makeMatch()], {
      includeEvents: true,
      events: [makeEventItem()],
    });

    expect(withoutEvents).toContain("X-WR-CALNAME:KCVV Elewijt");
    expect(withEvents).toContain(
      "X-WR-CALNAME:KCVV Elewijt — Wedstrijden & Activiteiten",
    );
    expect(withEvents).toContain(
      "X-WR-CALDESC:Wedstrijden en clubactiviteiten van KCVV Elewijt",
    );
    expect(withEvents).not.toBe(withoutEvents);
  });

  it("is driven by includeEvents, not by a nonempty events array — passing events without the flag keeps the matches-only naming", () => {
    const output = renderIcal([makeMatch()], {
      events: [makeEventItem()],
    });

    expect(output).toContain("X-WR-CALNAME:KCVV Elewijt — Wedstrijden\r");
    expect(output).not.toContain("Activiteiten");
  });
});

/**
 * `buildIcalFeed` itself — not through `renderIcal`, which reproduces
 * `route.ts`'s own "only fetch events when the flag is on" gate. This pins
 * that `buildIcalFeed` has no *second* gate of its own: it maps and includes
 * whatever `events` it is given, regardless of `variant`. The route can
 * never exercise the `variant === "matches"` + nonempty-`events` combination
 * (it always passes `[]` when the flag is off), but a future caller —
 * #2705's `buildWebcalUrl` toggle is the named one — must be able to hand
 * `buildIcalFeed` both without either silently discarding the other.
 */
describe("buildIcalFeed — events are never re-gated on variant", () => {
  it("includes events even when variant is matches-only — the caller decides what to pass in", () => {
    const output = buildIcalFeed([], [makeEventItem()], "matches");

    expect(output).toContain(`UID:${buildEventUid("event-1")}`);
  });
});

/**
 * `generateIcal`'s club-activity VEVENTs and the per-event "Zet in agenda"
 * download (`buildEventIcs`) both resolve their all-day classification
 * through the one shared `resolveEventDateRange` (#2711 review, fix 1) — this
 * pins the two surfaces against the *same* input so a future edit to only one
 * of them fails a test instead of silently diverging.
 */
describe("generateIcal and buildEventIcs agree on the all-day classification", () => {
  it("both surfaces render the same Brussels-midnight input as all-day, on the same day", () => {
    const item = makeEventItem({
      dateStart: "2026-04-14T22:00:00.000Z", // 2026-04-15T00:00 Brussels
      dateEnd: null,
    });

    const feedOutput = renderIcal([], {
      includeEvents: true,
      events: [item],
    });
    const downloadOutput = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: item.title,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
      now: "2026-01-01T00:00:00.000Z",
    });

    expect(feedOutput).toContain("DTSTART;VALUE=DATE:20260415");
    expect(downloadOutput).toContain("DTSTART;VALUE=DATE:20260415");
    expect(feedOutput).toContain("DTEND;VALUE=DATE:20260416");
    expect(downloadOutput).toContain("DTEND;VALUE=DATE:20260416");
  });

  it("both surfaces render the same timed input as timed, with the same DTSTART instant", () => {
    const item = makeEventItem({
      dateStart: "2026-04-15T17:00:00.000Z",
      dateEnd: null,
    });

    const feedOutput = renderIcal([], {
      includeEvents: true,
      events: [item],
    });
    const downloadOutput = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: item.title,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
      now: "2026-01-01T00:00:00.000Z",
    });

    expect(feedOutput).not.toMatch(/^DTSTART;VALUE=DATE/m);
    expect(downloadOutput).not.toMatch(/^DTSTART;VALUE=DATE/m);
    expect(downloadOutput).toContain("DTSTART:20260415T170000Z");
    expect(feedOutput).toContain(
      "DTSTART;TZID=Europe/Brussels:20260415T190000",
    );
  });

  /**
   * The branch neither prior parity case exercised: `resolveEventDateRange`'s
   * `lastDay.plus({ days: 1 })` only does real work when `end > start` (a
   * genuine multi-day span) — a single-day event collapses `lastDay` to
   * `start` either way. This is the branch most likely to silently drift
   * between the two surfaces, and the reason the shared helper exists
   * (#2711 round 1 finding 1).
   */
  it("both surfaces span the same multi-day all-day input to the same exclusive end day", () => {
    const item = makeEventItem({
      dateStart: "2026-09-13T22:00:00.000Z", // 2026-09-14T00:00 Brussels
      dateEnd: "2026-09-15T22:00:00.000Z", // 2026-09-16T00:00 Brussels
    });

    const feedOutput = renderIcal([], {
      includeEvents: true,
      events: [item],
    });
    const downloadOutput = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: item.title,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
      now: "2026-01-01T00:00:00.000Z",
    });

    expect(feedOutput).toContain("DTSTART;VALUE=DATE:20260914");
    expect(downloadOutput).toContain("DTSTART;VALUE=DATE:20260914");
    expect(feedOutput).toContain("DTEND;VALUE=DATE:20260917");
    expect(downloadOutput).toContain("DTEND;VALUE=DATE:20260917");
  });
});

/**
 * #2716: the subscribe feed and the per-event "Zet in agenda" download used
 * to mint different UIDs for the same activity — the feed's `kcvv-event-<id>`
 * scheme vs. the download's bare `<slug>@kcvvelewijt.be`, with no namespace
 * prefix at all. This pins the feed side (`eventToEntry`, exercised for real
 * via `renderIcal`) against a `buildEventIcs` call reconstructed the same way
 * `EventDetailCtas`'s call site builds it — a real regression on the feed
 * side fails here; a literal re-inlined in `EventDetailCtas` itself is
 * guarded separately, by `EventDetailCtas.test.tsx`.
 */
describe("generateIcal and buildEventIcs agree on the event UID scheme", () => {
  it("both surfaces emit the same UID for the same event id", () => {
    const item = makeEventItem({ id: "abc123" });

    const feedOutput = renderIcal([], {
      includeEvents: true,
      events: [item],
    });
    // Mirrors EventDetailCtas's call site: the download's caller passes
    // `buildEventUid(eventId)` as `EventIcsInput.uid` (`buildEventIcs` takes
    // the UID as caller-supplied input and has no opinion of its own).
    const downloadOutput = buildEventIcs({
      uid: buildEventUid(item.id),
      title: item.title,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
      now: "2026-01-01T00:00:00.000Z",
    });

    const expectedUid = buildEventUid("abc123");
    expect(feedOutput).toContain(`UID:${expectedUid}`);
    expect(downloadOutput).toContain(`UID:${expectedUid}`);
  });
});
