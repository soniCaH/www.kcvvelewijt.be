import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollIntoViewMotionSafe } from "./scroll-into-view";

function stubReducedMotion(reduce: boolean) {
  // happy-dom's matchMedia ignores the query, so answer it explicitly.
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query === "(prefers-reduced-motion: reduce)",
      media: query,
    })),
  );
}

describe("scrollIntoViewMotionSafe", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("scrolls smoothly and forwards the other options", () => {
    stubReducedMotion(false);
    const el = { scrollIntoView: vi.fn() } as unknown as Element;
    scrollIntoViewMotionSafe(el, { block: "center" });
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("scrolls instantly under prefers-reduced-motion", () => {
    stubReducedMotion(true);
    const el = { scrollIntoView: vi.fn() } as unknown as Element;
    scrollIntoViewMotionSafe(el, { block: "start" });
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "instant",
      block: "start",
    });
  });

  it("defaults to no extra options", () => {
    stubReducedMotion(false);
    const el = { scrollIntoView: vi.fn() } as unknown as Element;
    scrollIntoViewMotionSafe(el);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});
