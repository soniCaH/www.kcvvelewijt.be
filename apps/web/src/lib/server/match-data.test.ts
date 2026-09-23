import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

// Passthrough: this module owns *which* match is picked, not how a Match is
// reshaped into a ScheduleMatch — `transformMatchToSchedule` has its own tests.
vi.mock("@/components/match/transform", () => ({
  transformMatchToSchedule: (m: { id: number; date: Date }) => ({
    id: m.id,
    date: m.date,
  }),
}));

import { Effect, Layer } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityReadError } from "@/lib/sanity/fetch-groq";
import {
  TeamRepository,
  type TeamRepositoryInterface,
} from "@/lib/repositories/team.repository";
import type { Match } from "@/lib/effect/schemas";
import {
  getFirstTeamStripData,
  getTeamMatches,
  pickFirstTeamPsdId,
  RESULT_RECENCY_MS,
} from "./match-data";

const runPromiseMock = vi.mocked(runPromise);

const NOW = new Date("2026-08-06T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);
const hoursAhead = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000);

const TEAMS = [
  { psdId: "222", age: "U15", slug: "u15" },
  { psdId: "111", age: null, slug: "eerste-elftallen-a" },
  { psdId: "112", age: null, slug: "eerste-elftallen-b" },
];

/**
 * First call resolves the team list, second the A side's season feed.
 *
 * `matches` is typed `readonly Match[]` (#2802 review), not `unknown` — a
 * fixture missing `home_team`/`away_team` is exactly the shape `matchSlot`
 * (`first-teams.ts`) crashed on before it grew defensive `?.`s, and an
 * `unknown` seam let every fixture below skip that check silently.
 */
function mockFetches(teams: unknown, matches: readonly Match[]) {
  runPromiseMock.mockResolvedValueOnce(teams).mockResolvedValueOnce(matches);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pickFirstTeamPsdId", () => {
  it("picks the A side, not the B side or a youth team", () => {
    expect(pickFirstTeamPsdId(TEAMS)).toBe(111);
  });

  it("ignores senior teams without a psdId", () => {
    expect(
      pickFirstTeamPsdId([
        { psdId: null, age: null, slug: "eerste-elftallen-a" },
        { psdId: "112", age: null, slug: "eerste-elftallen-b" },
      ]),
    ).toBe(112);
  });

  it("returns null when only youth teams carry a psdId", () => {
    expect(
      pickFirstTeamPsdId([{ psdId: "999", age: "U21", slug: "u21" }]),
    ).toBe(null);
  });
});

describe("getTeamMatches", () => {
  it("returns the team's season feed", async () => {
    runPromiseMock.mockResolvedValueOnce([{ id: 7 }]);

    await expect(getTeamMatches(111)).resolves.toEqual([{ id: 7 }]);
  });

  // The dedupe itself is React's `cache()`, mocked to a passthrough here. What
  // this module owns is the contract around it: the helper stays unopinionated
  // about failure so each call site can pick its own fallback — the homepage
  // needs `null` to tell an outage from an empty feed (#2399), the strip drops
  // silently.
  it("rejects rather than swallowing a BFF failure", async () => {
    runPromiseMock.mockRejectedValueOnce(new Error("BFF down"));

    await expect(getTeamMatches(111)).rejects.toThrow("BFF down");
  });
});

describe("getFirstTeamStripData", () => {
  it("returns the last result and the next fixture", async () => {
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "finished",
        date: hoursAgo(24),
        home_team: {},
        away_team: {},
      },
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(48),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result?.id).toBe(1);
    expect(data?.fixture?.id).toBe(2);
  });

  it("degrades a failed Sanity teams read in-effect, so runPromise never sees a defect (#3135)", async () => {
    // At build, a Sanity defect reaching `runPromise` bails the whole page to
    // on-demand rendering — too much for a strip. Run the real effect against
    // a failing repository: it must resolve to "no teams", not reject.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    runPromiseMock.mockImplementationOnce((effect) =>
      Effect.runPromise(
        effect.pipe(
          Effect.provide(
            Layer.succeed(TeamRepository, {
              findAll: () =>
                Effect.fail(
                  new SanityReadError({ cause: new Error("HTTP 503") }),
                ),
            } as unknown as TeamRepositoryInterface),
          ),
        ) as Effect.Effect<unknown>,
      ),
    );

    expect(await getFirstTeamStripData()).toBeNull();
    // `null` alone would also come out of the outer `try/catch`; the point is
    // that the read itself resolved.
    await expect(runPromiseMock.mock.results[0]!.value).resolves.toEqual([]);
    warn.mockRestore();
  });

  it("runs exactly two fetches: the team list, then that team's feed", async () => {
    mockFetches(TEAMS, [
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(48),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    await getFirstTeamStripData();

    // Which psdId is selected is asserted directly against `pickFirstTeamPsdId`
    // above; `runPromise` is mocked here, so the Effect never reaches the BFF.
    expect(runPromiseMock).toHaveBeenCalledTimes(2);
  });

  it("drops a result older than the recency window", async () => {
    const staleHours = RESULT_RECENCY_MS / (60 * 60 * 1000) + 1;
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "finished",
        date: hoursAgo(staleHours),
        home_team: {},
        away_team: {},
      },
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(48),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result).toBeNull();
    expect(data?.fixture?.id).toBe(2);
  });

  it("never headlines a pitch reservation as the last result (#2688)", async () => {
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "scheduled",
        date: hoursAgo(24),
        is_placeholder: true,
        home_team: {},
        away_team: {},
      },
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(48),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result).toBeNull();
  });

  it("keeps a result exactly on the recency boundary", async () => {
    const edgeHours = RESULT_RECENCY_MS / (60 * 60 * 1000);
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "finished",
        date: hoursAgo(edgeHours),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result?.id).toBe(1);
  });

  it("keeps last weekend's result across a bye weekend", async () => {
    // The one absolute-valued assertion in this file, deliberately: every other
    // window test derives its dates from `RESULT_RECENCY_MS`, so all of them
    // still pass if the constant is narrowed. This one fails — which is the
    // point, since the window's whole job is to outlast a gap in the calendar.
    // Ten days back is a fortnight-ago Saturday seen from the next weekend.
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "finished",
        date: hoursAgo(10 * 24),
        home_team: {},
        away_team: {},
      },
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(48),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result?.id).toBe(1);
    expect(data?.fixture?.id).toBe(2);
  });

  it("returns the fixture alone when there is no recent result", async () => {
    mockFetches(TEAMS, [
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(6),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data).toEqual({
      result: null,
      fixture: { id: 2, date: expect.any(Date) },
    });
  });

  it("returns the result alone when there is no upcoming fixture", async () => {
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "finished",
        date: hoursAgo(2),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result?.id).toBe(1);
    expect(data?.fixture).toBeNull();
  });

  it("headlines a forfeit settled before its kickoff (#2423)", async () => {
    // The strip shares `pickLastResult` with <FirstTeamsBlock>; a forfeit
    // awarded hours ahead of kickoff is inside the recency window by
    // definition, so it must reach the strip rather than fall through it.
    mockFetches(TEAMS, [
      {
        id: 1,
        status: "forfeited",
        date: hoursAhead(8),
        home_team: { score: 5 },
        away_team: { score: 0 },
      },
      {
        id: 2,
        status: "scheduled",
        date: hoursAhead(48),
        home_team: {},
        away_team: {},
      },
    ] as Match[]);

    const data = await getFirstTeamStripData();

    expect(data?.result?.id).toBe(1);
    expect(data?.fixture?.id).toBe(2);
  });

  it("returns null when the feed has neither side", async () => {
    mockFetches(TEAMS, []);
    expect(await getFirstTeamStripData()).toBeNull();
  });

  it("returns null when no senior team carries a psdId", async () => {
    mockFetches([{ psdId: null, age: null, slug: "eerste-elftallen-a" }], []);
    expect(await getFirstTeamStripData()).toBeNull();
  });

  it("ignores youth teams when picking the first team", async () => {
    mockFetches([{ psdId: "999", age: "U21", slug: "u21" }], []);
    expect(await getFirstTeamStripData()).toBeNull();
  });

  it("returns null when a fetch fails", async () => {
    runPromiseMock.mockRejectedValue(new Error("BFF down"));
    expect(await getFirstTeamStripData()).toBeNull();
  });
});
