import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

const pathnameMock = vi.hoisted(() => ({ value: "/kalender" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

import { useMatchTravel } from "./useMatchTravel";

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** Three row instances on one page (a match may sit in the strip and in a list at once). */
function renderRows() {
  return renderHook(() => ({
    strip: useMatchTravel(42),
    list: useMatchTravel(42),
    other: useMatchTravel(7),
  }));
}

const names = (r: ReturnType<typeof renderRows>["result"]) =>
  Object.values(r.current).map((row) => row.transition.name);

describe("useMatchTravel", () => {
  afterEach(() => {
    pathnameMock.value = "/kalender";
    vi.unstubAllGlobals();
    // Spend the module-level tap between tests: it commits a navigation.
    const { rerender } = renderRows();
    pathnameMock.value = "/elders";
    rerender();
    pathnameMock.value = "/kalender";
  });

  it("sets no name at render", () => {
    mockReducedMotion(false);
    const { result } = renderRows();
    expect(names(result)).toEqual([undefined, undefined, undefined]);
  });

  it("renders no name on the server", () => {
    mockReducedMotion(false);
    const { result } = renderRows();
    act(() => result.current.list.onClick());
    const Probe = () => {
      const { transition } = useMatchTravel(42);
      return createElement("div", { "data-name": transition.name });
    };
    expect(renderToString(createElement(Probe))).not.toContain("match-card-42");
  });

  it("names only the clicked row, never two equal names", () => {
    mockReducedMotion(false);
    const { result } = renderRows();
    act(() => result.current.list.onClick());
    expect(names(result)).toEqual([undefined, "match-card-42", undefined]);
    act(() => result.current.strip.onClick());
    expect(names(result)).toEqual(["match-card-42", undefined, undefined]);
  });

  it("sets no name on the own-match page", () => {
    mockReducedMotion(false);
    pathnameMock.value = "/wedstrijd/42";
    const { result } = renderRows();
    act(() => result.current.strip.onClick());
    expect(names(result)).toEqual([undefined, undefined, undefined]);
  });

  it("names a row after its own match, so it pairs with that hero only", () => {
    mockReducedMotion(false);
    pathnameMock.value = "/wedstrijd/99";
    const { result } = renderRows();
    act(() => result.current.other.onClick());
    expect(names(result)).toEqual([undefined, undefined, "match-card-7"]);
  });

  it("sets no name under prefers-reduced-motion", () => {
    mockReducedMotion(true);
    const { result } = renderRows();
    act(() => result.current.list.onClick());
    expect(names(result)).toEqual([undefined, undefined, undefined]);
  });

  it("opts in on share only, so a plain arrival or leave starts no transition", () => {
    mockReducedMotion(false);
    const { result } = renderRows();
    expect(result.current.list.transition).toEqual({ default: "none" });
    act(() => result.current.list.onClick());
    expect(result.current.list.transition).toEqual({
      name: "match-card-42",
      default: "none",
      share: "match-travel",
    });
  });

  it("drops the tap once the navigation commits, whatever started it", () => {
    mockReducedMotion(false);
    const { result, rerender } = renderRows();
    act(() => result.current.strip.onClick());
    expect(names(result)).toEqual(["match-card-42", undefined, undefined]);

    // A route change (link, `router.push`, back/forward) is a pathname change.
    pathnameMock.value = "/wedstrijd/42";
    rerender();
    pathnameMock.value = "/kalender";
    rerender();
    expect(names(result)).toEqual([undefined, undefined, undefined]);
  });

  it("keeps the tap while a row mounts before the navigation commits", () => {
    mockReducedMotion(false);
    const { result } = renderRows();
    act(() => result.current.list.onClick());
    renderRows(); // the page the tap leaves from keeps rendering rows
    expect(names(result)).toEqual([undefined, "match-card-42", undefined]);
  });
});
