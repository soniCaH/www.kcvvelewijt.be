/**
 * Calendar ICS API Route Tests (#2704, #2711 review follow-up)
 *
 * Mocks at the module boundary: `next/cache`'s `unstable_cache` (pass-through,
 * recording each call's key AND raw wrapped function — the latter lets a test
 * invoke the club-activity cache's callback directly to assert it rejects
 * rather than swallowing a failure), `BffService` (the PSD match fan-out),
 * `EventRepository` (the club activities feed) and `TeamRepository` (the
 * known teams whose `psdId`s are the only ids the feed accepts, #3486). The
 * rest of `AppLayer`'s repositories stay real but unused.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Effect, Layer } from "effect";
import type { Match } from "@kcvv/api-contract";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

interface UnstableCacheCall {
  keyParts: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => any;
}

const {
  mockGetMatches,
  mockFindUpcomingForList,
  mockFindAllTeams,
  unstableCacheCalls,
} = vi.hoisted(() => ({
  mockGetMatches: vi.fn(),
  mockFindUpcomingForList: vi.fn(),
  mockFindAllTeams: vi.fn(),
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

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...actual,
    TeamRepositoryLive: Layer.succeed(actual.TeamRepository, {
      findAll: mockFindAllTeams,
      findBySlug: () => Effect.die("not used by this route"),
      findAllForLanding: () => Effect.die("not used by this route"),
      findByMemberId: () => Effect.die("not used by this route"),
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

function makeTeam(psdId: number | null): TeamNavVM {
  return {
    id: `team-${psdId}`,
    name: `Team ${psdId}`,
    displayName: `Team ${psdId}`,
    slug: `team-${psdId}`,
    age: null,
    psdId: psdId === null ? null : String(psdId),
    division: null,
    divisionFull: null,
    teamImageUrl: null,
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
    mockFindAllTeams
      .mockReset()
      .mockReturnValue(Effect.succeed([1, 1235, 9999].map(makeTeam)));
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

/**
 * #3486: the matches cache key and the PSD fan-out are built from ONE parsed
 * list — strict ids, deduped, sorted, known-team `psdId`s only, capped — so
 * no query-string variation mints a fresh cache entry or an extra PSD call.
 */
describe("GET /api/calendar.ics team-id parsing (#3486)", () => {
  beforeEach(() => {
    unstableCacheCalls.length = 0;
    mockGetMatches.mockReset().mockReturnValue(Effect.succeed([]));
    mockFindUpcomingForList.mockReset().mockReturnValue(Effect.succeed([]));
    mockFindAllTeams
      .mockReset()
      .mockReturnValue(Effect.succeed([1, 2, 1235, null].map(makeTeam)));
  });

  async function keyFor(query: string): Promise<string[]> {
    unstableCacheCalls.length = 0;
    await GET(makeRequest(query));
    return unstableCacheCalls[0]!.keyParts;
  }

  function fannedOutIds(): number[] {
    return mockGetMatches.mock.calls.map(([id]) => id as number);
  }

  it("gives ?teamIds=1,1,01 and ?teamIds=1 the same cache key", async () => {
    expect(await keyFor("teamIds=1,1,01")).toEqual(await keyFor("teamIds=1"));
  });

  it("gives ?teamIds=1,x1 and ?teamIds=1,x2 the same cache key", async () => {
    expect(await keyFor("teamIds=1,x1")).toEqual(await keyFor("teamIds=1,x2"));
  });

  it("orders the key, so ?teamIds=2,1 and ?teamIds=1,2 share it", async () => {
    expect(await keyFor("teamIds=2,1")).toEqual(await keyFor("teamIds=1,2"));
  });

  it("never calls getMatches for an id that is not a known team psdId", async () => {
    await GET(makeRequest("teamIds=1,424242,x7"));
    expect(fannedOutIds()).toEqual([1]);
  });

  it("caps at MAX_TEAM_IDS (20) after dedupe", async () => {
    const ids = Array.from({ length: 25 }, (_, i) => i + 1);
    mockFindAllTeams.mockReturnValue(Effect.succeed(ids.map(makeTeam)));
    // 1 repeated 10 times up front: a cap before dedupe would keep only 11 ids.
    const query = [...Array(10).fill(1), ...ids].join(",");

    const key = await keyFor(`teamIds=${query}`);

    expect(fannedOutIds()).toEqual(ids.slice(0, 20));
    expect(key).toEqual([`ical:${ids.slice(0, 20).join(",")}:all`]);
  });

  it("falls back to the all-teams feed when no valid id remains, same as an empty teamIds", async () => {
    const junkKey = await keyFor("teamIds=x1,424242");
    const junkCalls = fannedOutIds();
    mockGetMatches.mockClear();

    expect(junkKey).toEqual(await keyFor("teamIds="));
    expect(junkKey).toEqual(["ical:all:all"]);
    expect(junkCalls).toEqual([1, 2, 1235]);
    expect(fannedOutIds()).toEqual([1, 2, 1235]);
  });

  it("keeps serving a selected-team feed when the team read fails, under the key a healthy read would use", async () => {
    const healthyKey = await keyFor("teamIds=1,1,01");
    mockGetMatches.mockClear();
    mockFindAllTeams.mockReturnValue(Effect.die(new Error("Sanity down")));

    unstableCacheCalls.length = 0;
    const response = await GET(makeRequest("teamIds=1,1,01"));

    expect(response.status).toBe(200);
    expect(unstableCacheCalls[0]!.keyParts).toEqual(healthyKey);
    expect(fannedOutIds()).toEqual([1]);
  });

  it("looks up the all-teams entry before reading the teams, so a warm entry survives a failed team read", async () => {
    mockFindAllTeams.mockReturnValue(Effect.die(new Error("Sanity down")));

    // Pass-through cache = always cold, so the miss still needs the list.
    expect(await keyFor("teamIds=")).toEqual(["ical:all:all"]);
    expect(mockGetMatches).not.toHaveBeenCalled();
  });
});
