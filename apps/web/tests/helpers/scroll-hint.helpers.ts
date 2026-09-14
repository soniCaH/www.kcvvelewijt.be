import { vi } from "vitest";

/**
 * Takes manual control of `window.requestAnimationFrame` /
 * `cancelAnimationFrame` for a single test — a scheduled frame sits in a
 * queue until the test calls `flush()`, rather than firing on a real (or
 * fake) timer, so `useScrollHint`'s rAF coalescing is assertable without a
 * real animation loop.
 *
 * A synchronous mock (`requestAnimationFrame: (cb) => { cb(); return 0; }`)
 * looks equivalent but is not: `useScrollHint`'s `scheduleScrollCheck` reads
 * `rafRef.current !== null` as its re-entrancy guard, then assigns
 * `rafRef.current = requestAnimationFrame(cb)`. With a synchronous mock,
 * `cb` runs — and resets the ref to `null` — *before* that assignment
 * lands, so the assignment then overwrites it back to the returned handle
 * (`0`) instead. The guard is stuck non-null forever after the very first
 * scroll tick, silently dropping every later measurement for the rest of
 * that test (#2860 review: `remainingLeft` observed stuck after a second
 * scroll event). Queueing the callback here — the same way a real
 * animation frame defers it — means the assignment always lands before the
 * callback can reset it, so a second `flush()` after a second scroll tick
 * behaves like the real thing.
 *
 * The spies are `vi.spyOn`, so the caller's own `afterEach` (e.g.
 * `vi.restoreAllMocks()`) restores them — this helper does not register
 * its own.
 */
export function stubAnimationFrame() {
  const queue = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  const raf = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb: FrameRequestCallback) => {
      const id = nextId++;
      queue.set(id, cb);
      return id;
    });
  const caf = vi
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation((id: number) => {
      queue.delete(id);
    });

  return {
    raf,
    caf,
    pendingCount: () => queue.size,
    flush: () => {
      const callbacks = Array.from(queue.values());
      queue.clear();
      callbacks.forEach((cb) => cb(0));
    },
  };
}
