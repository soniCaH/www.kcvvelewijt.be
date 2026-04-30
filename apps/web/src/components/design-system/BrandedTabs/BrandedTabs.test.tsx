/**
 * BrandedTabs tests
 *
 * Visual contract: paper-card body + ink-invert active per the Track B
 * design checkpoint locked 2026-04-30 (Direction D — Paper chrome, ink
 * emphasis). Source-of-record: docs/design/mockups/phase-2-track-b/
 * compare.md and option-d-paper-chrome-ink-emphasis.html.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrandedTabs, type BrandedTab } from "./BrandedTabs";

const tabs: BrandedTab[] = [
  { id: "info", label: "Info" },
  { id: "spelers", label: "Spelers" },
  { id: "wedstrijden", label: "Wedstrijden" },
];

describe("BrandedTabs", () => {
  describe("Rendering & a11y", () => {
    it("renders all tab labels as tab role buttons", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      tabs.forEach((tab) => {
        expect(
          screen.getByRole("tab", { name: tab.label }),
        ).toBeInTheDocument();
      });
    });

    it("marks the active tab with aria-selected and tabIndex 0", () => {
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="spelers"
          onTabChange={() => {}}
        />,
      );
      const active = screen.getByRole("tab", { name: "Spelers" });
      expect(active).toHaveAttribute("aria-selected", "true");
      expect(active).toHaveAttribute("tabindex", "0");
    });

    it("marks inactive tabs with aria-selected=false and tabIndex -1", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const inactive = screen.getByRole("tab", { name: "Spelers" });
      expect(inactive).toHaveAttribute("aria-selected", "false");
      expect(inactive).toHaveAttribute("tabindex", "-1");
    });

    it("exposes a tablist with the configured aria-label", () => {
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="info"
          onTabChange={() => {}}
          ariaLabel="Team detail secties"
        />,
      );
      expect(
        screen.getByRole("tablist", { name: "Team detail secties" }),
      ).toBeInTheDocument();
    });
  });

  describe("Visual contract — Direction D paper-card vocabulary", () => {
    it("renders inactive tabs with paper-card body (cream bg, ink border, ink text)", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const inactive = screen.getByRole("tab", { name: "Spelers" });
      expect(inactive).toHaveClass("bg-cream");
      expect(inactive).toHaveClass("border-2");
      expect(inactive).toHaveClass("border-ink");
      expect(inactive).toHaveClass("text-ink");
    });

    it("renders the active tab inverted (ink bg, cream text) with the soft shadow", () => {
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="spelers"
          onTabChange={() => {}}
        />,
      );
      const active = screen.getByRole("tab", { name: "Spelers" });
      expect(active).toHaveClass("bg-ink");
      expect(active).toHaveClass("text-cream");
      expect(active.className).toContain(
        "shadow-[var(--shadow-paper-sm-soft)]",
      );
    });

    it("uses mono font, uppercase, tracking on every tab", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tab = screen.getByRole("tab", { name: "Info" });
      expect(tab).toHaveClass("font-mono");
      expect(tab).toHaveClass("uppercase");
      expect(tab.className).toContain("tracking-[0.08em]");
    });

    it("uses sharp corners (rounded-none)", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tab = screen.getByRole("tab", { name: "Info" });
      expect(tab).toHaveClass("rounded-none");
    });

    it("inactive tabs carry the ink offset shadow at rest", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const inactive = screen.getByRole("tab", { name: "Spelers" });
      expect(inactive.className).toContain("shadow-[var(--shadow-paper-sm)]");
    });

    it("the tablist container drops the legacy bottom border", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tablist = screen.getByRole("tablist");
      expect(tablist.className).not.toContain("border-b");
      expect(tablist.className).not.toContain("border-gray-200");
    });

    it("reserves room below the row for the 4px paper shadow", () => {
      // overflow-x: auto silently forces overflow-y to behave like a scroll
      // container, which would otherwise clip the bottom of --shadow-paper-sm
      // (4×4 ink). pb-1.5 keeps the shadow visible.
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("pb-1.5");
    });
  });

  describe("Press idiom (paper-card press)", () => {
    it("applies the hover translate(1, 1) press utility classes", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tab = screen.getByRole("tab", { name: "Spelers" });
      expect(tab).toHaveClass("hover:translate-x-px");
      expect(tab).toHaveClass("hover:translate-y-px");
    });

    it("inactive hover collapses shadow to 3 × 3 ink", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const inactive = screen.getByRole("tab", { name: "Spelers" });
      expect(inactive.className).toContain(
        "hover:shadow-[3px_3px_0_0_var(--color-ink)]",
      );
    });

    it("active hover collapses shadow to 3 × 3 ink-muted", () => {
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="spelers"
          onTabChange={() => {}}
        />,
      );
      const active = screen.getByRole("tab", { name: "Spelers" });
      expect(active.className).toContain(
        "hover:shadow-[3px_3px_0_0_var(--color-ink-muted)]",
      );
    });

    it("applies transition classes for smooth state changes", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tab = screen.getByRole("tab", { name: "Info" });
      expect(tab.className).toContain("transition-");
    });

    it("preserves focus-visible ring for keyboard navigation", () => {
      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );
      const tab = screen.getByRole("tab", { name: "Info" });
      expect(tab.className).toContain("focus-visible:ring-2");
    });
  });

  describe("Behaviour", () => {
    it("calls onTabChange exactly once with the clicked tab id", () => {
      const onTabChange = vi.fn();
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="info"
          onTabChange={onTabChange}
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Wedstrijden" }));
      expect(onTabChange).toHaveBeenCalledTimes(1);
      expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
    });

    it("does not call onTabChange when clicking the already-active tab", () => {
      const onTabChange = vi.fn();
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="info"
          onTabChange={onTabChange}
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Info" }));
      expect(onTabChange).not.toHaveBeenCalled();
    });

    it("moves selection right with ArrowRight and updates tabIndex", () => {
      const onTabChange = vi.fn();
      const { rerender } = render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="info"
          onTabChange={onTabChange}
        />,
      );
      const info = screen.getByRole("tab", { name: "Info" });
      fireEvent.keyDown(info, { key: "ArrowRight" });
      expect(onTabChange).toHaveBeenCalledTimes(1);
      expect(onTabChange).toHaveBeenCalledWith("spelers");

      rerender(
        <BrandedTabs
          tabs={tabs}
          activeTabId="spelers"
          onTabChange={onTabChange}
        />,
      );
      const spelers = screen.getByRole("tab", { name: "Spelers" });
      expect(spelers).toHaveAttribute("tabindex", "0");
      expect(spelers).toHaveAttribute("aria-selected", "true");
      expect(info).toHaveAttribute("tabindex", "-1");
      expect(info).toHaveAttribute("aria-selected", "false");
    });

    it("moves selection left with ArrowLeft and wraps around", () => {
      const onTabChange = vi.fn();
      render(
        <BrandedTabs
          tabs={tabs}
          activeTabId="info"
          onTabChange={onTabChange}
        />,
      );
      const info = screen.getByRole("tab", { name: "Info" });
      fireEvent.keyDown(info, { key: "ArrowLeft" });
      expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
    });
  });

  describe("Scroll Arrows (overflow)", () => {
    let savedScrollWidth: PropertyDescriptor | undefined;
    let savedClientWidth: PropertyDescriptor | undefined;
    let savedScrollTo: PropertyDescriptor | undefined;
    let savedScrollLeft: PropertyDescriptor | undefined;

    beforeEach(() => {
      savedScrollWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollWidth",
      );
      savedClientWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "clientWidth",
      );
      savedScrollTo = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollTo",
      );
      savedScrollLeft = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollLeft",
      );
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
      restore("scrollWidth", savedScrollWidth);
      restore("clientWidth", savedClientWidth);
      restore("scrollTo", savedScrollTo);
      restore("scrollLeft", savedScrollLeft);
      vi.restoreAllMocks();
    });

    it("shows right scroll arrow when tabs overflow", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => 1000,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get: () => 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        get: () => 0,
      });

      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );

      expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    });

    it("does not show scroll arrows when tabs fit", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => 500,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get: () => 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        get: () => 0,
      });

      render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );

      expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });

    it("shows left arrow after scrolling away from start", () => {
      let scrollLeftVal = 0;

      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => 1000,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get: () => 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        get: () => scrollLeftVal,
      });

      const { container } = render(
        <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
      );

      expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();

      scrollLeftVal = 200;
      const scrollContainer = container.querySelector(
        "[data-scroll-container]",
      );
      act(() => {
        scrollContainer?.dispatchEvent(new Event("scroll"));
      });

      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    });
  });
});
