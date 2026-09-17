/**
 * useWebfontSwap tests
 *
 * The single shared trigger for "the webfonts have actually swapped,
 * re-measure now" (#2822) — composes two signals: a `FontFaceSet`
 * `loadingdone` subscription (the authoritative signal for a real swap)
 * and a `document.fonts.ready` floor (guarantees `onSwap` still runs once
 * even when nothing is loading — restored after a real VR regression: see
 * the "fonts.ready floor" describe block below).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebfontSwap } from "./useWebfontSwap";

/** Stub `document.fonts` with a controllable `loadingdone` subscription and
 *  an optional `ready` promise, mirroring `useHashLandingCorrection.test.ts`
 *  — happy-dom has no `document.fonts` at all, unlike a real browser. */
function stubFonts(ready?: Promise<unknown>) {
  let loadingDoneHandler: (() => void) | undefined;
  const removeEventListener = vi.fn((event: string) => {
    if (event === "loadingdone") loadingDoneHandler = undefined;
  });
  const addEventListener = vi.fn((event: string, handler: () => void) => {
    if (event === "loadingdone") loadingDoneHandler = handler;
  });
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { addEventListener, removeEventListener, ready },
  });
  return {
    addEventListener,
    removeEventListener,
    fireLoadingDone: () => loadingDoneHandler?.(),
  };
}

function unstubFonts() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (document as any).fonts;
}

/** Flush the microtask queue so a resolved `fonts.ready` promise chain
 *  (and any state updates it triggers) settles before assertions run. */
async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useWebfontSwap", () => {
  afterEach(() => {
    unstubFonts();
    vi.restoreAllMocks();
  });

  it("calls onSwap when a FontFaceSet loadingdone event fires", () => {
    const { fireLoadingDone } = stubFonts();
    const onSwap = vi.fn();

    renderHook(() => useWebfontSwap(onSwap));
    fireLoadingDone();

    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("subscribes to loadingdone", () => {
    const { addEventListener } = stubFonts();

    renderHook(() => useWebfontSwap(vi.fn()));

    expect(addEventListener).toHaveBeenCalledWith(
      "loadingdone",
      expect.any(Function),
    );
  });

  it("removes the listener on unmount", () => {
    const { removeEventListener } = stubFonts();

    const { unmount } = renderHook(() => useWebfontSwap(vi.fn()));
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "loadingdone",
      expect.any(Function),
    );
  });

  it("does not call onSwap again after unmount", () => {
    const { fireLoadingDone } = stubFonts();
    const onSwap = vi.fn();

    const { unmount } = renderHook(() => useWebfontSwap(onSwap));
    unmount();
    fireLoadingDone();

    expect(onSwap).not.toHaveBeenCalled();
  });

  it("invokes the latest onSwap after a re-render without re-subscribing", () => {
    const { addEventListener, fireLoadingDone } = stubFonts();
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(({ onSwap }) => useWebfontSwap(onSwap), {
      initialProps: { onSwap: first },
    });

    expect(addEventListener).toHaveBeenCalledTimes(1);

    rerender({ onSwap: second });

    // Listener subscribed exactly once — no re-subscribe churn on re-render.
    expect(addEventListener).toHaveBeenCalledTimes(1);

    fireLoadingDone();

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it("is SSR-safe: does not throw when document.fonts is absent", () => {
    // happy-dom already has no document.fonts by default, but make the
    // absence explicit in case a prior test left a stub behind.
    unstubFonts();

    expect(() => renderHook(() => useWebfontSwap(vi.fn()))).not.toThrow();
  });

  describe("the fonts.ready floor (#2822 VR regression)", () => {
    // Measured in real Chromium: `fonts.ready` resolves in ~1ms even with
    // nothing loading, while `loadingdone` fires 0 times in the same window
    // when no load batch ever occurs — e.g. a Storybook story mounting
    // after an earlier story already resolved the shared Typekit faces.
    // Without this floor, `TeamSectionNav`'s scroll-arrow geometry (via
    // `useScrollHint`) silently stopped getting its guaranteed re-measure.
    it("calls onSwap via fonts.ready even when loadingdone never fires", async () => {
      stubFonts(Promise.resolve());
      const onSwap = vi.fn();

      renderHook(() => useWebfontSwap(onSwap));
      await flushMicrotasks();

      expect(onSwap).toHaveBeenCalledTimes(1);
    });

    it("still fires the authoritative loadingdone event on top of the floor", async () => {
      const { fireLoadingDone } = stubFonts(Promise.resolve());
      const onSwap = vi.fn();

      renderHook(() => useWebfontSwap(onSwap));
      await flushMicrotasks();
      expect(onSwap).toHaveBeenCalledTimes(1);

      // The real, later swap still calls back — the floor is additive, not
      // a replacement for the authoritative signal.
      fireLoadingDone();
      expect(onSwap).toHaveBeenCalledTimes(2);
    });

    it("does not throw when fonts.ready is absent (no floor, loadingdone-only stub)", () => {
      stubFonts(undefined);

      expect(() => renderHook(() => useWebfontSwap(vi.fn()))).not.toThrow();
    });

    it("a fonts.ready resolution after unmount still invokes the latest onSwap harmlessly", async () => {
      // `ready` can't be "cancelled" — this documents (not just asserts)
      // that a post-unmount resolution is safe because every real consumer
      // is idempotent against it (see useWebfontSwap's own docblock).
      let resolveReady!: () => void;
      const ready = new Promise<void>((resolve) => {
        resolveReady = resolve;
      });
      stubFonts(ready);
      const onSwap = vi.fn();

      const { unmount } = renderHook(() => useWebfontSwap(onSwap));
      unmount();
      resolveReady();
      await flushMicrotasks();

      expect(onSwap).toHaveBeenCalledTimes(1);
    });
  });
});
