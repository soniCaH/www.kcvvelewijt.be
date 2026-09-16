import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { PsdTeamClient, PsdTeamClientLive } from "./psd-team-client";
import { PsdGateService } from "../psd/gate";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

global.fetch = vi.fn();

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
  durable: noopDurableKv,
};

/**
 * Every fetch must be covered by a token taken BEFORE it. Under `paginateAll`'s
 * `concurrency: 3` the trace does not strictly alternate, so the invariant is
 * the prefix one: at no point may fetches outnumber tokens.
 *
 * Counting alone is not enough — moving `gate.acquireToken` after `fetchJson`
 * (PSD hit first, paced afterwards: the exact defect #2867 fixes) yields the
 * same totals and would pass a count assertion.
 */
function expectEveryFetchPaced(trace: string[]) {
  let tokens = 0;
  let fetches = 0;
  for (const [i, event] of trace.entries()) {
    if (event === "token") tokens += 1;
    else fetches += 1;
    // Reported as a trace slice so a failure shows where pacing was lost.
    expect(
      fetches <= tokens ? "paced" : `unpaced at [${trace.slice(0, i + 1)}]`,
    ).toBe("paced");
  }
}

/**
 * Gate that records every token grant into a shared trace, so a test can assert
 * both HOW MANY tokens a call path takes and that each one precedes its fetch.
 */
function makeCountingGate(trace: string[]) {
  return Layer.succeed(PsdGateService, {
    acquireToken: Effect.sync(() => {
      trace.push("token");
    }),
    beginFlight: () => Effect.succeed(true),
    endFlight: () => Effect.succeed(undefined),
    awaitFlight: () => Effect.succeed(undefined),
    reportOutcome: () => Effect.succeed({ incidentOpen: false }),
  });
}

const TEAM = {
  id: 1,
  name: "Team A",
  age: "A",
  gender: "mannen",
  footbelId: 100,
  active: true,
};

const MEMBER = {
  id: 6453,
  firstName: "Jan",
  lastName: "Peeters",
  birthDate: "1990-01-01",
  nationality: "BE",
  profilePictureURL: null,
  keeper: false,
  bestPosition: null,
  active: true,
  status: "speler",
  functionTitle: null,
};

const membersPage = (totalPages: number) => ({
  content: [MEMBER],
  totalElements: totalPages,
  totalPages,
});

/** Every fetch appends to the trace, so token/fetch interleaving is observable. */
function stubFetch(trace: string[], bodies: unknown[]) {
  const mock = global.fetch as ReturnType<typeof vi.fn>;
  for (const body of bodies) {
    mock.mockImplementationOnce(() => {
      trace.push("fetch");
      return Promise.resolve({ ok: true, json: async () => body } as Response);
    });
  }
}

function run<A, E>(
  program: Effect.Effect<A, E, PsdTeamClient>,
  trace: string[],
) {
  return Effect.runPromise(
    program.pipe(
      Effect.provide(PsdTeamClientLive),
      Effect.provide(makeCountingGate(trace)),
      Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      Effect.provide(makeTestEnvLayer()),
    ),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe("PsdTeamClient gate pacing", () => {
  it("takes one gate token for getRawTeams, before the fetch", async () => {
    const trace: string[] = [];
    stubFetch(trace, [[TEAM]]);

    const teams = await run(
      Effect.flatMap(PsdTeamClient, (client) => client.getRawTeams()),
      trace,
    );

    expect(teams).toHaveLength(1);
    expect(trace).toEqual(["token", "fetch"]);
    expectEveryFetchPaced(trace);
  });

  it("takes one token per page across a paginated getRawMembers", async () => {
    const trace: string[] = [];
    // Page 0 announces 3 pages; paginateAll then fetches pages 1 and 2 at
    // concurrency 3 — every one of them must still be paced.
    stubFetch(trace, [membersPage(3), membersPage(3), membersPage(3)]);

    const members = await run(
      Effect.flatMap(PsdTeamClient, (client) => client.getRawMembers(1)),
      trace,
    );

    expect(members).toHaveLength(3);
    expect(trace.filter((e) => e === "token")).toHaveLength(3);
    expect(trace.filter((e) => e === "fetch")).toHaveLength(3);
    expectEveryFetchPaced(trace);
  });

  it("takes one token per page across a paginated getRawStaff", async () => {
    const trace: string[] = [];
    stubFetch(trace, [membersPage(2), membersPage(2)]);

    await run(
      Effect.flatMap(PsdTeamClient, (client) => client.getRawStaff(1)),
      trace,
    );

    expect(trace.filter((e) => e === "token")).toHaveLength(2);
    expectEveryFetchPaced(trace);
  });
});
