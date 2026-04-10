/**
 * Calendar Loading Skeleton — Toolbar Drift Guard
 *
 * Ensures the loading skeleton's toolbar chrome matches the structure
 * of the real CalendarWidget toolbar, preventing layout shift on hydration.
 *
 * The real toolbar has:
 * 1. Top row: view toggle (segmented control) + subscribe button
 * 2. Second row: FilterTabs (scrollable pill-shaped team filter tabs)
 * 3. Calendar grid
 *
 * @see https://github.com/kcvvelewijt/www.kcvvelewijt.be/issues/1261
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CalendarLoading from "../loading";

describe("Calendar loading skeleton — toolbar chrome", () => {
  it("renders a toolbar row with view toggle and subscribe button skeletons", () => {
    const { container } = render(<CalendarLoading />);

    // The toolbar top row should have justify-between layout matching CalendarWidget
    const topRow = container.querySelector(
      "[data-testid='calendar-skeleton-toolbar-top']",
    );
    expect(topRow).not.toBeNull();
    expect(topRow!.className).toContain("justify-between");
    expect(topRow!.className).toContain("flex");

    // View toggle skeleton (segmented control shape)
    const viewToggle = container.querySelector(
      "[data-testid='calendar-skeleton-view-toggle']",
    );
    expect(viewToggle).not.toBeNull();

    // Subscribe button skeleton
    const subscribeBtn = container.querySelector(
      "[data-testid='calendar-skeleton-subscribe']",
    );
    expect(subscribeBtn).not.toBeNull();
  });

  it("renders filter tabs skeleton with multiple pill-shaped placeholders", () => {
    const { container } = render(<CalendarLoading />);

    const filterTabs = container.querySelector(
      "[data-testid='calendar-skeleton-filter-tabs']",
    );
    expect(filterTabs).not.toBeNull();

    // Should have at least 3 pill-shaped placeholders (Alle teams + 2 team tabs)
    const pills = filterTabs!.querySelectorAll("[data-testid='skeleton-pill']");
    expect(pills.length).toBeGreaterThanOrEqual(3);
  });

  it("uses space-y-4 wrapper matching CalendarWidget's outer spacing", () => {
    const { container } = render(<CalendarLoading />);

    // The content area inside the container should use space-y-4
    // matching CalendarWidget's root <div className="space-y-4">
    const contentWrapper = container.querySelector(".space-y-4");
    expect(contentWrapper).not.toBeNull();
  });
});
