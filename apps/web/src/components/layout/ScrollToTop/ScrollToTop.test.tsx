import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";

const mockPathname = vi.fn<() => string>(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import { ScrollToTop } from "./ScrollToTop";

const TO_TOP = { top: 0, left: 0, behavior: "instant" };

/** A real `popstate`, which is what the component listens for. */
function popTo(pathname: string) {
  act(() => {
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

describe("ScrollToTop", () => {
  let scrollSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scrollSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    window.history.pushState({}, "", "/club");
    window.location.hash = "";
    mockPathname.mockReturnValue("/club");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("scrolls to the top on a forward navigation to a new route", () => {
    const { rerender } = render(<ScrollToTop />);
    scrollSpy.mockClear();
    mockPathname.mockReturnValue("/jeugd");
    rerender(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledWith(TO_TOP);
  });

  it("does not scroll on the initial render", () => {
    // The browser has already placed a fresh load. Scrolling here throws a
    // visitor who started reading during hydration back to the top (#2986).
    render(<ScrollToTop />);
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("does not scroll when the route change came from a back/forward pop", () => {
    // The browser restores the offset the visitor left; overwriting it is
    // what made Back land at the top of every page (#2986).
    const { rerender } = render(<ScrollToTop />);
    scrollSpy.mockClear();
    popTo("/jeugd");
    mockPathname.mockReturnValue("/jeugd");
    rerender(<ScrollToTop />);
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("still scrolls on the forward navigation after a pop", () => {
    const { rerender } = render(<ScrollToTop />);
    popTo("/jeugd");
    mockPathname.mockReturnValue("/jeugd");
    rerender(<ScrollToTop />);
    scrollSpy.mockClear();

    mockPathname.mockReturnValue("/sponsors");
    rerender(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledWith(TO_TOP);
  });

  it("does not let a pop that kept the same pathname swallow the next navigation", () => {
    // Going back over a `#hash` pops without changing the pathname, so the
    // effect never runs to consume the record. A bare "a pop happened" flag
    // would stay armed and skip the next real forward navigation.
    const { rerender } = render(<ScrollToTop />);
    popTo("/club");
    scrollSpy.mockClear();

    mockPathname.mockReturnValue("/sponsors");
    rerender(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledWith(TO_TOP);
  });

  it("does not scroll when the URL targets an in-page anchor", () => {
    const { rerender } = render(<ScrollToTop />);
    window.location.hash = "#visie";
    mockPathname.mockReturnValue("/jeugd");
    rerender(<ScrollToTop />);
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
