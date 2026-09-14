/**
 * useSectionNav tests
 *
 * The one shared hook behind every sticky in-page section nav (#2478 rules 3
 * and 7): scroll-spy active state, plus `scroll-padding-top` on `<html>`
 * derived at runtime from the header's height plus the bar's own measured
 * height — never a hand-written `scroll-mt-*` typed per section. Also
 * covers the scroll-spy rebuilding when the bar resizes, and the
 * composition with `useHashLandingCorrection` (its own logic is tested in
 * `useHashLandingCorrection.test.ts`; this file only proves the wiring).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { createElement, useEffect } from "react";
import {
  FakeIntersectionObserver,
  FakeResizeObserver,
} from "@/../tests/helpers/fake-observers.helpers";
import {
  useSectionNav,
  getStickyHeaderHeight,
  type UseSectionNavResult,
} from "./useSectionNav";

// Section target elements are appended straight to `document.body` (there is
// no host element to render them for real) — tracked here so `afterEach` can
// remove them by reference, without a bespoke marker attribute (every one of
// them already sets a real `id`, which is all these tests query by).
let appendedSectionTargets: Element[] = [];

function appendSectionTarget(id: string): HTMLDivElement {
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  appendedSectionTargets.push(el);
  return el;
}

function emit(
  observerIndex: number,
  entries: Partial<IntersectionObserverEntry>[],
) {
  act(() => {
    FakeIntersectionObserver.instances[observerIndex]!.trigger(entries);
  });
}

function fireResize(observerIndex: number) {
  act(() => {
    FakeResizeObserver.instances[observerIndex]!.trigger();
  });
}

function mockHeight(el: Element, height: number) {
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ height }) as DOMRect,
  });
}

// `useSectionNav` is contracted to be mounted only from a component that
// renders its `<nav>` unconditionally whenever mounted at all (the ≤1
// section check lives one level up, in `<TeamSectionNav>` — see its own
// docblock) — so this host always renders the bar, matching every real
// caller.
function TestHost({
  ids,
  onHook,
}: {
  ids: readonly string[];
  onHook: (h: UseSectionNavResult) => void;
}) {
  const hook = useSectionNav(ids);
  useEffect(() => {
    onHook(hook);
  });
  return createElement("nav", { ref: hook.navRef, "data-testid": "nav" }, null);
}

function renderHook(ids: readonly string[]) {
  let result: UseSectionNavResult | undefined;
  const utils = render(
    createElement(TestHost, {
      ids,
      onHook: (h) => {
        result = h;
      },
    }),
  );
  return {
    get result() {
      return result!;
    },
    ...utils,
  };
}

describe("useSectionNav", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    FakeResizeObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.documentElement.style.scrollPaddingTop = "";
    window.location.hash = "";
    appendedSectionTargets.forEach((el) => el.remove());
    appendedSectionTargets = [];
  });

  it("returns null active id and zero barHeight when no section matches", () => {
    const rendered = renderHook([]);
    expect(rendered.result.activeId).toBeNull();
    expect(rendered.result.barHeight).toBe(0);
  });

  it("sets scroll-padding-top on <html> derived from the header token plus the bar's own measured height", () => {
    renderHook(["a"]);

    expect(document.documentElement.style.scrollPaddingTop).toBe(
      "calc(var(--sticky-header-h) + 0px)",
    );
  });

  it("resets scroll-padding-top on unmount so a later route with no nav isn't stuck with a stale offset", () => {
    const { unmount } = renderHook(["a"]);
    expect(document.documentElement.style.scrollPaddingTop).not.toBe("");
    unmount();
    expect(document.documentElement.style.scrollPaddingTop).toBe("");
  });

  it("marks the topmost intersecting section active", () => {
    const target = appendSectionTarget("spelers");

    const rendered = renderHook(["spelers", "staf"]);
    expect(rendered.result.activeId).toBeNull();

    const spyObserverIndex = FakeIntersectionObserver.instances.length - 1;
    emit(spyObserverIndex, [
      {
        isIntersecting: true,
        target,
        boundingClientRect: { top: 10 } as DOMRectReadOnly,
      },
    ]);

    expect(rendered.result.activeId).toBe("spelers");
  });

  it("picks the entry with the smallest top when multiple sections intersect at once", () => {
    const a = appendSectionTarget("a");
    const b = appendSectionTarget("b");

    const rendered = renderHook(["a", "b"]);
    const spyObserverIndex = FakeIntersectionObserver.instances.length - 1;
    emit(spyObserverIndex, [
      {
        isIntersecting: true,
        target: a,
        boundingClientRect: { top: 50 } as DOMRectReadOnly,
      },
      {
        isIntersecting: true,
        target: b,
        boundingClientRect: { top: 5 } as DOMRectReadOnly,
      },
    ]);

    expect(rendered.result.activeId).toBe("b");
  });

  it("ignores non-intersecting entries", () => {
    const target = appendSectionTarget("spelers");

    const rendered = renderHook(["spelers"]);
    const spyObserverIndex = FakeIntersectionObserver.instances.length - 1;
    emit(spyObserverIndex, [
      {
        isIntersecting: false,
        target,
        boundingClientRect: { top: 10 } as DOMRectReadOnly,
      },
    ]);

    expect(rendered.result.activeId).toBeNull();
  });

  describe("getStickyHeaderHeight", () => {
    afterEach(() => {
      document.documentElement.style.removeProperty("--sticky-header-h");
    });

    it("reads the --sticky-header-h custom property when one is set", () => {
      document.documentElement.style.setProperty("--sticky-header-h", "80px");
      expect(getStickyHeaderHeight()).toBe(80);
    });

    it("falls back to 65 when the custom property can't be read (no stylesheet under vitest)", () => {
      expect(getStickyHeaderHeight()).toBe(65);
    });
  });

  describe("scroll-spy rebuilds when the bar resizes", () => {
    it("disconnects the stale observer and builds a new one with the grown offset", () => {
      appendSectionTarget("spelers");

      renderHook(["spelers"]);
      const firstSpy = FakeIntersectionObserver.instances.at(-1)!;
      expect(firstSpy.disconnected).toBe(false);
      const firstOptions = firstSpy.options;

      // Simulate the bar growing (e.g. HubSearch mounting and wrapping to
      // its own line) via the resize observer that watches the bar itself.
      const navEl = FakeResizeObserver.instances[0]!.observed[0]!;
      mockHeight(navEl, 60);
      fireResize(0);

      expect(firstSpy.disconnected).toBe(true);
      const secondSpy = FakeIntersectionObserver.instances.at(-1)!;
      expect(secondSpy).not.toBe(firstSpy);
      expect(secondSpy.options?.rootMargin).not.toBe(firstOptions?.rootMargin);
    });
  });

  describe("scroll-spy tracks full state across deliveries, not just the latest delta (#2582 review)", () => {
    // Reproduces a real, measured sequence (a fast/native-smooth scroll past
    // a short section straight into the next): the observer's callback only
    // carries targets whose OWN intersection ratio crossed a threshold in
    // that exact delivery — not a full snapshot of every observed target.
    // A batch mentioning only an already-superseded earlier section (its
    // last sliver of overlap finally crossing a threshold) must not
    // overwrite a later section that is still genuinely intersecting but
    // simply wasn't mentioned in that particular batch.
    it("does not let a stale, delta-only re-report of an earlier section override a later one that is still intersecting", () => {
      const a = appendSectionTarget("a");
      const b = appendSectionTarget("b");

      const rendered = renderHook(["a", "b"]);
      const spyObserverIndex = FakeIntersectionObserver.instances.length - 1;

      // "b" (the later section) is read first — its own batch doesn't
      // mention "a" at all.
      emit(spyObserverIndex, [
        {
          isIntersecting: true,
          target: b,
          boundingClientRect: { top: 100 } as DOMRectReadOnly,
        },
      ]);
      expect(rendered.result.activeId).toBe("b");

      // "a" — already mostly scrolled past — briefly re-crosses a
      // threshold with its last sliver of overlap. This transient flip is
      // not itself wrong (it genuinely still overlaps at this instant).
      emit(spyObserverIndex, [
        {
          isIntersecting: true,
          target: a,
          boundingClientRect: { top: -50 } as DOMRectReadOnly,
        },
      ]);
      expect(rendered.result.activeId).toBe("a");

      // "a" finally exits. This batch mentions ONLY "a" — the previous,
      // entries-only reducer saw an empty `visible` array here and simply
      // returned, permanently stuck on "a" even though "b" was still known
      // to be intersecting. The fixed version recomputes from the full
      // state map and falls back to "b".
      emit(spyObserverIndex, [
        {
          isIntersecting: false,
          target: a,
          boundingClientRect: { top: -50 } as DOMRectReadOnly,
        },
      ]);
      expect(rendered.result.activeId).toBe("b");
    });
  });

  describe("hash-landing correction wiring", () => {
    // The correction logic itself (arming, the armed window, the cold-load
    // and webfont-swap triggers) is `useHashLandingCorrection`'s own
    // responsibility and is tested there — this just proves the composition:
    // a bar resize here actually reaches that hook's `notifyLayoutChange`.
    it("notifies the hash-landing correction on every bar resize while armed", () => {
      vi.useFakeTimers();
      const target = appendSectionTarget("structuur");
      const scrollIntoView = vi
        .spyOn(target, "scrollIntoView")
        .mockImplementation(() => {});

      renderHook(["structuur"]);
      scrollIntoView.mockClear();

      act(() => {
        window.location.hash = "#structuur";
        window.dispatchEvent(new Event("hashchange"));
      });

      // The bar grows shortly after (HubSearch mounting) — still inside the
      // armed window, so the landing gets corrected.
      act(() => vi.advanceTimersByTime(200));
      mockHeight(FakeResizeObserver.instances[0]!.observed[0]!, 60);
      fireResize(0);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
  });
});
