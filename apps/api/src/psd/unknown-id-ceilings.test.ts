/**
 * #3468: an unknown id must cost PSD one call, not one call per request.
 * Every id-keyed route ends in a cached empty value or a cached not-found
 * marker. Real handlers, real PsdServiceLive, real KvCacheLive over an
 * in-memory KV; only PSD's HTTP (`fetch`) is faked, with the shapes PSD
 * answers an unknown id with (apps/api/CLAUDE.md, PSD notes).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import { type PsdService, PsdServiceLive } from "./service";
import { type PsdGateService, PsdGateTest } from "./gate";
import { type KvCacheService, KvCacheLive } from "../cache/kv-cache";
import type { WorkerEnvTag } from "../env";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { makeSanityProjectionStub } from "../test-helpers/sanity-projection-stub";
import { SanityProjection } from "../sanity/projection";
import {
  getMatchDetailHandler,
  getMatchesByTeamHandler,
  getPlayerStatsHandler,
} from "../handlers/matches";
import { getRankingHandler } from "../handlers/ranking";
import { getOpponentHistoryHandler } from "../handlers/opponent";

const UNKNOWN = 999999;

const seasons = [
  {
    id: 42,
    name: "current",
    start: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  },
  {
    id: 41,
    name: "previous",
    start: new Date(Date.now() - 400 * 86_400_000).toISOString(),
    end: new Date(Date.now() - 31 * 86_400_000).toISOString(),
  },
];

/** PSD as it answers an unknown id, per endpoint. */
const psd = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
  const path = new URL(String(input)).pathname;
  if (path === "/seasons") return Response.json(seasons);
  if (path === "/competitions") return Response.json([]);
  if (path === "/teams") return Response.json([]);
  if (/^\/games\/team\/\d+\/seasons\/\d+$/.test(path))
    return Response.json({ content: [] }); // list endpoint: 200 []
  if (/^\/games\/\d+\/info$/.test(path)) return new Response(""); // 200, empty body
  if (/^\/teams\/\d+\/ranking$/.test(path))
    return new Response("", { status: 404, statusText: "Not Found" });
  if (path.startsWith("/statistics/player/")) return new Response(""); // 200, empty body
  throw new Error(`unexpected PSD call: ${path}`);
});

const callsTo = (fragment: string) =>
  psd.mock.calls.filter(([u]) => String(u).includes(fragment)).length;

const sanity = makeSanityProjectionStub();

function makeKv() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
  } as unknown as KVNamespace;
}

let kv: KVNamespace;

const run = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    PsdService | KvCacheService | WorkerEnvTag | PsdGateService
  >,
) => {
  const env = makeTestEnvLayer({ PSD_CACHE: kv });
  const base = Layer.mergeAll(KvCacheLive, PsdGateTest).pipe(
    Layer.provideMerge(env),
  );
  const layer = PsdServiceLive.pipe(
    Layer.provideMerge(base),
    Layer.provide(Layer.succeed(SanityProjection, sanity)),
  );
  return Effect.runPromise(Effect.either(Effect.provide(effect, layer)));
};

beforeEach(() => {
  kv = makeKv();
  psd.mockClear();
  vi.stubGlobal("fetch", psd);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("an unknown id requested twice costs one PSD call (#3468)", () => {
  it("/matches/:teamId", async () => {
    await run(getMatchesByTeamHandler(UNKNOWN));
    await run(getMatchesByTeamHandler(UNKNOWN));
    expect(callsTo(`/games/team/${UNKNOWN}/`)).toBe(1);
  });

  it("/match/:matchId/detail", async () => {
    const first = await run(getMatchDetailHandler(UNKNOWN));
    const second = await run(getMatchDetailHandler(UNKNOWN));
    expect(callsTo(`/games/${UNKNOWN}/info`)).toBe(1);
    expect(first).toMatchObject({ left: { _tag: "ResourceNotFound" } });
    expect(second).toMatchObject({ left: { _tag: "ResourceNotFound" } });
  });

  it("/ranking/:teamId", async () => {
    await run(getRankingHandler(UNKNOWN));
    await run(getRankingHandler(UNKNOWN));
    expect(callsTo(`/teams/${UNKNOWN}/ranking`)).toBe(1);
    // The marker must not hide the handler's own 24 h "no table" note.
    expect(await kv.get(`ranking:none:team:${UNKNOWN}`)).not.toBeNull();
  });

  it("/statistics/player/:memberId", async () => {
    const first = await run(getPlayerStatsHandler(UNKNOWN));
    const second = await run(getPlayerStatsHandler(UNKNOWN));
    expect(callsTo(`/statistics/player/${UNKNOWN}/`)).toBe(1);
    expect(first).toMatchObject({ left: { _tag: "ResourceNotFound" } });
    expect(second).toMatchObject({ left: { _tag: "ResourceNotFound" } });
  });

  it("/matches/opponent/:teamId/:clubId", async () => {
    await run(getOpponentHistoryHandler(UNKNOWN, UNKNOWN));
    const afterFirst = psd.mock.calls.length;
    const second = await run(getOpponentHistoryHandler(UNKNOWN, UNKNOWN));
    // First: one games call per season; repeat: nothing at all.
    expect(callsTo(`/games/team/${UNKNOWN}/`)).toBe(seasons.length);
    expect(psd.mock.calls.length).toBe(afterFirst);
    expect(second).toMatchObject({ left: { _tag: "ResourceNotFound" } });
  });
});

describe("/seasons is cached for 24 h (#3468)", () => {
  it("two opponent lookups for different clubs fetch it once", async () => {
    await run(getOpponentHistoryHandler(1, 456));
    await run(getOpponentHistoryHandler(1, 789));
    expect(
      psd.mock.calls.filter(([u]) => new URL(String(u)).pathname === "/seasons")
        .length,
    ).toBe(1);
  });
});
