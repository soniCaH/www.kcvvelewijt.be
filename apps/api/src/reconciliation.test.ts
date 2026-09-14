import { describe, it, expect, vi } from "vitest";
import { Effect } from "effect";
import { reconcileOrphans } from "./reconciliation";

describe("reconcileOrphans", () => {
  it("removes orphans when the count is under the cap", async () => {
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("players", activeIds, accumulatedIds, remove, 0.3),
    );

    expect(result).toEqual({
      action: "removed",
      requestedIds: ["9", "10"],
      confirmedIds: ["9", "10"],
    });
    expect(remove).toHaveBeenCalledWith(["9", "10"]);
  });

  it("skips when the orphan count exceeds max(floor, ratio * active)", async () => {
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3"]);
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("teams", activeIds, accumulatedIds, remove, 0.3),
    );

    expect(result).toEqual({
      action: "skipped",
      orphanCount: 7,
      activeCount: 10,
      ratio: 0.7,
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("handles zero active entities without dividing by zero", async () => {
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("staff", [], new Set(["1", "2"]), remove, 0.3),
    );

    expect(result).toEqual({ action: "none" });
    expect(remove).not.toHaveBeenCalled();
  });

  it("never trips the cap when ratioThreshold is omitted", async () => {
    // 100% orphaned, but no threshold was passed — no cap at all.
    const activeIds = ["1", "2", "3"];
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("x", activeIds, new Set(), remove),
    );

    expect(result.action).toBe("removed");
    expect(remove).toHaveBeenCalledWith(["1", "2", "3"]);
  });

  it("uses a floor to avoid latching on a small set (#2854)", async () => {
    // 10 active, 9 orphaned (90%) — a bare 50% ratio would refuse forever,
    // but a floor of 25 lets a small set's ordinary churn through.
    const activeIds = Array.from({ length: 10 }, (_, i) => String(i));
    const accumulatedIds = new Set(["0"]);
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans(
        "search index",
        activeIds,
        accumulatedIds,
        remove,
        0.5,
        25,
      ),
    );

    expect(result.action).toBe("removed");
    expect(remove).toHaveBeenCalled();
  });

  it("still applies the floor-based cap when the count exceeds it", async () => {
    const activeIds = Array.from({ length: 100 }, (_, i) => String(i));
    const accumulatedIds = new Set(["0"]); // 99 orphaned, way past max(25, 50)
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans(
        "search index",
        activeIds,
        accumulatedIds,
        remove,
        0.5,
        25,
      ),
    );

    expect(result).toEqual({
      action: "skipped",
      orphanCount: 99,
      activeCount: 100,
      ratio: 0.99,
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("returns only the confirmed subset, not the full requested list, when remove reports a partial failure", async () => {
    const activeIds = ["1", "2", "3"];
    const accumulatedIds = new Set<string>();
    // Simulates a delete that fails after retries for one id — the caller
    // must not record it as done (#2831 review finding 2).
    const remove = vi.fn(() => Effect.succeed(["1", "2"]));

    const result = await Effect.runPromise(
      reconcileOrphans("vectors", activeIds, accumulatedIds, remove),
    );

    expect(result).toEqual({
      action: "removed",
      requestedIds: ["1", "2", "3"],
      confirmedIds: ["1", "2"],
    });
  });

  it("propagates a failure from remove", async () => {
    const remove = () => Effect.fail(new Error("boom"));

    const exit = await Effect.runPromiseExit(
      reconcileOrphans("players", ["1"], new Set(), remove),
    );

    expect(exit._tag).toBe("Failure");
  });
});
