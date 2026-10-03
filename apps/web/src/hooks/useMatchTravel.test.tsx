import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, fireEvent } from "@testing-library/react";
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
    // Link click that resets the module-level state between tests.
    const a = document.createElement("a");
    document.body.append(a);
    fireEvent.click(a);
    a.remove();
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

  it("names a row that stays mounted (the strip) again when the visitor comes back, until another link is tapped", () => {
    mockReducedMotion(false);
    const { result, rerender } = renderRows();
    act(() => result.current.strip.onClick());
    expect(names(result)).toEqual(["match-card-42", undefined, undefined]);

    pathnameMock.value = "/wedstrijd/42";
    rerender();
    expect(names(result)).toEqual([undefined, undefined, undefined]);

    pathnameMock.value = "/kalender";
    rerender();
    expect(names(result)).toEqual(["match-card-42", undefined, undefined]);

    const link = document.createElement("a");
    document.body.append(link);
    act(() => {
      fireEvent.click(link);
    });
    link.remove();
    expect(names(result)).toEqual([undefined, undefined, undefined]);
  });
});
