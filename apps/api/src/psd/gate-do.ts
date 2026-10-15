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
import { GateLogic } from "./gate-logic";
import { IncidentTracker } from "./incident";
import { buildIncidentMessage, postSlack } from "./slack-alert";

export class PsdGate extends DurableObject<WorkerEnv> {
  // Instance-lifetime state: survives across requests while the DO stays warm.
  // All coordination logic (including the lease that bounds awaitFlight against
  // a dead leader) lives in GateLogic so it stays unit-testable.
  private readonly logic = new GateLogic();
  // ONE global incident view across all isolates — debounces 429 storms into a
  // single outage/recovery Slack ping (see incident.ts, #2329).
  private readonly incident = new IncidentTracker();

  acquireToken(): Promise<void> {
    return this.logic.acquireToken();
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
