import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { HashHistorySync } from "./HashHistorySync";

// happy-dom never fires `hashchange` on its own, so each test dispatches it.
function fireHashChange(init?: HashChangeEventInit) {
  window.dispatchEvent(new HashChangeEvent("hashchange", init));
}

describe("<HashHistorySync>", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("re-registers a native hash entry (state without __NA) through replaceState so Next owns it", () => {
    vi.spyOn(window.history, "state", "get").mockReturnValue(null);
    const replaceState = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => {});
    render(<HashHistorySync />);

    fireHashChange();

    expect(replaceState).toHaveBeenCalledWith(null, "", window.location.href);
  });

  it("re-registers on a real same-page hash change (oldURL and newURL share the path)", () => {
    vi.spyOn(window.history, "state", "get").mockReturnValue(null);
    const replaceState = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => {});
    render(<HashHistorySync />);

    fireHashChange({
      oldURL: "https://example.test/ploegen/a",
      newURL: "https://example.test/ploegen/a#spelers",
    });

    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it("reloads instead of re-registering when Back lands on another page's native entry", () => {
    vi.spyOn(window.history, "state", "get").mockReturnValue(null);
    const replaceState = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => {});
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "https://example.test/ploegen/a#spelers",
      reload,
    });
    render(<HashHistorySync />);

    fireHashChange({
      oldURL: "https://example.test/spelers/372",
      newURL: "https://example.test/ploegen/a#spelers",
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("leaves an entry Next already owns alone", () => {
    vi.spyOn(window.history, "state", "get").mockReturnValue({ __NA: true });
    const replaceState = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => {});
    render(<HashHistorySync />);

    fireHashChange();

    expect(replaceState).not.toHaveBeenCalled();
  });

  it("stops listening on unmount", () => {
    vi.spyOn(window.history, "state", "get").mockReturnValue(null);
    const replaceState = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => {});
    const { unmount } = render(<HashHistorySync />);
    unmount();

    fireHashChange();

    expect(replaceState).not.toHaveBeenCalled();
  });
});
