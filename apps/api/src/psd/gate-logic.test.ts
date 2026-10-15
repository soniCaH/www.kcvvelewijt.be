import { describe, it, expect } from "vitest";
import { GateLogic } from "./gate-logic";

/**
 * Deterministic fake scheduler: `now()` reads a mutable clock, `sleep(ms)`
 * advances it and resolves on a microtask. Lets us assert the gate's pacing
 * without real timers.
 *
 * The yield before advancing matters: time must pass when a sleep COMPLETES,
 * not when it starts. Advancing at call time would bill each grant for the
 * cooldown chained behind it, hiding the difference between "granted now" and
 * "granted one cooldown from now".
 */
function fakeScheduler() {
  let clock = 0;
  return {
    now: () => clock,
    sleep: async (ms: number) => {
      await Promise.resolve();
      clock += ms;
    },
    get clock() {
      return clock;
    },
  };
}

/** Clock reading at the moment each of `n` sequential grants completes. */
async function grantTimes(
  gate: GateLogic,
  clock: () => number,
  n: number,
): Promise<number[]> {
  const at: number[] = [];
  for (let i = 0; i < n; i++) {
    await gate.acquireToken();
    at.push(clock());
  }
  return at;
}

/** 20 grants paced at 5/s: the full index fan-out, first at 0ms, last at 3800ms. */
const PACED_20 = Array.from({ length: 20 }, (_, i) => i * 200);

describe("GateLogic — call pacing", () => {
  it("throttles sustained demand to rate per second", async () => {
    const s = fakeScheduler();
    const gate = new GateLogic({
      ratePerSecond: 5,
      now: s.now,
      sleep: s.sleep,
    });

    // Grant times only. An idle gate owes the first caller nothing, and the
    // cooldown trailing the last grant is nobody's wait — billing either would
    // pass a gate that made every call queue behind a cooldown it never needed.
    // (No burst allowance: even spacing hits the same 5/s throughput.)
    expect(await grantTimes(gate, () => s.clock, 20)).toEqual(PACED_20);
  });

  it("keeps pacing when the clock never advances (Durable Object freezes Date.now)", async () => {
    // A DO advances `Date.now()` only on I/O; while every caller sleeps in
    // acquireToken there is none. A clock-driven bucket starves here — this
    // whole fan-out must still complete, and stay evenly paced, off relative
    // sleeps alone. `now()` is frozen; the scheduler's clock only tracks sleeps.
    const s = fakeScheduler();
    const gate = new GateLogic({
      ratePerSecond: 5,
      now: () => 0,
      sleep: s.sleep,
    });

    expect(await grantTimes(gate, () => s.clock, 20)).toEqual(PACED_20);
  });
});

describe("GateLogic — single-flight", () => {
  it("elects exactly one leader among concurrent callers for a key", () => {
    const gate = new GateLogic();
    const results = Array.from({ length: 50 }, () =>
      gate.beginFlight("matches:next"),
    );
    expect(results.filter((t) => t !== null)).toHaveLength(1);
  });

  it("a different key gets its own leader", () => {
    const gate = new GateLogic();
    expect(gate.beginFlight("a")).not.toBeNull();
    expect(gate.beginFlight("b")).not.toBeNull();
    expect(gate.beginFlight("a")).toBeNull();
  });

  it("endFlight releases the key so a later caller can lead again", () => {
    const gate = new GateLogic();
    const token = gate.beginFlight("k")!;
    expect(gate.beginFlight("k")).toBeNull();
    gate.endFlight("k", token);
    expect(gate.beginFlight("k")).not.toBeNull();
  });

  it("an old leader's endFlight cannot release a newer leader's flight (#3467)", async () => {
    let clock = 0;
    const gate = new GateLogic({ now: () => clock, leaseMs: 1000 });
    const oldToken = gate.beginFlight("k")!;

    clock += 1500; // old leader outruns its lease; a new leader reclaims
    const newToken = gate.beginFlight("k")!;
    expect(newToken).not.toBe(oldToken);

    let released = false;
    const waiter = gate.awaitFlight("k").then(() => {
      released = true;
    });

    gate.endFlight("k", oldToken); // stale owner: must be a no-op
    await Promise.resolve();
    expect(released).toBe(false);
    expect(gate.isInFlight("k")).toBe(true);
    expect(gate.beginFlight("k")).toBeNull(); // new leader still holds it

    gate.endFlight("k", newToken);
    await waiter;
    expect(released).toBe(true);
    expect(gate.isInFlight("k")).toBe(false);
  });

  it("awaitFlight resolves when the leader ends its flight", async () => {
    const gate = new GateLogic();
    const token = gate.beginFlight("k")!;

    let resolved = false;
    const waiter = gate.awaitFlight("k").then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false); // still in flight

    gate.endFlight("k", token);
    await waiter;
    expect(resolved).toBe(true);
  });

  it("awaitFlight for an idle key resolves immediately", async () => {
    const gate = new GateLogic();
    await expect(gate.awaitFlight("idle")).resolves.toBeUndefined();
  });

  it("awaitFlight gives up after the lease if the leader never ends", async () => {
    // Dead-leader guard: a leader killed before endFlight must not hang waiters.
    const gate = new GateLogic({ leaseMs: 20 });
    gate.beginFlight("k"); // leader never calls endFlight
    await expect(gate.awaitFlight("k")).resolves.toBeUndefined();
  });

  it("reclaims leadership after the lease expires (dead-leader guard)", () => {
    let clock = 0;
    const gate = new GateLogic({ now: () => clock, leaseMs: 1000 });

    expect(gate.beginFlight("k")).not.toBeNull();
    expect(gate.beginFlight("k")).toBeNull(); // live leader holds it
    expect(gate.isInFlight("k")).toBe(true);

    clock += 1500; // leader died without endFlight; lease lapses

    expect(gate.isInFlight("k")).toBe(false);
    expect(gate.beginFlight("k")).not.toBeNull(); // reclaimed by the next caller
  });

  it("reclaiming a lapsed flight wakes anyone still awaiting it", async () => {
    let clock = 0;
    const gate = new GateLogic({ now: () => clock, leaseMs: 1000 });
    gate.beginFlight("k");

    let woken = false;
    const waiter = gate.awaitFlight("k").then(() => {
      woken = true;
    });
    await Promise.resolve();
    expect(woken).toBe(false);

    clock += 1500;
    gate.beginFlight("k"); // reclaim → resolves the abandoned flight's promise
    await waiter;
    expect(woken).toBe(true);
  });

  it("N concurrent misses coalesce onto ONE fan-out", async () => {
    const gate = new GateLogic();
    let fanOuts = 0;

    // Each caller: if leader → run the (single) fan-out; else await + reuse.
    const caller = async () => {
      const token = gate.beginFlight("matches:next");
      if (token !== null) {
        fanOuts++;
        await Promise.resolve(); // simulate async fan-out
        gate.endFlight("matches:next", token);
      } else {
        await gate.awaitFlight("matches:next");
      }
    };

    await Promise.all(Array.from({ length: 30 }, caller));
    expect(fanOuts).toBe(1);
  });
});

describe("GateLogic — daily PSD call count (#3490)", () => {
  const DAY1 = Date.UTC(2026, 9, 15, 23, 59, 59);
  const DAY2 = Date.UTC(2026, 9, 16, 0, 0, 1);

  it("counts one call per acquireToken grant", async () => {
    const gate = new GateLogic({ ratePerSecond: 1e9 });
    await Promise.all(Array.from({ length: 12 }, () => gate.acquireToken()));
    expect(gate.getDailyCount()).toBe(12);
  });

  it("reading the count takes no token and counts nothing", async () => {
    const s = fakeScheduler();
    const gate = new GateLogic({
      ratePerSecond: 5,
      now: s.now,
      sleep: s.sleep,
    });
    expect(gate.getDailyCount()).toBe(0);
    expect(gate.getDailyCount()).toBe(0);
    expect(s.clock).toBe(0);
    await gate.acquireToken();
    expect(gate.getDailyCount()).toBe(1);
  });

  it("rolls over at the UTC date boundary", async () => {
    let clock = DAY1;
    const gate = new GateLogic({ ratePerSecond: 1e9, now: () => clock });
    await gate.acquireToken();
    await gate.acquireToken();
    expect(gate.getDailyCount()).toBe(2);
    clock = DAY2;
    expect(gate.getDailyCount()).toBe(0);
    await gate.acquireToken();
    expect(gate.getDailyCount()).toBe(1);
  });

  it("reports every change to onCount, and restoreCount resumes today's count", async () => {
    const seen: unknown[] = [];
    const gate = new GateLogic({
      ratePerSecond: 1e9,
      now: () => DAY1,
      onCount: (c) => seen.push(c),
    });
    await gate.acquireToken();
    expect(seen).toEqual([{ day: "2026-10-15", count: 1 }]);

    const restored = new GateLogic({ ratePerSecond: 1e9, now: () => DAY1 });
    restored.restoreCount({ day: "2026-10-15", count: 40 });
    expect(restored.getDailyCount()).toBe(40);
    await restored.acquireToken();
    expect(restored.getDailyCount()).toBe(41);
  });

  it("ignores a restored count from another day", () => {
    const gate = new GateLogic({ now: () => DAY1 });
    gate.restoreCount({ day: "2026-10-14", count: 99 });
    expect(gate.getDailyCount()).toBe(0);
  });
});
