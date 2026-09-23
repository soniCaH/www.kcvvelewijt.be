import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistoryFilterParam } from "./useHistoryFilterParam";

type Facet = "a" | "b" | "c";
const VALUES: readonly Facet[] = ["a", "b", "c"];

describe("useHistoryFilterParam", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/evenementen");
  });

  it("falls back to the default when there's no deep link", () => {
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    expect(result.current[0]).toBe("a");
  });

  it("reads a deep-linked value after mount", () => {
    window.history.replaceState({}, "", "/evenementen?type=b");
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    // React Testing Library flushes the mount effect synchronously, so the
    // deep-linked value is already visible by the time `renderHook` returns.
    expect(result.current[0]).toBe("b");
  });

  it("does not re-render on mount when there's no deep link (#2783 review finding 8)", () => {
    // The mount effect's `fromUrl !== fallback` guard means the visitor who
    // did NOT arrive on a deep link never pays for a second render — the
    // docblock's own claim. A render-count spy is the observable proxy: an
    // unconditional setState back to the SAME string would still be a
    // no-op via React's own Object.is bail-out, so it wouldn't show up as a
    // *value* difference — only as this extra render.
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      });
    });
    expect(renderCount).toBe(1);
    expect(result.current[0]).toBe("a");
  });

  it("writes via history.pushState, not the router", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("b"));
    expect(pushStateSpy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/evenementen?type=b",
    );
  });

  it("uses replaceState when the setter's replace override is passed (#2783 review finding 3)", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("b", { replace: true }));
    expect(replaceStateSpy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/evenementen?type=b",
    );
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it("appends the default hash on write, unless a call overrides it", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
        hash: "lijst",
      }),
    );
    act(() => result.current[1]("b"));
    expect(pushStateSpy).toHaveBeenLastCalledWith(
      window.history.state,
      "",
      "/evenementen?type=b#lijst",
    );
    act(() => result.current[1]("c", { hash: "item" }));
    expect(pushStateSpy).toHaveBeenLastCalledWith(
      window.history.state,
      "",
      "/evenementen?type=c#item",
    );
  });

  it("updates its own value immediately on write (pushState doesn't trigger a re-render on its own)", () => {
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("c"));
    expect(result.current[0]).toBe("c");
  });

  it("does not write when the selection matches the current value (dedup guard)", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("a")); // already the fallback/current value
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it("re-syncs on popstate without writing the URL again", () => {
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");

    window.history.replaceState({}, "", "/evenementen");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toBe("a");
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it("re-syncs when a same-route <Link> moves the URL (Navigation API currententrychange)", () => {
    // happy-dom has no Navigation API; a bare EventTarget is all the hook uses.
    const navigation = new EventTarget();
    vi.stubGlobal("navigation", navigation);
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("b"));

    window.history.replaceState({}, "", "/evenementen");
    act(() => {
      navigation.dispatchEvent(new Event("currententrychange"));
    });

    expect(result.current[0]).toBe("a");
    vi.unstubAllGlobals();
  });

  it("preserves an unrelated live URL param on write", () => {
    window.history.replaceState({}, "", "/evenementen?foo=bar");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() =>
      useHistoryFilterParam("type", VALUES, {
        fallback: "a",
        route: "/evenementen",
      }),
    );
    act(() => result.current[1]("b"));
    const [, , url] = pushStateSpy.mock.calls[0]! as [unknown, string, string];
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("foo")).toBe("bar");
    expect(params.get("type")).toBe("b");
  });
});
