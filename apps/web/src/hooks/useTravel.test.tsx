import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

const pathnameMock = vi.hoisted(() => ({ value: "/kalender" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

import { useTravel } from "./useTravel";

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
    strip: useTravel("match", "/wedstrijd/42"),
    list: useTravel("match", "/wedstrijd/42"),
    other: useTravel("match", "/wedstrijd/7"),
  }));
}

const names = (r: ReturnType<typeof renderRows>["result"]) =>
  Object.values(r.current).map((row) => row.transition.name);

describe("useTravel", () => {
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
      const { transition } = useTravel("match", "/wedstrijd/42");
      return createElement("div", { "data-name": transition.name });
    };
    expect(renderToString(createElement(Probe))).not.toContain(
      "match-travel-42",
    );
  });

  it("names only the clicked row, never two equal names", () => {
    mockReducedMotion(false);
    const { result } = renderRows();
    act(() => result.current.list.onClick());
    expect(names(result)).toEqual([undefined, "match-travel-42", undefined]);
    act(() => result.current.strip.onClick());
    expect(names(result)).toEqual(["match-travel-42", undefined, undefined]);
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
    expect(names(result)).toEqual([undefined, undefined, "match-travel-7"]);
  });

  it("names a tapped news card or squad card after its own kind and slug", () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => ({
      card: useTravel("article", "/nieuws/winst"),
      sameSlugPlayer: useTravel("player", "/spelers/winst"),
    }));
    act(() => result.current.card.onClick());
    expect(result.current.card.transition.name).toBe("article-travel-winst");
    expect(result.current.sameSlugPlayer.transition.name).toBeUndefined();
  });

  it("sets no name on the detail page of its own record, whatever the kind", () => {
    mockReducedMotion(false);
    pathnameMock.value = "/nieuws/winst";
    const { result } = renderHook(() => useTravel("article", "/nieuws/winst"));
    act(() => result.current.onClick());
    expect(result.current.transition.name).toBeUndefined();
  });

  it.each([
    ["no kind", undefined, "/nieuws/winst"],
    ["no href", "article", undefined],
    ["a listing href", "article", "/nieuws"],
    ["another kind's href", "player", "/nieuws/winst"],
  ] as const)("is inert for %s: no name, no tap recorded", (_l, kind, href) => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useTravel(kind, href));
    let recorded = true;
    act(() => {
      recorded = result.current.onClick();
    });
    expect(recorded).toBe(false);
    expect(result.current.transition).toEqual({ default: "none" });
  });

  it("says whether a tap was recorded", () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useTravel("article", "/nieuws/winst"));
    let recorded = false;
    act(() => {
      recorded = result.current.onClick();
    });
    expect(recorded).toBe(true);
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
      name: "match-travel-42",
      default: "none",
      share: "travel",
    });
  });

  it("drops the tap once the navigation commits, whatever started it", () => {
    mockReducedMotion(false);
    const { result, rerender } = renderRows();
    act(() => result.current.strip.onClick());
    expect(names(result)).toEqual(["match-travel-42", undefined, undefined]);

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
    expect(names(result)).toEqual([undefined, "match-travel-42", undefined]);
  });
});
