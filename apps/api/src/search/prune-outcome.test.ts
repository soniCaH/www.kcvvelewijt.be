import { describe, it, expect } from "vitest";
import { pruneJobOutcome } from "./prune-outcome";

describe("pruneJobOutcome", () => {
  it("reports nothing (null) when the sweep failed outright (phase undefined)", () => {
    expect(pruneJobOutcome(undefined)).toBeNull();
  });

  it("reports nothing (null) when reconciliation never ran this sweep (#2855 review, finding 1) — NOT ok: true", () => {
    expect(pruneJobOutcome({ kind: "not-run" })).toBeNull();
  });

  it("reports ok: true when the prune ran healthily (nothing to prune, or a prune that landed)", () => {
    expect(pruneJobOutcome({ kind: "ok" })).toEqual({ ok: true });
  });

  it("reports ok: false with the refusal magnitude when the safety cap refused the prune", () => {
    const result = pruneJobOutcome({
      kind: "refused",
      orphanCount: 26,
      activeCount: 30,
      ratio: 26 / 30,
    });

    expect(result?.ok).toBe(false);
    expect(result?.ok === false && String(result.error)).toContain("26/30");
    expect(result?.ok === false && String(result.error)).toContain("87%");
  });

  it("reports ok: false (not healthy) when the delete ran but Vectorize confirmed zero deletes (#2855 review, finding 2)", () => {
    const result = pruneJobOutcome({
      kind: "zero-confirmed",
      requestedCount: 5,
    });

    expect(result?.ok).toBe(false);
    expect(result?.ok === false && String(result.error)).toContain("0/5");
  });
});
