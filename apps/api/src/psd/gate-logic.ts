/**
 * PSD gate — pure coordination logic.
 *
 * The PSD read path storms its own quota: without coordination, N concurrent
 * cache-misses each fire the ~19-call `getNextMatches` fan-out, and a failed
 * refresh never advances `fetchedAt`, so every subsequent request re-fans out
 * until PSD recovers (see #2320). PSD's published limits are 5 req/s + 2 000/day
 * (#2319), shared across every read endpoint — one fan-out already saturates the
 * per-second budget, so the 2nd concurrent miss 429s instantly.
 *
 * This module is the storm fix, expressed as framework-free logic so it can be
 * unit-tested in the Node test env (a real Durable Object cannot). The
 * `PsdGate` Durable Object (see gate.ts) hosts ONE instance of this class, which
 * makes both limiters **global across all worker isolates**:
 *
 *  - **Call pacer** — hands out ≤`ratePerSecond` PSD calls/second worldwide, so
 *    a fan-out can't burst past PSD's 5/s ceiling. In-memory per-isolate was
 *    ruled out (#2324): 8 isolates × 5/s = 40/s.
 *  - **Single-flight** — the first caller for a cache key becomes the leader and
 *    runs the fan-out; concurrent callers coalesce (N misses → 1 fan-out).
 *
 * The persisted negative marker that suppresses re-storming lives in KV (it must
 * outlive a single DO instance), not here — see cache/kv-cache.ts.
 */

export interface GateLogicOptions {
  /** Pacing rate (PSD calls/second). Default 5 (PSD's limit). */
  readonly ratePerSecond?: number;
  /** Injectable clock (ms). Default `Date.now`. */
  readonly now?: () => number;
  /** Injectable sleep. Default a real `setTimeout` promise. */
  readonly sleep?: (ms: number) => Promise<void>;
  /**
   * Max lifetime of a single-flight leadership (ms). If a leader isolate is
   * killed before `endFlight` (waitUntil budget exceeded, eviction), its entry
   * would otherwise pin the key forever and defeat single-flight. After the
   * lease the next `beginFlight` reclaims leadership. Default 15 s — well above a
   * throttled ~19-call fan-out (~4 s at 5/s), well below permanent. */
  readonly leaseMs?: number;
  /** Called after every change to the daily count — the DO persists it (#3490). */
  readonly onCount?: (count: DailyCount) => void;
}

/** PSD calls granted on one UTC day (`YYYY-MM-DD`). */
export interface DailyCount {
  readonly day: string;
  readonly count: number;
}

interface Flight {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly startedAt: number;
  /** Owner token handed to the leader; only it may end this flight (#3467). */
  readonly token: number;
}

const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class GateLogic {
  private readonly rate: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly leaseMs: number;

  /**
   * Resolves when the next call slot opens. Each grant chains a 1/rate-second
   * sleep onto it, so grants come out at exactly `rate` per second.
   *
   * Deliberately clock-FREE. The previous implementation was a wall-clock token
   * bucket, which deadlocks inside a Durable Object: `Date.now()` only advances
   * on I/O, and a DO whose callers are all sleeping in `acquireToken` performs
   * none — so `refill()` accrued nothing, every waiter span until its request's
   * `waitUntil` budget expired, and no fan-out larger than the burst capacity
   * ever completed (silently: a cancelled waitUntil sets no negative marker and
   * reports no outcome, so SWR served the stale value until the 7-day hard TTL).
   * Relative sleeps still resolve under a frozen clock, so pacing survives.
   */
  private slot: Promise<void> = Promise.resolve();

  /** key → the in-flight leadership record. */
  private readonly inFlight = new Map<string, Flight>();

  private nextToken = 1;

  private daily: DailyCount = { day: "", count: 0 };
  private readonly onCount?: (count: DailyCount) => void;

  constructor(opts: GateLogicOptions = {}) {
    this.rate = opts.ratePerSecond ?? 5;
    this.now = opts.now ?? (() => Date.now());
    this.sleep = opts.sleep ?? realSleep;
    this.leaseMs = opts.leaseMs ?? 15_000;
    this.onCount = opts.onCount;
  }

  // Inline UTC day: this file is bundled into the DO, which must not import
  // Effect or the daily-ceiling helper.
  private today(): string {
    return new Date(this.now()).toISOString().slice(0, 10);
  }

  /** Today's PSD-call count (grants of `acquireToken`). Takes no token and
   * counts nothing — the on-demand budget reads it (#3468, #3490). */
  getDailyCount(): number {
    return this.daily.day === this.today() ? this.daily.count : 0;
  }

  /** Resume a persisted count after a DO restart; another day's is dropped. */
  restoreCount(saved: DailyCount): void {
    if (saved.day === this.today()) this.daily = saved;
  }

  /** A flight whose lease has expired is treated as abandoned (dead leader). */
  private isLive(flight: Flight | undefined): boolean {
    return !!flight && this.now() - flight.startedAt < this.leaseMs;
  }

  /**
   * Resolve when a PSD-call slot is available, consuming it. Global ≤rate/s.
   * Callers `await` this immediately before every PSD fetch. An idle gate grants
   * immediately; sustained demand is spaced 1/rate seconds apart. Each grant
   * is one PSD call and bumps the daily count (#3490); counting at the grant,
   * not the request, keeps a queued waiter that never gets a slot uncounted.
   */
  acquireToken(): Promise<void> {
    const mine = this.slot;
    this.slot = mine.then(() => this.sleep(1000 / this.rate));
    // A side-effect handler, not the returned promise: chaining the return
    // would delay every caller by a tick. It runs before the caller resumes.
    void mine.then(() => {
      this.daily = {
        day: this.today(),
        count: this.getDailyCount() + 1,
      };
      this.onCount?.(this.daily);
    });
    return mine;
  }

  /**
   * Single-flight leadership. Returns an owner token to the first caller for
   * `key` (the leader — it must run the work, then call `endFlight(key, token)`),
   * `null` to every concurrent caller (they should `awaitFlight(key)` or serve
   * stale). A caller also becomes leader if the previous leader's lease has
   * expired (dead-leader reclaim), waking anyone waiting on the abandoned flight.
   */
  beginFlight(key: string): number | null {
    const existing = this.inFlight.get(key);
    if (this.isLive(existing)) return null;
    // No live leader (never claimed, or the previous lease expired) → take it.
    existing?.resolve(); // wake waiters stuck on the abandoned flight
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    const token = this.nextToken++;
    this.inFlight.set(key, {
      promise,
      resolve,
      startedAt: this.now(),
      token,
    });
    return token;
  }

  /**
   * Release the flight for `key`, waking every `awaitFlight` waiter. A no-op
   * unless `token` is the current flight's: a leader whose lease lapsed must
   * not end the newer leader's flight (#3467).
   */
  endFlight(key: string, token: number): void {
    const flight = this.inFlight.get(key);
    if (flight?.token === token) {
      flight.resolve();
      this.inFlight.delete(key);
    }
  }

  /**
   * Resolve when the current leader for `key` calls `endFlight`, or after the
   * lease elapses — a leader isolate killed before `endFlight` must not hang
   * cross-isolate waiters forever. No-op if idle.
   */
  async awaitFlight(key: string): Promise<void> {
    const flight = this.inFlight.get(key);
    if (!flight) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        flight.promise,
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, this.leaseMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** True while a live (unexpired) leader holds the flight for `key`. */
  isInFlight(key: string): boolean {
    return this.isLive(this.inFlight.get(key));
  }
}
