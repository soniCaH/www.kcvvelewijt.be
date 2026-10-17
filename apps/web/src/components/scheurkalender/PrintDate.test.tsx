/**
 * PrintDate Component Tests
 *
 * The component prints *today's* Belgian calendar day, identical to
 * `formatArticleDate`, without importing Luxon (#3480). The ISR page it sits
 * on is rendered once and served for up to 15 minutes, so server HTML and
 * hydration can land on different days; `useSyncExternalStore` with an empty
 * server snapshot is what keeps that from being a hydration mismatch.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { PrintDate } from "./PrintDate";
import { formatArticleDate } from "@/lib/utils/dates";

describe("PrintDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    "2026-03-14T12:00:00Z",
    // 23:30 UTC on 31 Dec is already 1 January in Brussels
    "2026-12-31T23:30:00Z",
    // 22:30 UTC in summer is already the next day in Brussels (CEST)
    "2026-07-09T22:30:00Z",
  ])("prints the same text as formatArticleDate at %s", (iso) => {
    vi.setSystemTime(new Date(iso));
    const container = document.createElement("div");
    document.body.append(container);
    act(() => {
      hydrateRoot(container, <PrintDate />);
    });
    expect(container.textContent).toBe(formatArticleDate(new Date(iso)));
    container.remove();
  });

  it("renders nothing on the server", () => {
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
    expect(renderToString(<PrintDate />)).toBe("");
  });

  it("shows today's date when hydrating server HTML from another day, with no hydration warning", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(<PrintDate />);

    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    act(() => {
      hydrateRoot(container, <PrintDate />, {
        onRecoverableError: (error) => errors(error),
      });
    });

    expect(container.textContent).toBe("15 maart 2026");
    expect(errors).not.toHaveBeenCalled();
    container.remove();
  });
});
