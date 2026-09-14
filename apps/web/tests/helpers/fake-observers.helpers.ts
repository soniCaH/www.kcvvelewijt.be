/**
 * Shared fake `IntersectionObserver` / `ResizeObserver` test doubles.
 *
 * Mirrors the shape `SpyResizeObserver` established in
 * `useScrollHint.test.ts` (#2823): every constructed instance is captured
 * (there may be more than one across renders/resizes), so a test can target
 * entries at whichever element it observed and read `disconnected` to prove
 * a stale observer was torn down.
 *
 * Install with `vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver)`
 * / `vi.stubGlobal("ResizeObserver", FakeResizeObserver)` in `beforeEach`, and
 * `vi.unstubAllGlobals()` in `afterEach` — `vi.stubGlobal` restores whatever
 * the global held before, so nothing here needs to save or delete it by
 * hand. Call `FakeIntersectionObserver.reset()` / `FakeResizeObserver.reset()`
 * in `beforeEach` too, so instances from a previous test don't leak into the
 * next one's `.instances` / `.latest()`.
 */

import { vi } from "vitest";

export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  static reset(): void {
    FakeIntersectionObserver.instances = [];
  }

  static latest(): FakeIntersectionObserver | undefined {
    return FakeIntersectionObserver.instances.at(-1);
  }

  readonly options: IntersectionObserverInit | undefined;
  readonly observed: Element[] = [];
  readonly observe = vi.fn((el: Element) => {
    this.observed.push(el);
  });
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  #callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.#callback = callback;
    this.options = options;
    FakeIntersectionObserver.instances.push(this);
  }

  /** True once `disconnect()` has been called on this instance. */
  get disconnected(): boolean {
    return this.disconnect.mock.calls.length > 0;
  }

  /** Invokes this instance's callback — entries may be partial; supply only
   *  the fields the test under it asserts on. */
  trigger(entries: Partial<IntersectionObserverEntry>[]): void {
    this.#callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

export class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  static reset(): void {
    FakeResizeObserver.instances = [];
  }

  static latest(): FakeResizeObserver | undefined {
    return FakeResizeObserver.instances.at(-1);
  }

  readonly observed: Element[] = [];
  readonly observe = vi.fn((el: Element) => {
    this.observed.push(el);
  });
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();

  #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  /** True once `disconnect()` has been called on this instance. */
  get disconnected(): boolean {
    return this.disconnect.mock.calls.length > 0;
  }

  /** Invokes this instance's callback — mirrors `SpyResizeObserver`'s
   *  `triggerResize` closure from `useScrollHint.test.ts`. */
  trigger(entries: ResizeObserverEntry[] = []): void {
    this.#callback(entries, this as unknown as ResizeObserver);
  }
}
