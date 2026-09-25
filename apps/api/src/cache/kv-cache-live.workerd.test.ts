/**
 * `KvCacheLive` and `makeDurableKv` against the REAL PSD_CACHE binding
 * (Miniflare's KV emulation, via @cloudflare/vitest-plugin — see
 * vitest.workers.config.ts and wrangler.workerd-test.jsonc).
 *
 * kv-cache.test.ts already covers every business rule of `TypedKvCache`
 * against a hand-rolled `Map`-backed fake KV (deliberately — see the split
 * rule in apps/api/README.md: that fake exists to test OUR OWN logic, and a
 * hand-rolled JS object is a perfectly good stand-in for it). What that fake
 * can never prove is that `KvCacheLive`'s calls are actually shaped the way
 * the real KV API expects — `expirationTtl` really attached, a real
 * `list()` page really shaped the way `makeDurableKv` assumes. That's what
 * these tests are for.
 */
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { KvCacheService, KvCacheLive, makeDurableKv } from "./kv-cache";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

/** Real env layer: every field is the usual test default EXCEPT `PSD_CACHE`,
 * which is the actual Miniflare KV binding — the one thing these tests
 * exist to exercise for real. */
const realKvEnvLayer = makeTestEnvLayer({ PSD_CACHE: env.PSD_CACHE });

describe("KvCacheLive — real KV binding (workerd)", () => {
  it("writes and reads back a value", async () => {
    const key = "workerd:kv-cache-live:round-trip";
    await Effect.runPromise(
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        yield* cache.set(key, "hello", 300);
        expect(yield* cache.get(key)).toBe("hello");
      }).pipe(Effect.provide(KvCacheLive), Effect.provide(realKvEnvLayer)),
    );
  });

  it("returns null for a key that was never written", async () => {
    // Asserts the raw binding, not `KvCacheService.get` — that wrapper
    // `orElseSucceed`s every failure to `null` too (by design, see
    // KvCacheLive), so going through it here couldn't tell "the real
    // binding legitimately has no such key" apart from "the real binding
    // call blew up and got papered over."
    const result = await env.PSD_CACHE.get(
      "workerd:kv-cache-live:never-written",
    );
    expect(result).toBeNull();
  });

  it("delete actually removes the key from the real binding", async () => {
    const key = "workerd:kv-cache-live:delete-me";
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        yield* cache.set(key, "temporary", 300);
        yield* cache.delete(key);
        return yield* cache.get(key);
      }).pipe(Effect.provide(KvCacheLive), Effect.provide(realKvEnvLayer)),
    );
    expect(result).toBeNull();
  });

  it("attaches a real expirationTtl — visible on the key's list() metadata", async () => {
    // Real KV enforces a 60s minimum TTL — this is also why kv-cache.test.ts's
    // fake (which ignores TTL entirely) can never catch a wrong value here.
    const key = "workerd:kv-cache-live:expiry";
    const ttlSeconds = 300;
    const before = Math.floor(Date.now() / 1000);

    await Effect.runPromise(
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        yield* cache.set(key, "expires-soon", ttlSeconds);
      }).pipe(Effect.provide(KvCacheLive), Effect.provide(realKvEnvLayer)),
    );

    const page = await env.PSD_CACHE.list({ prefix: key });
    const entry = page.keys.find((k) => k.name === key);
    expect(entry).toBeDefined();
    // `expiration` is a Unix-epoch-seconds timestamp KV attaches only when a
    // TTL was actually passed through — absence would mean `set` silently
    // wrote a forever key instead of a TTL'd one.
    expect(entry?.expiration).toBeGreaterThanOrEqual(before + ttlSeconds);
    // Loose upper bound — proves it's ~ttlSeconds out, not e.g. accidentally
    // milliseconds-since-epoch or some other unit mismatch.
    expect(entry?.expiration).toBeLessThan(before + ttlSeconds + 60);
  });

  it("increment starts today's counter at 1, then adds on top", async () => {
    // Captured BEFORE the increments: reading `new Date()` afterwards would
    // flake the rare run that straddles a UTC midnight rollover, since
    // `increment`'s own key is built from the date at write time.
    const d = new Date();
    const dayKey = `psd:calls:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    await Effect.runPromise(
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        yield* cache.increment();
        yield* cache.increment(4);
      }).pipe(Effect.provide(KvCacheLive), Effect.provide(realKvEnvLayer)),
    );

    expect(await env.PSD_CACHE.get(dayKey)).toBe("5");
  });
});

describe("makeDurableKv — real KV binding (workerd)", () => {
  it("setForever writes with no expiry at all", async () => {
    const key = "workerd:durable-kv:forever";
    const durable = makeDurableKv(env.PSD_CACHE);
    await Effect.runPromise(durable.setForever(key, "permanent"));

    const page = await env.PSD_CACHE.list({ prefix: key });
    const entry = page.keys.find((k) => k.name === key);
    expect(entry).toBeDefined();
    expect(entry?.expiration).toBeUndefined();
  });

  it("list returns real KV list() results in the port's shape", async () => {
    // Single page only: makeDurableKv's `list` (kv-cache.ts) forwards just
    // `{ prefix, cursor }` to the real KVNamespace.list() call — it takes
    // no `limit`, so this test cannot force (and does not claim to prove)
    // real multi-page cursor-following. That loop's own logic — draining
    // pages in order until `list_complete` — is covered on `node` against a
    // mock that CAN force a small page size (kv-cache.test.ts, "list drains
    // every page in order until list_complete").
    const prefix = "workerd:durable-kv:list:";
    const durable = makeDurableKv(env.PSD_CACHE);
    await Effect.runPromise(
      Effect.all(
        [1, 2, 3].map((n) => durable.setForever(`${prefix}${n}`, String(n))),
        { concurrency: "unbounded" },
      ),
    );

    const page = await Effect.runPromise(durable.list({ prefix }));
    expect(page.complete).toBe(true);
    expect([...page.keys].sort()).toEqual([
      `${prefix}1`,
      `${prefix}2`,
      `${prefix}3`,
    ]);
  });
});
