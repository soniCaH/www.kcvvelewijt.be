/**
 * Calendar Loading Skeleton — Toolbar Drift Guard
 *
 * Ensures the loading skeleton's toolbar chrome matches the structure
 * of the real CalendarWidget toolbar, preventing layout shift on hydration.
 *
 * The reskinned layout (Phase 6.D, #1994) is:
 * 1. KalenderFilterBar (pill-shaped by-type colour chips) on top
 * 2. A paper/ink panel whose toolbar row = view toggle (3-way segmented) +
 *    shared period nav + subscribe button
 * 3. Calendar grid inside the panel
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

    // Should have at least 3 pill placeholders (Alles + Wedstrijden + event types)
    const pills = filterTabs!.querySelectorAll("[data-testid='skeleton-pill']");
    expect(pills.length).toBeGreaterThanOrEqual(3);
  });

  it("nests the toolbar inside the space-y-4 wrapper matching CalendarWidget's outer spacing", () => {
    const { container } = render(<CalendarLoading />);

    // Anchor the lookup to the toolbar testid so we only assert against the
    // CalendarLoading/CalendarWidget hierarchy, not any unrelated descendant
    // (e.g. PageHero internals) that might also use space-y-4.
    const toolbarTop = container.querySelector(
      "[data-testid='calendar-skeleton-toolbar-top']",
    );
    expect(toolbarTop).not.toBeNull();

    // The toolbar now lives inside the paper panel, which lives inside the
    // space-y-4 content wrapper — assert it as the nearest ancestor (not the
    // direct parent, which is the panel).
    const contentWrapper = toolbarTop!.closest(".space-y-4");
    expect(contentWrapper).not.toBeNull();
  });
});
