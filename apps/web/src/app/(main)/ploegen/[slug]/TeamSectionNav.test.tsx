/**
 * TeamSectionNav tests
 *
 * Renders nothing at ≤1 section. The scroll arrow follows real overflow at
 * the current width (#2444, as corrected by #2478 and #2489) — it is not
 * permanently inert: today's three-item row is pre-season, not a fixed
 * ceiling, and the arrow's reserved 40px rail on both sides tracks
 * `useScrollHint`'s `overflows`, the same "row of discrete things" rule
 * `<FilterTabs>` uses, rather than a breakpoint-gated rail.
 *
 * The item itself is the *light* chip (#2478 rule 1), filled by scroll-spy
 * on every route (rule 3) via the shared `useSectionNav` hook — not the
 * heavier `<FilterTabs>` chip, and not a colour-only bare link.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamSectionNav, type TeamSectionNavItem } from "./TeamSectionNav";

// IntersectionObserver stub — happy-dom doesn't implement it. Only the
// `useSectionNav` scroll-spy tests below register a section target with a
// matching id, so every other test in this file simply never creates an
// observer instance (see the hook's own early-return on zero targets).
let observerCb: IntersectionObserverCallback | null = null;

class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    observerCb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function emitIntersecting(target: Element, top: number) {
  act(() => {
    observerCb?.(
      [
        { isIntersecting: true, target, boundingClientRect: { top } },
      ] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
  });
}

const THREE_ITEMS: TeamSectionNavItem[] = [
  { id: "wedstrijden", label: "Wedstrijden" },
  { id: "spelers", label: "Spelers" },
  { id: "staf", label: "Staf" },
];

const FIVE_ITEMS: TeamSectionNavItem[] = [
  { id: "klassement", label: "Klassement" },
  { id: "wedstrijden", label: "Wedstrijden" },
  { id: "spelers", label: "Spelers" },
  { id: "staf", label: "Staf" },
  { id: "info", label: "Info" },
];

function mockScrollDimensions(scrollWidth: number, clientWidth: number) {
  const originalScrollWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollWidth",
  );
  const originalClientWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientWidth",
  );

  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });

  return () => {
    if (originalScrollWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollWidth",
        originalScrollWidth,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (HTMLElement.prototype as any).scrollWidth;
    }
    if (originalClientWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientWidth",
        originalClientWidth,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (HTMLElement.prototype as any).clientWidth;
    }
  };
}

describe("TeamSectionNav", () => {
  beforeEach(() => {
    observerCb = null;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.style.scrollPaddingTop = "";
    document
      .querySelectorAll("[data-team-section-nav-test]")
      .forEach((el) => el.remove());
  });

  it("renders nothing with zero sections", () => {
    const { container } = render(<TeamSectionNav items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing with exactly one section", () => {
    const { container } = render(
      <TeamSectionNav items={[{ id: "spelers", label: "Spelers" }]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders every item as an anchor link", () => {
    render(<TeamSectionNav items={THREE_ITEMS} />);
    expect(screen.getByRole("link", { name: "Wedstrijden" })).toHaveAttribute(
      "href",
      "#wedstrijden",
    );
    expect(screen.getByRole("link", { name: "Spelers" })).toHaveAttribute(
      "href",
      "#spelers",
    );
    expect(screen.getByRole("link", { name: "Staf" })).toHaveAttribute(
      "href",
      "#staf",
    );
  });

  it("renders the light chip recipe — 1px border, 1px shadow, no press-down — never the filter chip's weight", () => {
    render(<TeamSectionNav items={THREE_ITEMS} />);
    const link = screen.getByRole("link", { name: "Spelers" });

    expect(link).toHaveClass("border");
    expect(link).not.toHaveClass("border-2");
    expect(link.className).toContain("shadow-[1px_1px_0_0_var(--color-ink)]");
    // No press-down: the filter chip's canonical hover translate is absent.
    expect(link).not.toHaveClass("hover:translate-x-1");
  });

  describe("scroll-spy — the fill means the section being read, not the one last clicked", () => {
    function renderWithSections(items: TeamSectionNavItem[]) {
      for (const item of items) {
        const el = document.createElement("div");
        el.id = item.id;
        el.setAttribute("data-team-section-nav-test", "");
        document.body.appendChild(el);
      }
      return render(<TeamSectionNav items={items} />);
    }

    it("fills the chip for the topmost intersecting section", () => {
      renderWithSections(THREE_ITEMS);

      const spelersSection = document.getElementById("spelers")!;
      emitIntersecting(spelersSection, 10);

      const spelersLink = screen.getByRole("link", { name: "Spelers" });
      const stafLink = screen.getByRole("link", { name: "Staf" });

      expect(spelersLink).toHaveAttribute("aria-current", "location");
      expect(spelersLink).toHaveClass("bg-jersey-deep");
      expect(stafLink).not.toHaveAttribute("aria-current");
    });

    it("moves focus into the target section on click, unlike today's bare link", async () => {
      const user = userEvent.setup();
      renderWithSections(THREE_ITEMS);

      const stafSection = document.getElementById("staf")!;
      const focusSpy = vi.spyOn(stafSection, "focus");

      await user.click(screen.getByRole("link", { name: "Staf" }));

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    it("scrolls the newly-active chip into view inside the horizontal rail (#2640)", () => {
      renderWithSections(FIVE_ITEMS);

      const stafLink = screen.getByRole("link", { name: "Staf" });
      const scrollIntoViewSpy = vi
        .spyOn(stafLink, "scrollIntoView")
        .mockImplementation(() => {});

      const stafSection = document.getElementById("staf")!;
      emitIntersecting(stafSection, 10);

      // `block: "nearest"` so this never fights the page's own vertical
      // scroll (the sticky bar is already on-screen whenever scroll-spy
      // fires) — only `inline` moves anything, sliding the rail.
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: "nearest",
        inline: "nearest",
      });
    });

    it("does not slide the rail before scroll-spy has picked an active section", () => {
      const prototypeSpy = vi
        .spyOn(HTMLElement.prototype, "scrollIntoView")
        .mockImplementation(() => {});

      renderWithSections(THREE_ITEMS);

      // `block: "start"` calls belong to the unrelated hash-landing
      // correction (`useHashLandingCorrection`), which this suite does not
      // own — only this effect's own `{ block: "nearest", inline: "nearest"
      // }` signature is under test here.
      expect(prototypeSpy).not.toHaveBeenCalledWith({
        block: "nearest",
        inline: "nearest",
      });
    });
  });

  describe("scroll arrow — real overflow, not a permanent ceiling", () => {
    it("mounts no arrow when the row fits (today's pre-season three-item case)", () => {
      const restore = mockScrollDimensions(300, 300);
      render(<TeamSectionNav items={THREE_ITEMS} />);

      expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
      restore();
    });

    it("mounts the control arrow with a reserved rail once the row overflows (e.g. full five-section count on a narrow width)", () => {
      const restore = mockScrollDimensions(700, 343);
      render(<TeamSectionNav items={FIVE_ITEMS} />);

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow).toBeInTheDocument();
      expect(rightArrow).toHaveClass("bg-jersey-deep");
      expect(rightArrow).toHaveClass("h-8");

      const list = screen.getByRole("list");
      expect(list).toHaveClass("pl-10");
      expect(list).toHaveClass("pr-10");
      restore();
    });

    it("disables the spent direction in place instead of unmounting it", () => {
      const restore = mockScrollDimensions(700, 343);
      render(<TeamSectionNav items={FIVE_ITEMS} />);

      const list = screen.getByRole("list");
      Object.defineProperty(list, "scrollLeft", { value: 357 });
      act(() => {
        list.dispatchEvent(new Event("scroll"));
      });

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow).toBeInTheDocument();
      expect(rightArrow).toBeDisabled();
      expect(screen.getByLabelText("Scroll left")).toBeEnabled();
      restore();
    });

    it("scrolls the list when the arrow is clicked", async () => {
      const user = userEvent.setup();
      const restore = mockScrollDimensions(700, 343);
      Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: vi.fn(),
      });
      render(<TeamSectionNav items={FIVE_ITEMS} />);

      await user.click(screen.getByLabelText("Scroll right"));
      expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
      restore();
    });
  });
});
