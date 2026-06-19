import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

const mockPathname = vi.fn<() => string>(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import { ScrollToTop } from "./ScrollToTop";

describe("ScrollToTop", () => {
  let scrollSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scrollSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    window.location.hash = "";
    mockPathname.mockReturnValue("/club");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("scrolls instantly to the top on a plain (no-hash) route render", () => {
    render(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  });

  it("does not scroll when the URL targets an in-page anchor", () => {
    window.location.hash = "#visie";
    render(<ScrollToTop />);
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("re-scrolls to the top when the pathname changes", () => {
    const { rerender } = render(<ScrollToTop />);
    scrollSpy.mockClear();
    mockPathname.mockReturnValue("/jeugd");
    rerender(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  });
});
