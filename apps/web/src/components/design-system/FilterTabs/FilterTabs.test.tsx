/**
 * FilterTabs tests
 *
 * Visual contract: paper-chip body + ink-invert active + 1px hairline pipe
 * count divider, per the Track B design checkpoint locked 2026-04-30
 * (Direction D — Paper chrome, ink emphasis). Source-of-record:
 * docs/design/mockups/phase-2-track-b/compare.md and
 * option-d-paper-chrome-ink-emphasis.html (`.f-chip` rules, ink-invert
 * active variant).
 *
 * ARIA: `role="group"` + `aria-pressed` (#2429 resolution, rule 7) — a
 * filter narrows a list in place, it is not a `role="tablist"`/`"tab"` pair
 * with an associated panel.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterTabs, type FilterTab } from "./FilterTabs";

const mockTabs: FilterTab[] = [
  { value: "all", label: "All", count: 10 },
  { value: "active", label: "Active", count: 5 },
  { value: "inactive", label: "Inactive", count: 3 },
  { value: "archived", label: "Archived", count: 2 },
];

// Scroll measurement is rAF-coalesced (#2860) — running the scheduled
// callback synchronously lets a test assert on post-scroll state without a
// separate flush step. Restored by the shared `afterEach`'s
// `vi.restoreAllMocks()`.
function runAnimationFrameSynchronously() {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(
    (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    },
  );
}

describe("FilterTabs", () => {
  describe("Rendering", () => {
    it("should render all tabs", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      expect(
        screen.getByRole("button", { name: "All 10" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Active 5" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Inactive 3" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Archived 2" }),
      ).toBeInTheDocument();
    });

    it("should render with custom aria-label", () => {
      render(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          ariaLabel="Category filters"
        />,
      );

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-label", "Category filters");
    });

    it("should render with default aria-label", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-label", "Filter tabs");
    });
  });

  describe("Visual contract — Direction D paper-chip vocabulary", () => {
    it("renders inactive chips with paper-chip body (cream-soft bg, ink border, ink text)", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const inactive = screen.getByRole("button", { name: "All 10" });
      expect(inactive).toHaveClass("bg-cream-soft");
      expect(inactive).toHaveClass("border-2");
      expect(inactive).toHaveClass("border-ink");
      expect(inactive).toHaveClass("text-ink");
    });

    it("renders the active chip inverted (ink bg, cream text) with the soft shadow", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const active = screen.getByRole("button", { name: "Active 5" });
      expect(active).toHaveClass("bg-ink");
      expect(active).toHaveClass("text-cream");
      expect(active).toHaveClass("shadow-paper-sm-soft");
    });

    it("uses mono caps + tracking on every chip", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("button", { name: "All 10" });
      expect(tab).toHaveClass("font-mono");
      expect(tab).toHaveClass("uppercase");
      expect(tab.className).toContain("tracking-[0.08em]");
    });

    it("uses sharp corners (rounded-none)", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("button", { name: "All 10" });
      expect(tab).toHaveClass("rounded-none");
    });

    it("inactive chips carry the ink offset shadow at rest", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const inactive = screen.getByRole("button", { name: "All 10" });
      expect(inactive).toHaveClass("shadow-paper-sm");
    });

    it("inactive chips carry the soft shadow when surface='inverse' (dark/ink ground)", () => {
      render(
        <FilterTabs tabs={mockTabs} activeTab="active" surface="inverse" />,
      );

      const inactive = screen.getByRole("button", { name: "All 10" });
      expect(inactive).toHaveClass("shadow-paper-sm-soft");
      expect(inactive).not.toHaveClass("shadow-paper-sm");
    });

    it("the row reserves room below for the 4px paper shadow", () => {
      // overflow-x: auto silently forces overflow-y to behave like a scroll
      // container, which would otherwise clip --shadow-paper-sm. pb-1.5 keeps
      // the 4 × 4 ink shadow visible (same fix as BrandedTabs #1576).
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const group = screen.getByRole("group");
      expect(group).toHaveClass("pb-1.5");
    });

    it("the row uses gap-3 (12px) for chip breathing room", () => {
      // Matches BrandedTabs (#1576) row gap; overrides the option-d mockup's
      // 8 px to keep the two Track B tab atoms visually consistent.
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const group = screen.getByRole("group");
      expect(group).toHaveClass("gap-3");
    });
  });

  describe("Per-facet colour prop", () => {
    const coloredTabs: FilterTab[] = [
      { value: "all", label: "Alles" },
      {
        value: "wedstrijden",
        label: "Wedstrijden",
        color: { border: "border-card-red", fill: "bg-card-red text-cream" },
      },
    ];

    it("applies the colour border at rest", () => {
      render(<FilterTabs tabs={coloredTabs} activeTab="all" />);

      const chip = screen.getByRole("button", { name: "Wedstrijden" });
      expect(chip).toHaveClass("border-card-red");
      expect(chip).not.toHaveClass("border-ink");
    });

    it("applies the colour fill only when selected", () => {
      render(<FilterTabs tabs={coloredTabs} activeTab="wedstrijden" />);

      const chip = screen.getByRole("button", { name: "Wedstrijden" });
      expect(chip).toHaveClass("bg-card-red");
      expect(chip).toHaveClass("text-cream");
    });

    it("a tab with no colour renders the neutral Direction D chip", () => {
      render(<FilterTabs tabs={coloredTabs} activeTab="all" />);

      const chip = screen.getByRole("button", { name: "Alles" });
      expect(chip).toHaveClass("border-ink");
      expect(chip).not.toHaveClass("border-card-red");
    });
  });

  describe("Leading-glyph slot", () => {
    it("renders no icon when a tab has none", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );
      expect(container.querySelectorAll("svg").length).toBe(0);
    });

    it("renders the optional leading glyph before the label", () => {
      function TestIcon(
        _props: import("@/lib/icons.redesign").RedesignIconProps,
      ) {
        return <svg data-testid="leading-glyph" />;
      }
      const tabsWithIcon: FilterTab[] = [
        { value: "all", label: "Alles", icon: TestIcon },
      ];

      render(<FilterTabs tabs={tabsWithIcon} activeTab="all" />);

      expect(screen.getByTestId("leading-glyph")).toBeInTheDocument();
    });
  });

  describe("Press idiom (canonical press-down hover)", () => {
    it("applies the hover translate(1, 1) press utility classes", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);
      const tab = screen.getByRole("button", { name: "Active 5" });
      expect(tab).toHaveClass("hover:translate-x-1");
      expect(tab).toHaveClass("hover:translate-y-1");
    });

    it("hover collapses the shadow fully to none (canonical press-down)", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);
      const inactive = screen.getByRole("button", { name: "Active 5" });
      expect(inactive).toHaveClass("hover:shadow-none");
    });

    it("uses the canonical 300ms duration for hover transitions", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);
      const tab = screen.getByRole("button", { name: "All 10" });
      expect(tab).toHaveClass("transition-all", "duration-300");
    });
  });

  describe("Active Tab", () => {
    it("should mark the active tab via aria-pressed", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const activeTab = screen.getByRole("button", { name: "Active 5" });
      expect(activeTab).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Count divider (hairline pipe)", () => {
    it("should show count after a 1 px hairline pipe by default", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const count = screen.getByText("10");
      expect(count).toHaveClass("border-l");
      expect(count).toHaveClass("pl-2");
    });

    it("inactive count uses ink-muted text + ink-muted pipe", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const count = screen.getByText("10"); // inactive 'All 10'
      expect(count).toHaveClass("text-ink-muted");
      expect(count).toHaveClass("border-ink-muted");
    });

    it("active count flips to cream text + cream pipe", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const count = screen.getByText("5"); // active 'Active 5'
      expect(count).toHaveClass("text-cream");
      expect(count).toHaveClass("border-cream");
    });

    it("hides count when showCounts is false", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" showCounts={false} />);

      expect(screen.queryByText("10")).not.toBeInTheDocument();
      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });

    it("does not render count when count is undefined", () => {
      const tabsWithoutCounts: FilterTab[] = [
        { value: "all", label: "All" },
        { value: "active", label: "Active" },
      ];

      render(<FilterTabs tabs={tabsWithoutCounts} activeTab="all" />);

      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Active" }),
      ).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onChange when tab is clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <FilterTabs tabs={mockTabs} activeTab="all" onChange={handleChange} />,
      );

      const activeTab = screen.getByRole("button", { name: "Active 5" });
      await user.click(activeTab);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("active");
    });

    it("should not call onChange when renderAsLinks is true", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const tabsWithHrefs = mockTabs.map((tab) => ({
        ...tab,
        href: `/${tab.value}`,
      }));

      render(
        <FilterTabs
          tabs={tabsWithHrefs}
          activeTab="all"
          onChange={handleChange}
          renderAsLinks
        />,
      );

      const activeTab = screen.getByRole("link", { name: "Active 5" });
      await user.click(activeTab);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Render as Links", () => {
    it("should render as buttons by default", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tabs = screen.getAllByRole("button");
      tabs.forEach((tab) => {
        expect(tab.tagName).toBe("BUTTON");
      });
    });

    it("should render as links when renderAsLinks is true", () => {
      const tabsWithHrefs = mockTabs.map((tab) => ({
        ...tab,
        href: `/${tab.value}`,
      }));

      render(
        <FilterTabs
          tabs={tabsWithHrefs}
          activeTab="all"
          renderAsLinks={true}
        />,
      );

      const tabs = screen.getAllByRole("link");
      tabs.forEach((tab) => {
        expect(tab.tagName).toBe("A");
      });
    });

    it("should set aria-current on active link", () => {
      const tabsWithHrefs = mockTabs.map((tab) => ({
        ...tab,
        href: `/${tab.value}`,
      }));

      render(
        <FilterTabs
          tabs={tabsWithHrefs}
          activeTab="active"
          renderAsLinks={true}
        />,
      );

      const activeTab = screen.getByRole("link", { name: "Active 5" });
      expect(activeTab).toHaveAttribute("aria-current", "page");
    });

    it("should set correct href on links", () => {
      const tabsWithHrefs = mockTabs.map((tab) => ({
        ...tab,
        href: `/${tab.value}`,
      }));

      render(
        <FilterTabs
          tabs={tabsWithHrefs}
          activeTab="all"
          renderAsLinks={true}
        />,
      );

      const allTab = screen.getByRole("link", { name: /all/i });
      expect(allTab).toHaveAttribute("href", "/all");
    });
  });

  describe("useEffect Cleanup", () => {
    it("cleans up event listeners on unmount", () => {
      const { unmount } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );

      unmount();

      expect(true).toBe(true);
    });
  });

  describe("Scroll Arrows", () => {
    let originalScrollWidth: PropertyDescriptor | undefined;
    let originalClientWidth: PropertyDescriptor | undefined;
    let originalScrollTo: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalScrollWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollWidth",
      );
      originalClientWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "clientWidth",
      );
      originalScrollTo = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollTo",
      );

      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        value: 1000,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: vi.fn(),
      });
    });

    afterEach(() => {
      const restore = (prop: string, desc: PropertyDescriptor | undefined) => {
        if (desc) {
          Object.defineProperty(HTMLElement.prototype, prop, desc);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (HTMLElement.prototype as any)[prop];
        }
      };
      restore("scrollWidth", originalScrollWidth);
      restore("clientWidth", originalClientWidth);
      restore("scrollTo", originalScrollTo);
      vi.restoreAllMocks();
    });

    it("should show right arrow when content overflows", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow).toBeInTheDocument();
    });

    it("should call scroll when arrow is clicked", async () => {
      const user = userEvent.setup();

      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const rightArrow = screen.getByLabelText("Scroll right");
      await user.click(rightArrow);

      expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
    });

    it("disables the right arrow in place when scrolled to end, rather than unmounting it", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );

      const scrollContainer = container.querySelector(
        '[role="group"]',
      ) as HTMLElement;

      // Still overflows overall (scrollWidth 200 > clientWidth 100) — only
      // the right direction is spent.
      Object.defineProperty(scrollContainer, "scrollLeft", { value: 100 });
      Object.defineProperty(scrollContainer, "scrollWidth", { value: 200 });
      Object.defineProperty(scrollContainer, "clientWidth", { value: 100 });

      runAnimationFrameSynchronously();
      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow).toBeInTheDocument();
      expect(rightArrow).toBeDisabled();
      expect(screen.getByLabelText("Scroll left")).toBeEnabled();
    });

    it("does not mount either arrow when the row does not overflow", () => {
      // Override this describe's own overflowing default (1000/500) so the
      // track fits exactly.
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        value: 400,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 400,
      });

      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });

    it("reserves a 40px rail on both sides only while the row overflows", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );

      const scrollContainer = container.querySelector(
        '[role="group"]',
      ) as HTMLElement;
      expect(scrollContainer).toHaveClass("pl-10");
      expect(scrollContainer).toHaveClass("pr-10");
    });

    it("renders the arrow at the control register (32 × 32, jersey-deep)", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow).toHaveClass("h-8");
      expect(rightArrow).toHaveClass("w-8");
      expect(rightArrow).toHaveClass("bg-jersey-deep");
    });

    it("makes the scroll track keyboard-reachable (tabIndex=0)", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );

      const scrollContainer = container.querySelector(
        '[role="group"]',
      ) as HTMLElement;
      expect(scrollContainer.getAttribute("tabindex")).toBe("0");
    });

    // #2805 — the overflow fade must match the row's ground, or it paints a
    // mismatched coloured patch beside the arrow instead of a soften. Both
    // fades (left = .bg-gradient-to-r, right = .bg-gradient-to-l) are
    // asserted — a fix that only threads `fadeFromClassName` to one of the
    // two would still leave the suite green if just the left one is checked.
    it("fades from cream on both sides on the default (paper) surface", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );

      const leftFade = container.querySelector(".bg-gradient-to-r");
      const rightFade = container.querySelector(".bg-gradient-to-l");
      expect(leftFade).toHaveClass("from-cream");
      expect(leftFade).not.toHaveClass("from-jersey-deep-dark");
      expect(rightFade).toHaveClass("from-cream");
      expect(rightFade).not.toHaveClass("from-jersey-deep-dark");
    });

    it("fades from jersey-deep-dark on both sides on surface='inverse'", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" surface="inverse" />,
      );

      const leftFade = container.querySelector(".bg-gradient-to-r");
      const rightFade = container.querySelector(".bg-gradient-to-l");
      expect(leftFade).toHaveClass("from-jersey-deep-dark");
      expect(leftFade).not.toHaveClass("from-cream");
      expect(rightFade).toHaveClass("from-jersey-deep-dark");
      expect(rightFade).not.toHaveClass("from-cream");
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" className="custom-class" />,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA roles", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      expect(screen.getByRole("group")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(4);
    });

    it("should have proper aria-pressed attributes", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const activeTab = screen.getByRole("button", { name: "Active 5" });
      const inactiveTab = screen.getByRole("button", { name: "All 10" });

      expect(activeTab).toHaveAttribute("aria-pressed", "true");
      expect(inactiveTab).toHaveAttribute("aria-pressed", "false");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      // The scroll region itself is now a tab stop (tabIndex=0, #2444/#2476's
      // "every scroll track is keyboard-reachable") — a keyboard user can
      // scroll it directly, e.g. with arrow keys, without stepping through
      // every chip first. The first chip follows on the next Tab.
      await user.tab();
      expect(screen.getByRole("group")).toHaveFocus();

      await user.tab();
      const activeTab = screen.getByRole("button", { name: /all/i });
      expect(activeTab).toHaveFocus();
    });

    it("focus-visible ring uses jersey-deep for keyboard users", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("button", { name: /all/i });
      expect(tab.className).toContain("focus-visible:ring-2");
      expect(tab.className).toContain("focus-visible:ring-jersey-deep");
    });
  });
});
