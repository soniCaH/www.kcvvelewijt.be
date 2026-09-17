/**
 * useWebfontSwap tests
 *
 * The single shared trigger for "the webfonts have actually swapped,
 * re-measure now" (#2822) — a `FontFaceSet` `loadingdone` subscription,
 * deliberately not `document.fonts.ready` (see the hook's own docblock for
 * why `ready` resolves too early).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWebfontSwap } from "./useWebfontSwap";

/** Stub `document.fonts` with a controllable `loadingdone` subscription,
 *  mirroring `useHashLandingCorrection.test.ts` — happy-dom has no
 *  `document.fonts` at all, unlike a real browser. */
function stubFonts() {
  let loadingDoneHandler: (() => void) | undefined;
  const removeEventListener = vi.fn((event: string) => {
    if (event === "loadingdone") loadingDoneHandler = undefined;
  });
  const addEventListener = vi.fn((event: string, handler: () => void) => {
    if (event === "loadingdone") loadingDoneHandler = handler;
  });
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { addEventListener, removeEventListener },
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

  it("subscribes to loadingdone, not fonts.ready", () => {
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
});
