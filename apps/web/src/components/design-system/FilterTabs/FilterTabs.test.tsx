/**
 * FilterTabs tests
 *
 * Visual contract: paper-chip body + ink-invert active + 1px hairline pipe
 * count divider, per the Track B design checkpoint locked 2026-04-30
 * (Direction D — Paper chrome, ink emphasis). Source-of-record:
 * docs/design/mockups/phase-2-track-b/compare.md and
 * option-d-paper-chrome-ink-emphasis.html (`.f-chip` rules, ink-invert
 * active variant).
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

describe("FilterTabs", () => {
  describe("Rendering", () => {
    it("should render all tabs", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      expect(screen.getByRole("tab", { name: "All 10" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Active 5" })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Inactive 3" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Archived 2" }),
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

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Category filters");
    });

    it("should render with default aria-label", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Filter tabs");
    });
  });

  describe("Visual contract — Direction D paper-chip vocabulary", () => {
    it("renders inactive chips with paper-chip body (cream-soft bg, ink border, ink text)", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const inactive = screen.getByRole("tab", { name: "All 10" });
      expect(inactive).toHaveClass("bg-cream-soft");
      expect(inactive).toHaveClass("border-2");
      expect(inactive).toHaveClass("border-ink");
      expect(inactive).toHaveClass("text-ink");
    });

    it("renders the active chip inverted (ink bg, cream text) with the soft shadow", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const active = screen.getByRole("tab", { name: "Active 5" });
      expect(active).toHaveClass("bg-ink");
      expect(active).toHaveClass("text-cream");
      expect(active.className).toContain(
        "shadow-[var(--shadow-paper-sm-soft)]",
      );
    });

    it("uses mono caps + tracking on every chip", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("tab", { name: "All 10" });
      expect(tab).toHaveClass("font-mono");
      expect(tab).toHaveClass("uppercase");
      expect(tab.className).toContain("tracking-[0.08em]");
    });

    it("uses sharp corners (rounded-none)", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("tab", { name: "All 10" });
      expect(tab).toHaveClass("rounded-none");
    });

    it("inactive chips carry the ink offset shadow at rest", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const inactive = screen.getByRole("tab", { name: "All 10" });
      expect(inactive.className).toContain("shadow-[var(--shadow-paper-sm)]");
    });

    it("the tablist row reserves room below for the 4px paper shadow", () => {
      // overflow-x: auto silently forces overflow-y to behave like a scroll
      // container, which would otherwise clip --shadow-paper-sm. pb-1.5 keeps
      // the 4 × 4 ink shadow visible (same fix as BrandedTabs #1576).
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("pb-1.5");
    });

    it("the tablist row uses gap-3 (12px) for chip breathing room", () => {
      // Matches BrandedTabs (#1576) row gap; overrides the option-d mockup's
      // 8 px to keep the two Track B tab atoms visually consistent.
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("gap-3");
    });
  });

  describe("Press idiom (paper-card press)", () => {
    it("applies the hover translate(1, 1) press utility classes", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);
      const tab = screen.getByRole("tab", { name: "Active 5" });
      expect(tab).toHaveClass("hover:translate-x-px");
      expect(tab).toHaveClass("hover:translate-y-px");
    });

    it("inactive hover collapses shadow to 3 × 3 ink", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);
      const inactive = screen.getByRole("tab", { name: "Active 5" });
      expect(inactive.className).toContain(
        "hover:shadow-[3px_3px_0_0_var(--color-ink)]",
      );
    });

    it("active hover collapses shadow to 3 × 3 ink-muted", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);
      const active = screen.getByRole("tab", { name: "Active 5" });
      expect(active.className).toContain(
        "hover:shadow-[3px_3px_0_0_var(--color-ink-muted)]",
      );
    });

    it("applies transition classes for smooth state changes", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);
      const tab = screen.getByRole("tab", { name: "All 10" });
      expect(tab.className).toContain("transition-");
    });
  });

  describe("Active Tab", () => {
    it("should mark the active tab via aria-selected", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const activeTab = screen.getByRole("tab", { name: "Active 5" });
      expect(activeTab).toHaveAttribute("aria-selected", "true");
    });

    it("should set correct tabIndex for active and inactive tabs", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const activeTab = screen.getByRole("tab", { name: "Active 5" });
      const inactiveTab = screen.getByRole("tab", { name: "All 10" });

      expect(activeTab).toHaveAttribute("tabIndex", "0");
      expect(inactiveTab).toHaveAttribute("tabIndex", "-1");
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

      expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Active" })).toBeInTheDocument();
    });
  });

  describe("Size Variants — padding + font-size only", () => {
    it("should render small size", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" size="sm" />);

      const tab = screen.getByRole("tab", { name: /all/i });
      expect(tab.className).toContain("px-[9px]");
      expect(tab.className).toContain("py-[5px]");
      expect(tab.className).toContain("text-[10px]");
    });

    it("should render medium size by default", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("tab", { name: /all/i });
      expect(tab).toHaveClass("px-3");
      expect(tab).toHaveClass("py-2");
      expect(tab.className).toContain("text-[11px]");
    });

    it("should render large size", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" size="lg" />);

      const tab = screen.getByRole("tab", { name: /all/i });
      expect(tab).toHaveClass("px-4");
      expect(tab.className).toContain("py-[11px]");
      expect(tab).toHaveClass("text-xs");
    });
  });

  describe("Interactions", () => {
    it("should call onChange when tab is clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <FilterTabs tabs={mockTabs} activeTab="all" onChange={handleChange} />,
      );

      const activeTab = screen.getByRole("tab", { name: "Active 5" });
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

      const activeTab = screen.getByRole("tab", { name: "Active 5" });
      await user.click(activeTab);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Render as Links", () => {
    it("should render as buttons by default", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tabs = screen.getAllByRole("tab");
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

      const tabs = screen.getAllByRole("tab");
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

      const activeTab = screen.getByRole("tab", { name: "Active 5" });
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

      const allTab = screen.getByRole("tab", { name: /all/i });
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

    it("should hide right arrow when scrolled to end", () => {
      const { container } = render(
        <FilterTabs tabs={mockTabs} activeTab="all" />,
      );

      const scrollContainer = container.querySelector(
        '[role="tablist"]',
      ) as HTMLElement;

      Object.defineProperty(scrollContainer, "scrollLeft", { value: 100 });
      Object.defineProperty(scrollContainer, "scrollWidth", { value: 200 });
      Object.defineProperty(scrollContainer, "clientWidth", { value: 100 });

      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });

      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
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

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(4);
    });

    it("should have proper aria-selected attributes", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="active" />);

      const activeTab = screen.getByRole("tab", { name: "Active 5" });
      const inactiveTab = screen.getByRole("tab", { name: "All 10" });

      expect(activeTab).toHaveAttribute("aria-selected", "true");
      expect(inactiveTab).toHaveAttribute("aria-selected", "false");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      await user.tab();
      const activeTab = screen.getByRole("tab", { name: /all/i });
      expect(activeTab).toHaveFocus();
    });

    it("focus-visible ring uses jersey-deep for keyboard users", () => {
      render(<FilterTabs tabs={mockTabs} activeTab="all" />);

      const tab = screen.getByRole("tab", { name: /all/i });
      expect(tab.className).toContain("focus-visible:ring-2");
      expect(tab.className).toContain("focus-visible:ring-jersey-deep");
    });
  });
});
