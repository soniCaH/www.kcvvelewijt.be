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
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { KvCacheLive, TypedKvCache } from "../cache/kv-cache";
import { PsdGateLive } from "./gate";
import { WorkerEnvTag } from "../env";
import { makeTestEnv } from "../test-helpers/env-layer";

/** A fresh DO instance per test (unique `idFromName`) — isolates single-flight
 * state the same way the node suite isolates it with `new GateLogic()`. */
function freshGateStub(name: string) {
  const id = env.PSD_GATE.idFromName(name);
  return env.PSD_GATE.get(id) as unknown as {
    acquireToken(): Promise<void>;
    beginFlight(key: string): Promise<boolean>;
    endFlight(key: string): Promise<void>;
    awaitFlight(key: string): Promise<void>;
  };
}

describe("PsdGate Durable Object — real single-flight coordination (workerd)", () => {
  it("exactly one of N concurrent callers becomes the leader", async () => {
    const gate = freshGateStub(`leader-${Math.random()}`);
    const results = await Promise.all(
      Array.from({ length: 20 }, () => gate.beginFlight("key")),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("a second beginFlight for a DIFFERENT key is independently a leader", async () => {
    const gate = freshGateStub(`independent-keys-${Math.random()}`);
    expect(await gate.beginFlight("a")).toBe(true);
    expect(await gate.beginFlight("b")).toBe(true);
  });

  it("awaitFlight blocks until the leader calls endFlight, then resolves", async () => {
    const gate = freshGateStub(`await-${Math.random()}`);
    expect(await gate.beginFlight("key")).toBe(true);

    let resolved = false;
    const waiter = gate.awaitFlight("key").then(() => {
      resolved = true;
    });

    // Give the waiter a moment to actually start waiting — it must NOT have
    // resolved yet, since the leader hasn't ended the flight.
    await new Promise((r) => setTimeout(r, 20));
    expect(resolved).toBe(false);

    await gate.endFlight("key");
    await waiter;
    expect(resolved).toBe(true);
  });

  it("acquireToken resolves — the RPC + constructor path works end-to-end", async () => {
    const gate = freshGateStub(`token-${Math.random()}`);
    await expect(gate.acquireToken()).resolves.toBeUndefined();
  });
});

describe("TypedKvCache single-flight — real KV + real Durable Object together (workerd)", () => {
  const TestSchema = S.Struct({ name: S.String, value: S.Number });

  it("N concurrent cache misses collapse to ONE fetch, end-to-end", async () => {
    const key = `workerd:single-flight:${Math.random()}`;
    const realEnvLayer = Layer.succeed(
      WorkerEnvTag,
      makeTestEnv({ PSD_CACHE: env.PSD_CACHE, PSD_GATE: env.PSD_GATE }),
    );

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
