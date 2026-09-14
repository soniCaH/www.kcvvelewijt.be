import { describe, it, expect, vi } from "vitest";
import { Effect, Logger } from "effect";
import {
  reconcileOrphans,
  type ReconcileOrphansConfig,
} from "./reconciliation";

const HINT = 'see apps/api/CLAUDE.md ("Some Section") for the release lever.';
const baseConfig: ReconcileOrphansConfig = { releaseLeverHint: HINT };

/** Runs an Effect while capturing every log line's level and message. */
async function runCapturingLogs<A>(effect: Effect.Effect<A>) {
  const messages: { level: string; message: string }[] = [];
  const TestLogger = Logger.make(({ logLevel, message }) => {
    messages.push({ level: logLevel.label, message: String(message) });
  });
  const result = await Effect.runPromise(
    effect.pipe(
      Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
    ),
  );
  return { result, messages };
}

describe("reconcileOrphans", () => {
  it("removes orphans when the count is under the cap", async () => {
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("players", activeIds, accumulatedIds, remove, {
        ...baseConfig,
        ratioThreshold: 0.3,
      }),
    );

    expect(result).toEqual({
      action: "removed",
      requestedIds: ["9", "10"],
      confirmedIds: ["9", "10"],
    });
    expect(remove).toHaveBeenCalledWith(["9", "10"]);
  });

  it("skips when the orphan count exceeds max(floor, ratio * active), logging at WARN", async () => {
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3"]);
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const { result, messages } = await runCapturingLogs(
      reconcileOrphans("teams", activeIds, accumulatedIds, remove, {
        ...baseConfig,
        ratioThreshold: 0.3,
      }),
    );

    expect(result).toEqual({
      action: "skipped",
      orphanCount: 7,
      activeCount: 10,
      ratio: 0.7,
    });
    expect(remove).not.toHaveBeenCalled();

    // #2854 review finding 1: the refusal must land at WARN, not INFO — a
    // sweep filtering Workers logs at WARN+ (as apps/api/CLAUDE.md instructs)
    // must still see it.
    const refusal = messages.find((m) => m.message.includes("SKIPPED"));
    expect(refusal?.level).toBe("WARN");
    // #2854 review finding 2: the release-lever pointer must come from the
    // caller, not a hardcoded search-index-only pointer.
    expect(refusal?.message).toContain(HINT);
  });

  it("handles zero active entities without dividing by zero", async () => {
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("staff", [], new Set(["1", "2"]), remove, {
        ...baseConfig,
        ratioThreshold: 0.3,
      }),
    );

    expect(result).toEqual({ action: "none" });
    expect(remove).not.toHaveBeenCalled();
  });

  it("never trips the cap when ratioThreshold is omitted", async () => {
    // 100% orphaned, but no threshold was passed — no cap at all.
    const activeIds = ["1", "2", "3"];
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("x", activeIds, new Set(), remove, baseConfig),
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
      reconcileOrphans("search index", activeIds, accumulatedIds, remove, {
        ...baseConfig,
        ratioThreshold: 0.5,
        floor: 25,
      }),
    );

    expect(result.action).toBe("removed");
    expect(remove).toHaveBeenCalled();
  });

  it("still applies the floor-based cap when the count exceeds it", async () => {
    const activeIds = Array.from({ length: 100 }, (_, i) => String(i));
    const accumulatedIds = new Set(["0"]); // 99 orphaned, way past max(25, 50)
    const remove = vi.fn((ids: string[]) => Effect.succeed(ids));

    const result = await Effect.runPromise(
      reconcileOrphans("search index", activeIds, accumulatedIds, remove, {
        ...baseConfig,
        ratioThreshold: 0.5,
        floor: 25,
      }),
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
      reconcileOrphans(
        "vectors",
        activeIds,
        accumulatedIds,
        remove,
        baseConfig,
      ),
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
      reconcileOrphans("players", ["1"], new Set(), remove, baseConfig),
    );

    expect(exit._tag).toBe("Failure");
  });

  it("does not repeat the id list when remove is a dry run (confirms nothing) — #2854 review finding 6", async () => {
    const activeIds = ["1", "2", "3"];
    const accumulatedIds = new Set<string>();
    // A dry-run remove: reports the action without actually confirming any
    // removal, same shape as sanity-index-sync.ts's dry-run branch.
    const remove = vi.fn(() => Effect.succeed([] as string[]));

    const { result, messages } = await runCapturingLogs(
      reconcileOrphans(
        "manifest entries",
        activeIds,
        accumulatedIds,
        remove,
        baseConfig,
      ),
    );

    expect(result).toEqual({
      action: "removed",
      requestedIds: ["1", "2", "3"],
      confirmedIds: [],
    });
    const summary = messages.find((m) => m.message.includes("confirmed 0/3"));
    expect(summary).toBeDefined();
    // The confirmed list is empty, so no id list — and specifically no
    // trailing colon with nothing after it.
    expect(summary?.message.endsWith(":")).toBe(false);
    expect(summary?.message).not.toContain("1, 2, 3");
  });

  it("prefixes every log line it emits with logPrefix — #2854 review finding 7", async () => {
    const remove = vi.fn(() => Effect.succeed(["1"]));

    const { messages: removedMessages } = await runCapturingLogs(
      reconcileOrphans("x", ["1"], new Set(), remove, {
        ...baseConfig,
        logPrefix: "[search-sync] ",
      }),
    );
    expect(
      removedMessages.every((m) => m.message.startsWith("[search-sync] ")),
    ).toBe(true);

    const { messages: noneMessages } = await runCapturingLogs(
      reconcileOrphans("x", [], new Set(), remove, {
        ...baseConfig,
        logPrefix: "[search-sync] ",
      }),
    );
    expect(
      noneMessages.every((m) => m.message.startsWith("[search-sync] ")),
    ).toBe(true);

    const { messages: skippedMessages } = await runCapturingLogs(
      reconcileOrphans("x", ["1", "2"], new Set(), remove, {
        ...baseConfig,
        ratioThreshold: 0,
        floor: 0,
        logPrefix: "[search-sync] ",
      }),
    );
    expect(
      skippedMessages.every((m) => m.message.startsWith("[search-sync] ")),
    ).toBe(true);
  });

  it("defaults logPrefix to empty string", async () => {
    const remove = vi.fn(() => Effect.succeed(["1"]));

    const { messages } = await runCapturingLogs(
      reconcileOrphans("x", ["1"], new Set(), remove, baseConfig),
    );

    expect(messages[0]?.message.startsWith("reconciliation:")).toBe(true);
  });
});
