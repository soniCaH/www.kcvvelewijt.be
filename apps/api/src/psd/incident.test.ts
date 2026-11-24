import { describe, it, expect } from "vitest";
import { IncidentTracker, HEALTH_WINDOW_MS } from "./incident";

/** Mutable clock so we can place reports on a timeline deterministically. */
function clock(start = 1_000_000) {
  const state = { t: start };
  return {
    now: () => state.t,
    at: (ms: number) => {
      state.t = ms;
      return ms;
    },
  };
}

describe("IncidentTracker", () => {
  it("opens an incident on the first failure and returns outage-start once", () => {
    const c = clock();
    const tracker = new IncidentTracker({ now: c.now });

    const first = tracker.report(false, c.at(0));
    expect(first).toEqual({ kind: "outage-start", startedAt: 0 });
    expect(tracker.isOpen).toBe(true);

    // A second failure inside the incident does NOT re-alert (not per-429).
    expect(tracker.report(false, c.at(5_000))).toBeNull();
    expect(tracker.report(false, c.at(30_000))).toBeNull();
    expect(tracker.isOpen).toBe(true);
  });

  it("does not alert on success while healthy", () => {
    const tracker = new IncidentTracker();
    expect(tracker.report(true, 0)).toBeNull();
    expect(tracker.report(true, 10_000)).toBeNull();
    expect(tracker.isOpen).toBe(false);
  });

  it("recovers on the first success after ≥60s with no failure", () => {
    const tracker = new IncidentTracker();
    tracker.report(false, 0); // outage-start

    // A success too soon (<60s after the last failure) does NOT recover.
    expect(tracker.report(true, 30_000)).toBeNull();
    expect(tracker.isOpen).toBe(true);

    // First success ≥60s after the last failure → one recovery ping.
    const rec = tracker.report(true, HEALTH_WINDOW_MS + 1);
    expect(rec).toMatchObject({
      kind: "recovery",
      startedAt: 0,
      recoveredAt: HEALTH_WINDOW_MS + 1,
      durationMs: HEALTH_WINDOW_MS + 1,
    });
    expect(tracker.isOpen).toBe(false);

    // Further successes after recovery don't re-alert.
    expect(tracker.report(true, HEALTH_WINDOW_MS + 100)).toBeNull();
  });

  it("collapses flapping into a single incident (one start, one recovery)", () => {
    const tracker = new IncidentTracker();
    const starts: unknown[] = [];
    const recoveries: unknown[] = [];
    const record = (a: ReturnType<IncidentTracker["report"]>) => {
      if (a?.kind === "outage-start") starts.push(a);
      if (a?.kind === "recovery") recoveries.push(a);
    };

    record(tracker.report(false, 0)); // start
    record(tracker.report(true, 10_000)); // too soon → no recovery
    record(tracker.report(false, 20_000)); // still same incident → no new start
    record(tracker.report(true, 40_000)); // <60s after last failure → no recovery
    record(tracker.report(true, 20_000 + HEALTH_WINDOW_MS + 1)); // recovery

    expect(starts).toHaveLength(1);
    expect(recoveries).toHaveLength(1);
  });

  it("opens a new incident after a full recovery", () => {
    const tracker = new IncidentTracker();
    tracker.report(false, 0);
    tracker.report(true, HEALTH_WINDOW_MS + 1); // recovery
    const second = tracker.report(false, HEALTH_WINDOW_MS + 10_000);
    expect(second).toMatchObject({ kind: "outage-start" });
  });
});
