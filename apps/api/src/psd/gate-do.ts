/**
 * PsdGate Durable Object — hosts ONE global {@link GateLogic} instance so the
 * PSD token bucket and single-flight registry are shared across every worker
 * isolate (the whole point: in-memory per-isolate limiters would multiply the
 * rate by the isolate count — see #2324).
 *
 * Thin RPC wrapper: all real logic is in the framework-free, unit-tested
 * GateLogic. This module imports `cloudflare:workers`, so it must only ever be
 * imported by the worker entry (index.ts), never by code the Node tests load.
 */
import { DurableObject } from "cloudflare:workers";
import type { WorkerEnv } from "../env";
// Type-only — erases at build, so the DO bundle never pulls in Effect via gate.ts.
import type { PsdOutcome } from "./gate";
import { GateLogic, type DailyCount } from "./gate-logic";
import { IncidentTracker } from "./incident";
import { buildIncidentMessage, postSlack } from "./slack-alert";

/** `ctx.storage` key of the persisted daily PSD call count (#3490). */
const DAILY_COUNT_KEY = "daily-count";

export class PsdGate extends DurableObject<WorkerEnv> {
  // Instance-lifetime state: survives across requests while the DO stays warm.
  // All coordination logic (including the lease that bounds awaitFlight against
  // a dead leader) lives in GateLogic so it stays unit-testable. Only the daily
  // call count is persisted: it must outlive eviction, the rest is per-request.
  private readonly logic: GateLogic;
  // ONE global incident view across all isolates — debounces 429 storms into a
  // single outage/recovery Slack ping (see incident.ts, #2329).
  private readonly incident = new IncidentTracker();

  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env);
    this.logic = new GateLogic({
      // Fire and forget: the write is coalesced and the output gate holds the
      // response until it lands. A storage hiccup must not fail a PSD call.
      onCount: (count) => {
        void ctx.storage.put(DAILY_COUNT_KEY, count).catch(() => undefined);
      },
    });
    void ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get<DailyCount>(DAILY_COUNT_KEY);
      if (saved) this.logic.restoreCount(saved);
    });
  }

  acquireToken(): Promise<void> {
    return this.logic.acquireToken();
  }

  /** Today's PSD-call count — read-only, takes no token (#3490). */
  getDailyCount(): number {
    return this.logic.getDailyCount();
  }

  /**
   * Record a PSD refresh outcome. Fires a debounced Slack ping on the first 429
   * of an outage and on recovery, and returns the live incident state so the
   * read path can escalate its serve-stale log WARN→ERROR while it's open.
   */
  async reportOutcome(input: PsdOutcome): Promise<{ incidentOpen: boolean }> {
    const alert = this.incident.report(input.ok);
    if (alert) {
      await postSlack(
        this.env.SLACK_ALERT_WEBHOOK_URL,
        buildIncidentMessage(alert, input),
      );
    }
    return { incidentOpen: this.incident.isOpen };
  }

  beginFlight(key: string): number | null {
    return this.logic.beginFlight(key);
  }

  endFlight(key: string, token: number): void {
    this.logic.endFlight(key, token);
  }

  awaitFlight(key: string): Promise<void> {
    return this.logic.awaitFlight(key);
  }
}
