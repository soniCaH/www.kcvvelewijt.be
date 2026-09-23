/**
 * Calendar ICS API Route Tests (#2704, #2711 review follow-up)
 *
 * Mocks at the module boundary: `next/cache`'s `unstable_cache` (pass-through,
 * recording each call's key AND raw wrapped function — the latter lets a test
 * invoke the club-activity cache's callback directly to assert it rejects
 * rather than swallowing a failure), `BffService` (the PSD match fan-out),
 * and `EventRepository` (the club activities feed). `teamIds` is always
 * passed explicitly in these requests so `fetchMatches` never falls through
 * to `TeamRepository.findAll()` — that repository, and the rest of
 * `AppLayer`'s repositories, stay real but unused.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Effect, Layer } from "effect";
import type { Match } from "@kcvv/api-contract";
import type { EventListItemVM } from "@/lib/repositories/event.repository";

interface UnstableCacheCall {
  keyParts: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => any;
}

const { mockGetMatches, mockFindUpcomingForList, unstableCacheCalls } =
  vi.hoisted(() => ({
    mockGetMatches: vi.fn(),
    mockFindUpcomingForList: vi.fn(),
    unstableCacheCalls: [] as UnstableCacheCall[],
  }));

vi.mock("next/cache", () => ({
  unstable_cache: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => any,
    keyParts: string[],
  ) => {
    unstableCacheCalls.push({ keyParts, fn });
    return fn;
  },
}));

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: mockGetMatches,
      getNextMatches: () => Effect.succeed([]),
      getMatchesWindow: () => Effect.succeed([]),
      getMatchDetail: () => Effect.die("not used by this route"),
      getRanking: () => Effect.succeed([]),
      getRelated: () => Effect.succeed([]),
      getOpponentHistory: () => Effect.die("not used by this route"),
      getPlayerStats: () => Effect.die("not used by this route"),
    }),
  };
});

vi.mock("@/lib/repositories/event.repository", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/repositories/event.repository")
    >();
  return {
    ...actual,
    EventRepositoryLive: Layer.succeed(actual.EventRepository, {
      findAll: () => Effect.succeed([]),
      findUpcomingForList: mockFindUpcomingForList,
      findNextFeatured: () => Effect.succeed(null),
      findBySlug: () => Effect.succeed(null),
    }),
  };
});

import { GET } from "./route";

/**
 * The club-activity read is cached under its own module-scoped key (#2711
 * review) — `unstable_cache(...)` for it runs exactly once, when this module
 * is first imported, rather than once per request. Captured here, before any
 * `beforeEach` clears `unstableCacheCalls`, so this is the one and only
 * registration for it across the whole file.
 */
const eventsCacheCallAtImport = unstableCacheCalls.find(
  (call) => JSON.stringify(call.keyParts) === JSON.stringify(["ical:events"]),
);

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 12345,
    date: new Date("2026-04-15T14:00:00.000Z"),
    time: "16:00",
    venue: undefined,
    home_team: { id: 1235, name: "KCVV Elewijt", score: undefined },
    away_team: { id: 2, name: "KFC Turnhout", score: undefined },
    status: "scheduled",
    squadLabel: "A-Ploeg",
    competition: "2e Nationale",
    ...overrides,
  } as Match;
}

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

function makeRequest(query: string): NextRequest {
  return new NextRequest(
    new URL(`/api/calendar.ics?${query}`, "http://localhost:3000"),
  );
}

describe("GET /api/calendar.ics", () => {
  beforeEach(() => {
    // Only the per-request (matches-cache) registrations are cleared —
    // `eventsCacheCallAtImport` was captured once, above, before this ever
    // runs, and the events cache is never re-registered per request.
    unstableCacheCalls.length = 0;
    mockGetMatches.mockReset().mockReturnValue(Effect.succeed([makeMatch()]));
    mockFindUpcomingForList.mockReset().mockReturnValue(Effect.succeed([]));
  });

  it("without the events flag, returns exactly today's matches-only feed — a pinned test proves an existing subscription is unaffected", async () => {
    const response = await GET(makeRequest("teamIds=1235"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("kcvv-match-12345@kcvvelewijt.be");
    expect(body).not.toContain("kcvv-event-");
    expect(body).toContain("X-WR-CALNAME:KCVV Elewijt");
    expect(body).not.toContain("Activiteiten");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="kcvv-wedstrijden.ics"',
    );
  });

  it("events=0 behaves the same as omitting the flag", async () => {
    const response = await GET(makeRequest("teamIds=1235&events=0"));
    const body = await response.text();

    expect(body).not.toContain("kcvv-event-");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="kcvv-wedstrijden.ics"',
    );
  });

  it("events=1 returns the selected teams' fixtures plus every upcoming club activity", async () => {
    mockFindUpcomingForList.mockReturnValue(Effect.succeed([makeEventItem()]));

    const response = await GET(makeRequest("teamIds=1235&events=1"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("kcvv-match-12345@kcvvelewijt.be");
    expect(body).toContain("kcvv-event-event-1@kcvvelewijt.be");
    expect(body).toContain("SUMMARY:Mosselfestijn");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="kcvv-wedstrijden-en-activiteiten.ics"',
    );
  });

  it("degrades to the matches-only feed, not a 500, when the event read fails", async () => {
    mockFindUpcomingForList.mockReturnValue(Effect.die("Sanity is down"));

    const response = await GET(makeRequest("teamIds=1235&events=1"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("kcvv-match-12345@kcvvelewijt.be");
    expect(body).not.toContain("kcvv-event-");
  });

  it("shares one matches cache key between an events=1 and a matches-only request for the same teamIds/side (#2711 round 2) — the fixture fetch is never duplicated per flag value", async () => {
    await GET(makeRequest("teamIds=1235"));
    await GET(makeRequest("teamIds=1235&events=1"));

    expect(unstableCacheCalls).toHaveLength(2);
    expect(unstableCacheCalls[0]!.keyParts).toEqual(
      unstableCacheCalls[1]!.keyParts,
    );
  });

  it("never serves a matches-only body to an events=1 request or vice versa — there is no shared body cache to collide on; each response is composed per request from its own includeEvents flag", async () => {
    mockFindUpcomingForList.mockReturnValue(Effect.succeed([makeEventItem()]));

    const matchesOnly = await GET(makeRequest("teamIds=1235"));
    const withEvents = await GET(makeRequest("teamIds=1235&events=1"));

    expect(await matchesOnly.text()).not.toContain("kcvv-event-");
    expect(await withEvents.text()).toContain(
      "kcvv-event-event-1@kcvvelewijt.be",
    );
  });

  it("registers the club-activity cache under its own fixed key, decoupled from teamIds/side — not multiplied per team-selection permutation", async () => {
    expect(eventsCacheCallAtImport?.keyParts).toEqual(["ical:events"]);

    mockFindUpcomingForList.mockReturnValue(Effect.succeed([makeEventItem()]));
    await GET(makeRequest("teamIds=1235&events=1"));
    await GET(makeRequest("teamIds=9999&side=home&events=1"));

    // Two requests with different team selections registered no NEW events
    // cache entry — only the two per-request matches-cache entries appear
    // here (`unstableCacheCalls` was cleared in `beforeEach`, after the one
    // module-scoped events registration already happened at import).
    const eventsCacheRegistrationsDuringTest = unstableCacheCalls.filter(
      (call) =>
        JSON.stringify(call.keyParts) === JSON.stringify(["ical:events"]),
    );
    expect(eventsCacheRegistrationsDuringTest).toHaveLength(0);
  });

  it("lets a failed event read reject the cached callback itself with the underlying failure, rather than resolving it with a degraded fallback (so Next's throw ⇒ last-good semantics apply, not caught ⇒ cached)", async () => {
    expect(eventsCacheCallAtImport).toBeDefined();
    mockFindUpcomingForList.mockReturnValue(Effect.die("Sanity is down"));

    // Asserts the *cause* of the rejection, not merely that some rejection
    // happened — `rejects.toBeDefined()` alone would also pass on a rejection
    // caused by a typo in this test's own setup, proving nothing about the
    // Sanity defect actually propagating (#2711 round 2 finding B).
    let caught: unknown;
    try {
      await eventsCacheCallAtImport!.fn();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(String(caught)).toContain("Sanity is down");
  });

  it("resolves the cached callback with the event list on a successful read", async () => {
    const events = [makeEventItem()];
    mockFindUpcomingForList.mockReturnValue(Effect.succeed(events));

    await expect(eventsCacheCallAtImport!.fn()).resolves.toEqual(events);
  });
});
