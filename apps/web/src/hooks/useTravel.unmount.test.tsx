import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/nieuws" }));
// Every instance shares one key, so a tap that outlives its source shows up on
// whichever source mounts next. (Its own file: `useTravel.test.tsx` needs
// distinct keys.)
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useId: () => "one-key",
}));

import { useTravel } from "./useTravel";

describe("useTravel — a source that unmounts with its navigation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("drops its tap on unmount: pages, not layouts, own the sources", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false, media: "" }),
    );
    const source = renderHook(() => useTravel("article", "/nieuws/winst"));
    act(() => {
      source.result.current.onClick();
    });
    expect(source.result.current.transition.name).toBe("article-travel-winst");

    // /nieuws -> /nieuws/winst unmounts the tapped card; no pathname change
    // ever reaches it.
    source.unmount();

    const next = renderHook(() => useTravel("article", "/nieuws/winst"));
    expect(next.result.current.transition.name).toBeUndefined();
  });
});
