import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, fireEvent } from "@testing-library/react";
import type { RefObject } from "react";
import { useDelegatedClick } from "./useDelegatedClick";

/**
 * Build a real container with a marked element (holding a nested child) and an
 * unmarked sibling, append it to the document, and return a stable ref to it.
 */
function setup() {
  const container = document.createElement("div");

  const marked = document.createElement("button");
  marked.setAttribute("data-match", "");
  const inner = document.createElement("span");
  inner.textContent = "inner";
  marked.appendChild(inner);

  const outside = document.createElement("p");
  outside.textContent = "outside";

  container.append(marked, outside);
  document.body.appendChild(container);

  const ref: RefObject<HTMLElement | null> = { current: container };
  return { container, marked, inner, outside, ref };
}

describe("useDelegatedClick", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("adds a click listener on mount and removes it on unmount", () => {
    const { container, ref } = setup();
    const addSpy = vi.spyOn(container, "addEventListener");
    const removeSpy = vi.spyOn(container, "removeEventListener");

    const { unmount } = renderHook(() =>
      useDelegatedClick(ref, { selector: "[data-match]", onMatch: vi.fn() }),
    );

    expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("invokes onMatch with the matched ancestor when a descendant is clicked", () => {
    const { marked, inner, ref } = setup();
    const onMatch = vi.fn();

    renderHook(() =>
      useDelegatedClick(ref, { selector: "[data-match]", onMatch }),
    );

    fireEvent.click(inner);

    expect(onMatch).toHaveBeenCalledTimes(1);
    expect(onMatch).toHaveBeenCalledWith(marked);
  });

  it("does not invoke onMatch for clicks outside the selector", () => {
    const { outside, ref } = setup();
    const onMatch = vi.fn();

    renderHook(() =>
      useDelegatedClick(ref, { selector: "[data-match]", onMatch }),
    );

    fireEvent.click(outside);

    expect(onMatch).not.toHaveBeenCalled();
  });

  it("does not crash and attaches no listener when the ref is null", () => {
    const ref: RefObject<HTMLElement | null> = { current: null };
    const onMatch = vi.fn();

    expect(() =>
      renderHook(() =>
        useDelegatedClick(ref, { selector: "[data-match]", onMatch }),
      ),
    ).not.toThrow();
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("invokes the latest onMatch after a re-render without re-subscribing", () => {
    const { container, marked, ref } = setup();
    const addSpy = vi.spyOn(container, "addEventListener");
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ onMatch }) =>
        useDelegatedClick(ref, { selector: "[data-match]", onMatch }),
      { initialProps: { onMatch: first } },
    );

    expect(addSpy).toHaveBeenCalledTimes(1);
    fireEvent.click(marked);
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ onMatch: second });

    // Listener subscribed exactly once — no re-subscribe churn on re-render.
    expect(addSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(marked);
    expect(second).toHaveBeenCalledTimes(1);
    // The stale callback is never invoked again.
    expect(first).toHaveBeenCalledTimes(1);
  });
});
