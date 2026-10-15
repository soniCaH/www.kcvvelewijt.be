/**
 * PSD gate — Effect service over the global {@link GateLogic}.
 *
 * The live layer talks to the `PsdGate` Durable Object (one global instance, see
 * gate-do.ts) so the token bucket and single-flight registry are shared across
 * every worker isolate. The DO class itself lives in a separate module because
 * it imports `cloudflare:workers`, which the Node test env can't resolve — this
 * file must stay importable by the unit tests, so it only references the stub
 * structurally.
 *
 * The gate is **best-effort**: if the DO is unreachable, every operation
 * degrades to "no coordination" (proceed without a token, act as leader) so a
 * gate hiccup never breaks the read path — the KV negative marker + SWR still
 * bound the storm.
 */
import { Context, Effect, Layer, Option } from "effect";
import { WorkerEnvTag } from "../env";
import { GateLogic } from "./gate-logic";
import { IncidentTracker } from "./incident";
import type { IncidentContext } from "./slack-alert";

/** A PSD refresh outcome reported to the gate for incident alerting (#2329).
 * Extends the message context so the DO can pass it straight to the builder. */
export interface PsdOutcome extends IncidentContext {
  readonly ok: boolean;
}

export interface PsdGate {
  /** Await a global PSD-call token (≤5/s worldwide). Best-effort: proceeds on gate failure. */
  readonly acquireToken: Effect.Effect<void>;
  /** Today's PSD-call count (UTC day), persisted in the DO. Takes no token.
   * Best-effort: reads `0` on gate failure, so the on-demand budget fails open. */
  readonly getDailyCount: Effect.Effect<number>;
  /** Become the single-flight leader for `key`? An owner token = you run the
   * work; `null` = someone else already is. */
  readonly beginFlight: (key: string) => Effect.Effect<number | null>;
  /** Release the flight for `key`. A no-op unless `token` is the current
   * leader's (#3467). */
  readonly endFlight: (key: string, token: number) => Effect.Effect<void>;
  /** Resolve when the current leader for `key` finishes (bounded wait). */
  readonly awaitFlight: (key: string) => Effect.Effect<void>;
  /**
   * Report a PSD refresh outcome for global incident alerting. Fires a debounced
   * Slack ping on outage-start/recovery and returns whether an outage is open
   * (so the serve-stale path can escalate its log WARN→ERROR). Best-effort.
   */
  readonly reportOutcome: (
    outcome: PsdOutcome,
  ) => Effect.Effect<{ incidentOpen: boolean }>;
}

/**
 * Single-flight: the leader of `key` runs `work`; every other caller awaits it,
 * then `reread`s the shared result. An empty `reread` (the leader left nothing,
 * so it failed) sends the follower round again, so one becomes the next leader
 * and failed runs serialize instead of duplicating. The gate's lease reclaims a
 * dead leader, so the loop cannot spin forever.
 */
export const withFlight = <A, E, R, E2, R2>(
  gate: Pick<PsdGate, "beginFlight" | "endFlight" | "awaitFlight">,
  key: string,
  work: Effect.Effect<A, E, R>,
  reread: Effect.Effect<Option.Option<A>, E2, R2>,
): Effect.Effect<A, E | E2, R | R2> =>
  Effect.gen(function* () {
    for (;;) {
      const token = yield* gate.beginFlight(key);
      if (token !== null) {
        return yield* work.pipe(Effect.ensuring(gate.endFlight(key, token)));
      }
      yield* gate.awaitFlight(key);
      const shared = yield* reread;
      if (Option.isSome(shared)) return shared.value;
    }
  });

export class PsdGateService extends Context.Tag("PsdGateService")<
  PsdGateService,
  PsdGate
>() {}

/** Structural view of the DO stub's RPC surface (see PsdGate in gate-do.ts). */
interface PsdGateStub {
  acquireToken(): Promise<void>;
  getDailyCount(): Promise<number>;
  beginFlight(key: string): Promise<number | null>;
  endFlight(key: string, token: number): Promise<void>;
  awaitFlight(key: string): Promise<void>;
  reportOutcome(outcome: PsdOutcome): Promise<{ incidentOpen: boolean }>;
}

/** Fixed name → one global DO instance for the whole worker. */
const GATE_DO_NAME = "global";

/** DO-backed gate. Every op degrades safely if the Durable Object is unreachable. */
export const PsdGateLive = Layer.effect(
  PsdGateService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const stub = (): PsdGateStub =>
      env.PSD_GATE.get(
        env.PSD_GATE.idFromName(GATE_DO_NAME),
      ) as unknown as PsdGateStub;

    return {
      acquireToken: Effect.tryPromise(() => stub().acquireToken()).pipe(
        Effect.orElseSucceed(() => undefined),
      ),
      getDailyCount: Effect.tryPromise(() => stub().getDailyCount()).pipe(
        Effect.orElseSucceed(() => 0),
      ),
      beginFlight: (key) =>
        Effect.tryPromise(() => stub().beginFlight(key)).pipe(
          // On gate failure, act as leader: the caller does the work rather than
          // waiting on coordination that isn't available. Token 0 is never
          // issued by GateLogic, so a late endFlight with it is a no-op there.
          Effect.orElseSucceed(() => 0),
        ),
      endFlight: (key, token) =>
        Effect.tryPromise(() => stub().endFlight(key, token)).pipe(
          Effect.orElseSucceed(() => undefined),
        ),
      awaitFlight: (key) =>
        Effect.tryPromise(() => stub().awaitFlight(key)).pipe(
          Effect.orElseSucceed(() => undefined),
        ),
      reportOutcome: (outcome) =>
        Effect.tryPromise(() => stub().reportOutcome(outcome)).pipe(
          // On gate failure, assume no incident — alerting is best-effort and
          // must never break or escalate the read path on its own.
          Effect.orElseSucceed(() => ({ incidentOpen: false })),
        ),
    };
  }),
);

/**
 * In-memory gate backed by a caller-supplied {@link GateLogic}. For tests and as
 * a graceful fallback — NOT for production multi-isolate use (each isolate would
 * get its own limiter). Pass a shared `GateLogic` to exercise coalescing.
 */
export const makePsdGateLayer = (
  logic: GateLogic,
  incident: IncidentTracker = new IncidentTracker(),
): Layer.Layer<PsdGateService> =>
  Layer.succeed(PsdGateService, {
    acquireToken: Effect.promise(() => logic.acquireToken()),
    getDailyCount: Effect.sync(() => logic.getDailyCount()),
    beginFlight: (key) => Effect.sync(() => logic.beginFlight(key)),
    endFlight: (key, token) => Effect.sync(() => logic.endFlight(key, token)),
    awaitFlight: (key) => Effect.promise(() => logic.awaitFlight(key)),
    // No Slack post here (no env) — the in-memory layer only tracks state so
    // tests can observe incident-driven log escalation. The DO does the POST.
    reportOutcome: (outcome) =>
      Effect.sync(() => {
        incident.report(outcome.ok);
        return { incidentOpen: incident.isOpen };
      }),
  });

/** A gate with a very high rate — no throttling, real single-flight. Default test layer. */
export const PsdGateTest = makePsdGateLayer(
  new GateLogic({ ratePerSecond: 1e9 }),
);
