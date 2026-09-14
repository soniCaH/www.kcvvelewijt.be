/**
 * useHashLandingCorrection tests
 *
 * Corrects a hash navigation's landing spot when something above the target
 * changes size after the browser already computed its scroll target — a
 * bar resize (notified explicitly) or a late webfont swap (a `FontFaceSet`
 * `loadingdone` event), both scoped to a short "armed" window after a real
 * hash navigation.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { createElement, useEffect } from "react";
import {
  useHashLandingCorrection,
  type UseHashLandingCorrectionResult,
} from "./useHashLandingCorrection";

function TestHost({
  ids,
  onHook,
}: {
  ids: readonly string[];
  onHook: (h: UseHashLandingCorrectionResult) => void;
}) {
  const hook = useHashLandingCorrection(ids);
  useEffect(() => {
    onHook(hook);
  });
  return null;
}

function renderHook(ids: readonly string[]) {
  let result: UseHashLandingCorrectionResult | undefined;
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

// Target elements are appended straight to `document.body` — tracked here so
// `afterEach` can remove them by reference, without a bespoke marker
// attribute (every one of them already sets a real `id`, which is all these
// tests query by).
let appendedTargets: Element[] = [];

function appendTarget(id: string): HTMLDivElement {
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  appendedTargets.push(el);
  return el;
}

describe("useHashLandingCorrection", () => {
  afterEach(() => {
    vi.useRealTimers();
    window.location.hash = "";
    appendedTargets.forEach((el) => el.remove());
    appendedTargets = [];
  });

  it("corrects a hash already in the URL at mount (a cold load)", () => {
    window.location.hash = "#spelers";
    const target = appendTarget("spelers");
    const scrollIntoView = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation(() => {});

    renderHook(["spelers"]);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("corrects on a FontFaceSet loadingdone event, on a cold load", () => {
    // happy-dom has no `document.fonts` at all (unlike a real browser) —
    // stub the `addEventListener`/`removeEventListener` pair so the
    // effect's `loadingdone` wiring is actually exercised rather than
    // silently short-circuiting. `document.fonts.ready` is deliberately NOT
    // used for this trigger — it can resolve for an already-cached fallback
    // face well before the real webfont's own network fetch even starts
    // (measured on `/jeugd#visie` — see the hook's own docblock).
    let loadingDoneHandler: (() => void) | undefined;
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        addEventListener: (event: string, handler: () => void) => {
          if (event === "loadingdone") loadingDoneHandler = handler;
        },
        removeEventListener: vi.fn(),
      },
    });

    window.location.hash = "#visie";
    const target = appendTarget("visie");
    const scrollIntoView = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation(() => {});

    renderHook(["visie"]);
    // The mount-time synchronous correction (cold-load path) already fired
    // once — clear it so the assertion below is specifically about the
    // loadingdone trigger, not a false positive from that first call.
    scrollIntoView.mockClear();

    act(() => loadingDoneHandler?.());

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).fonts;
  });

  it("does not correct on the hashchange itself — that would race the browser's own in-flight native scroll", () => {
    const target = appendTarget("structuur");
    const scrollIntoView = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation(() => {});

    renderHook(["structuur"]);
    scrollIntoView.mockClear();

    act(() => {
      window.location.hash = "#structuur";
      window.dispatchEvent(new Event("hashchange"));
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("corrects on notifyLayoutChange() while armed after a hashchange (a bar resize mid-scroll)", () => {
    vi.useFakeTimers();
    const target = appendTarget("structuur");
    const scrollIntoView = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation(() => {});

    const rendered = renderHook(["structuur"]);
    scrollIntoView.mockClear();

    act(() => {
      window.location.hash = "#structuur";
      window.dispatchEvent(new Event("hashchange"));
    });

    act(() => vi.advanceTimersByTime(200));
    act(() => rendered.result.notifyLayoutChange());

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("does not correct via notifyLayoutChange() once the armed window has elapsed", () => {
    vi.useFakeTimers();
    const target = appendTarget("structuur");
    const scrollIntoView = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation(() => {});

    const rendered = renderHook(["structuur"]);
    scrollIntoView.mockClear();

    act(() => {
      window.location.hash = "#structuur";
      window.dispatchEvent(new Event("hashchange"));
    });

    act(() => vi.advanceTimersByTime(2000));
    act(() => rendered.result.notifyLayoutChange());

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("ignores a hashchange to a hash that isn't one of the given ids", () => {
    const other = document.createElement("div");
    other.id = "not-ours";
    document.body.appendChild(other);
    const scrollIntoView = vi
      .spyOn(other, "scrollIntoView")
      .mockImplementation(() => {});

    renderHook(["spelers"]);

    act(() => {
      window.location.hash = "#not-ours";
      window.dispatchEvent(new Event("hashchange"));
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    other.remove();
  });
});
