import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrandedTabs, type BrandedTab } from "./BrandedTabs";

const tabs: BrandedTab[] = [
  { id: "info", label: "Info" },
  { id: "spelers", label: "Spelers" },
  { id: "wedstrijden", label: "Wedstrijden" },
];

describe("BrandedTabs", () => {
  it("renders all tab labels as tab role buttons", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
    );
    tabs.forEach((tab) => {
      expect(screen.getByRole("tab", { name: tab.label })).toBeInTheDocument();
    });
  });

  it("marks the active tab with aria-selected and tabIndex 0", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="spelers" onTabChange={() => {}} />,
    );
    const active = screen.getByRole("tab", { name: "Spelers" });
    expect(active).toHaveAttribute("aria-selected", "true");
    expect(active).toHaveAttribute("tabindex", "0");
  });

  it("highlights the active tab with the green bottom border classes", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="spelers" onTabChange={() => {}} />,
    );
    const active = screen.getByRole("tab", { name: "Spelers" });
    expect(active).toHaveClass("border-kcvv-green-bright");
    expect(active).toHaveClass("text-kcvv-green-dark");
  });

  it("renders inactive tabs with transparent border and gray text", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
    );
    const inactive = screen.getByRole("tab", { name: "Spelers" });
    expect(inactive).toHaveClass("border-transparent");
    expect(inactive).toHaveClass("text-kcvv-gray-blue");
    expect(inactive).toHaveAttribute("aria-selected", "false");
    expect(inactive).toHaveAttribute("tabindex", "-1");
  });

  it("calls onTabChange exactly once with the clicked tab id", () => {
    const onTabChange = vi.fn();
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Wedstrijden" }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
  });

  it("does not call onTabChange when clicking the already-active tab", () => {
    const onTabChange = vi.fn();
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Info" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("moves selection right with ArrowRight and updates tabIndex", () => {
    const onTabChange = vi.fn();
    const { rerender } = render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
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
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    const info = screen.getByRole("tab", { name: "Info" });
    fireEvent.keyDown(info, { key: "ArrowLeft" });
    expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
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

  it("applies touch-active pressed state classes on tab buttons", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
    );
    const tab = screen.getByRole("tab", { name: "Spelers" });
    expect(tab.className).toContain("active:scale-[0.98]");
  });

  it("uses higher-contrast text for inactive tabs", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
    );
    const inactive = screen.getByRole("tab", { name: "Spelers" });
    expect(inactive).toHaveClass("text-kcvv-gray-blue");
  });

  it("applies transition classes for smooth active-state changes", () => {
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

  describe("Scroll Arrows", () => {
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
