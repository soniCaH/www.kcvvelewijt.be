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
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { TeamSectionNav, type TeamSectionNavItem } from "./TeamSectionNav";

// Only the `useSectionNav` scroll-spy tests below register a section target
// with a matching id, so every other test in this file simply never creates
// an observer instance (see the hook's own early-return on zero targets).
function emitIntersecting(target: Element, top: number) {
  act(() => {
    FakeIntersectionObserver.latest()!.trigger([
      {
        isIntersecting: true,
        target,
        boundingClientRect: { top } as DOMRectReadOnly,
      },
    ]);
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

/** Mocks `getBoundingClientRect` on an element — happy-dom has no layout
 *  engine, so this file's rail-geometry tests (the track-scrolling effect)
 *  supply their own left/right edges the way the scroll-arrow tests above
 *  already supply their own `scrollWidth`/`clientWidth`. */
function mockRect(el: Element, rect: { left: number; right: number }) {
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => rect,
  });
}

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

// Section target elements are appended straight to `document.body` — tracked
// here so `afterEach` can remove them by reference, without a bespoke marker
// attribute (every one of them already sets a real `id`, which is all these
// tests query by).
let appendedSectionTargets: Element[] = [];

describe("TeamSectionNav", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.style.scrollPaddingTop = "";
    appendedSectionTargets.forEach((el) => el.remove());
    appendedSectionTargets = [];
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

  // The light chip recipe (border/shadow/no-press-down) and focus-on-click
  // are `<SectionNavChip>`'s own contract — this component delegates
  // rendering to it entirely, so re-asserting either here would be the same
  // hand-copy drift #2478's chip extraction (A1) already fixed one layer up.
  // `SectionNavChip.test.tsx` owns both. This file proves only what is
  // TeamSectionNav's own: that scroll-spy's `activeId` is wired into the
  // right chip's `aria-current`.

  describe("scroll-spy — the fill means the section being read, not the one last clicked", () => {
    function renderWithSections(items: TeamSectionNavItem[]) {
      for (const item of items) {
        const el = document.createElement("div");
        el.id = item.id;
        document.body.appendChild(el);
        appendedSectionTargets.push(el);
      }
      return render(<TeamSectionNav items={items} />);
    }

    it("wires the topmost intersecting section's id into aria-current on its chip", () => {
      renderWithSections(THREE_ITEMS);

      const spelersSection = document.getElementById("spelers")!;
      emitIntersecting(spelersSection, 10);

      const spelersLink = screen.getByRole("link", { name: "Spelers" });
      const stafLink = screen.getByRole("link", { name: "Staf" });

      expect(spelersLink).toHaveAttribute("aria-current", "location");
      expect(stafLink).not.toHaveAttribute("aria-current");
    });

    describe("keeping the active chip reachable inside the overflowing rail (#2640, corrected by review)", () => {
      it("scrolls the TRACK, not the document — moves the chip out from under the arrow gutter", () => {
        renderWithSections(FIVE_ITEMS);

        const list = screen.getByRole("list");
        const stafLink = screen.getByRole("link", { name: "Staf" });

        // A 300px-wide track with the real overflow-driven 40px gutter on
        // each side (`<ScrollRail>`'s `pl-10 pr-10`) — so the visible
        // window is [40, 260]. The chip sits at [280, 330]: past the
        // right gutter, its right edge 70px beyond the visible window.
        mockRect(list, { left: 0, right: 300 });
        list.style.paddingLeft = "40px";
        list.style.paddingRight = "40px";
        mockRect(stafLink, { left: 280, right: 330 });
        Object.defineProperty(list, "scrollLeft", {
          configurable: true,
          value: 50,
        });
        const scrollToSpy = vi.fn();
        Object.defineProperty(list, "scrollTo", {
          configurable: true,
          value: scrollToSpy,
        });
        const documentScrollIntoViewSpy = vi.spyOn(
          HTMLElement.prototype,
          "scrollIntoView",
        );

        const stafSection = document.getElementById("staf")!;
        emitIntersecting(stafSection, 10);

        // 50 (current scrollLeft) + 70 (how far past the visible window's
        // right edge the chip's own right edge sits) = 120.
        expect(scrollToSpy).toHaveBeenCalledWith({
          left: 120,
          behavior: "smooth",
        });
        // The fix this replaces called `chip.scrollIntoView`, which also
        // walks the document — a real regression (review finding 1): the
        // chip's sticky-bar position always sits inside the band
        // `scroll-padding-top` excludes, so `block: "nearest"` judged it
        // permanently "not visible" and scrolled the ROOT on every
        // scroll-spy tick, truncating an in-flight anchor jump. Proving
        // it's gone means proving `scrollIntoView` is never called at all
        // here, not just called with different arguments.
        expect(documentScrollIntoViewSpy).not.toHaveBeenCalled();
      });

      it("does nothing when the active chip is already fully clear of the gutter", () => {
        renderWithSections(FIVE_ITEMS);

        const list = screen.getByRole("list");
        const stafLink = screen.getByRole("link", { name: "Staf" });

        mockRect(list, { left: 0, right: 300 });
        list.style.paddingLeft = "40px";
        list.style.paddingRight = "40px";
        // Fully inside the visible window [40, 260].
        mockRect(stafLink, { left: 100, right: 150 });
        const scrollToSpy = vi.fn();
        Object.defineProperty(list, "scrollTo", {
          configurable: true,
          value: scrollToSpy,
        });

        const stafSection = document.getElementById("staf")!;
        emitIntersecting(stafSection, 10);

        expect(scrollToSpy).not.toHaveBeenCalled();
      });

      it("guards against activeId being null — a missing guard here would coerce into the literal selector '#null' and match a real chip", () => {
        // The regression this proves (review finding 3): a chip literally
        // ID'd "null" is a deliberately adversarial fixture. Without
        // `if (!activeId) return`, the template literal
        // `a[href="#${activeId}"]` stringifies a null activeId to the
        // selector `a[href="#null"]` — which THIS chip's real `id: "null"`
        // satisfies, even though scroll-spy never activated anything.
        //
        // The interesting effect run here is the MOUNT-time one — the
        // component always fires this effect once on mount, with
        // `activeId` still null — so the geometry mocks must exist on the
        // shared prototype BEFORE `render()`, not on a specific instance
        // afterwards (an instance only exists once render has already run
        // the effect once). A test that mocked per-instance after
        // rendering, like the two above, would silently observe the
        // WRONG effect invocation and pass regardless of the guard — the
        // exact flaw the reviewer found in the original version of this
        // test.
        // This mocks the shared PROTOTYPE, unlike `mockRect` (per-instance)
        // above — restore it explicitly afterwards so it can't leak into a
        // later test's own `getBoundingClientRect` calls (`react-testing-
        // library`/`user-event` read it internally too).
        const originalRect = HTMLElement.prototype.getBoundingClientRect;
        const scrollToSpy = vi.fn();
        Object.defineProperty(HTMLElement.prototype, "scrollTo", {
          configurable: true,
          value: scrollToSpy,
        });
        Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
          configurable: true,
          // Every element reports geometry that WOULD trigger a scroll if
          // reached — the track's 300px box and an out-of-gutter chip box
          // — so reaching the "null" chip at all (guard removed) fires
          // `scrollTo`; never reaching it (guard present) does not. `height`
          // is also supplied — `useSectionNav`'s own unrelated bar-height
          // measurement reads it off this same element via this prototype
          // mock, and an `undefined` there is worth avoiding even though
          // it's harmless to this test's own assertion.
          value(this: HTMLElement) {
            return this.tagName === "UL"
              ? { left: 0, right: 300, top: 0, height: 0 }
              : { left: 280, right: 330, top: 0, height: 0 };
          },
        });

        try {
          const itemsWithNullId: TeamSectionNavItem[] = [
            { id: "null", label: "Null" },
            { id: "staf", label: "Staf" },
          ];
          renderWithSections(itemsWithNullId);

          // No intersection has fired — activeId is still null.
          expect(scrollToSpy).not.toHaveBeenCalled();
        } finally {
          Object.defineProperty(
            HTMLElement.prototype,
            "getBoundingClientRect",
            originalRect
              ? { configurable: true, value: originalRect }
              : { configurable: true, value: undefined },
          );
        }
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
