/**
 * `PsdGate` (gate-do.ts) against the REAL Durable Object binding — via
 * @cloudflare/vitest-plugin, see vitest.workers.config.ts and
 * wrangler.workerd-test.jsonc.
 *
 * gate-do.ts's own doc comment says why this file has to exist: it "imports
 * `cloudflare:workers`, so it must only ever be imported by the worker
 * entry, never by code the Node tests load" — meaning this class had ZERO
 * test coverage before #3145, at any layer. `gate-logic.test.ts` covers
 * `GateLogic`'s pacing/single-flight rules as pure logic (fake scheduler, no
 * DO); what it can't prove is that the thin `PsdGate` DO wrapper itself
 * actually works once the real runtime instantiates it — a real
 * `DurableObjectNamespace` binding, real RPC method calls on the stub
 * (exactly how `psd/gate.ts`'s `PsdGateLive` calls it in production), a real
 * `durable_objects` migration.
 */
import { abortAllDurableObjects, env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { Effect, Schema as S } from "effect";
import { KvCacheLive, TypedKvCache } from "../cache/kv-cache";
import { PsdGateLive, PsdGateService } from "./gate";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

/** A fresh DO instance per test (unique `idFromName`) — isolates single-flight
 * state the same way the node suite isolates it with `new GateLogic()`.
 * No cast needed: `env.PSD_GATE` is already typed as
 * `DurableObjectNamespace<PsdGate>` (workerd-test-env.d.ts), so the stub's
 * RPC methods are typed structurally off `PsdGate` itself. */
function freshGateStub(name: string) {
  const id = env.PSD_GATE.idFromName(name);
  return env.PSD_GATE.get(id);
}

describe("PsdGate Durable Object — real single-flight coordination (workerd)", () => {
  it("exactly one of N concurrent callers becomes the leader", async () => {
    const gate = freshGateStub(`leader-${Math.random()}`);
    const results = await Promise.all(
      Array.from({ length: 20 }, () => gate.beginFlight("key")),
    );
    expect(results.filter((t) => t !== null)).toHaveLength(1);
  });

  it("a second beginFlight for a DIFFERENT key is independently a leader", async () => {
    const gate = freshGateStub(`independent-keys-${Math.random()}`);
    expect(await gate.beginFlight("a")).not.toBeNull();
    expect(await gate.beginFlight("b")).not.toBeNull();
  });

  it("awaitFlight blocks until the leader calls endFlight, then resolves", async () => {
    const gate = freshGateStub(`await-${Math.random()}`);
    const token = await gate.beginFlight("key");
    expect(token).not.toBeNull();

    let resolved = false;
    const waiter = gate.awaitFlight("key").then(() => {
      resolved = true;
    });

    // Give the waiter a moment to actually start waiting — it must NOT have
    // resolved yet, since the leader hasn't ended the flight.
    await new Promise((r) => setTimeout(r, 20));
    expect(resolved).toBe(false);

    await gate.endFlight("key", token!);
    await waiter;
    expect(resolved).toBe(true);
  });

  it("acquireToken resolves — the RPC + constructor path works end-to-end", async () => {
    const gate = freshGateStub(`token-${Math.random()}`);
    await expect(gate.acquireToken()).resolves.toBeUndefined();
  });
});

describe("PsdGate Durable Object — daily PSD call count (workerd, #3490)", () => {
  it("equals the number of acquireToken grants under concurrent load", async () => {
    const gate = freshGateStub(`count-load-${Math.random()}`);
    await Promise.all(Array.from({ length: 8 }, () => gate.acquireToken()));
    expect(await gate.getDailyCount()).toBe(8);
  });

  it("reading the count takes no token and counts nothing", async () => {
    const gate = freshGateStub(`count-read-${Math.random()}`);
    await gate.acquireToken();
    expect(await gate.getDailyCount()).toBe(1);
    expect(await gate.getDailyCount()).toBe(1);
  });

  it("survives a DO restart (read back from ctx.storage)", async () => {
    const name = `count-restart-${Math.random()}`;
    const before = freshGateStub(name);
    await Promise.all(Array.from({ length: 6 }, () => before.acquireToken()));
    await abortAllDurableObjects();
    expect(await freshGateStub(name).getDailyCount()).toBe(6);
    await freshGateStub(name).acquireToken();
    expect(await freshGateStub(name).getDailyCount()).toBe(7);
  });

  it("PsdGateLive.getDailyCount reads the same count through the Effect service", async () => {
    const stub = freshGateStub("global");
    await stub.acquireToken();
    const layer = makeTestEnvLayer({
      PSD_CACHE: env.PSD_CACHE,
      PSD_GATE: env.PSD_GATE,
    });
    const count = await Effect.runPromise(
      Effect.gen(function* () {
        const gate = yield* PsdGateService;
        return yield* gate.getDailyCount;
      }).pipe(Effect.provide(PsdGateLive), Effect.provide(layer)),
    );
    expect(count).toBe(await stub.getDailyCount());
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

describe("TypedKvCache single-flight — real KV + real Durable Object together (workerd)", () => {
  const TestSchema = S.Struct({ name: S.String, value: S.Number });

  it("N concurrent cache misses collapse to ONE fetch, end-to-end", async () => {
    const key = `workerd:single-flight:${Math.random()}`;
    const realEnvLayer = makeTestEnvLayer({
      PSD_CACHE: env.PSD_CACHE,
      PSD_GATE: env.PSD_GATE,
    });

    let fanOuts = 0;
    const fetchEffect = Effect.gen(function* () {
      fanOuts++;
      // Give every concurrent caller a chance to pass the miss check before
      // the leader finishes and writes KV — same reasoning as the node
      // suite's mock-backed equivalent.
      yield* Effect.sleep("20 millis");
      return { name: "fetched", value: 1 };
    });

    const typedCache = TypedKvCache(TestSchema);
    const run = () =>
      Effect.runPromise(
        typedCache
          .getOrFetch(key, fetchEffect, 300)
          .pipe(
            Effect.provide(KvCacheLive),
            Effect.provide(PsdGateLive),
            Effect.provide(realEnvLayer),
          ),
      );

    const results = await Promise.all(Array.from({ length: 10 }, run));

    for (const r of results) expect(r).toEqual({ name: "fetched", value: 1 });
    expect(fanOuts).toBe(1);
  });
});
