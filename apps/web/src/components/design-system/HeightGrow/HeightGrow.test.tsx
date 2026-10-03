import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { HeightGrow } from "./HeightGrow";

/** happy-dom's TransitionEvent drops `propertyName` from its init: set it by hand. */
function transitionEnd(el: Element, propertyName: string) {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: propertyName });
  fireEvent(el, event);
}

function reduceMotion(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({ matches: reduced, media: query }) as MediaQueryList,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("HeightGrow onOpenSettled", () => {
  it("fires when the wrapper's own height transition ends open", () => {
    const onOpenSettled = vi.fn();
    const { container } = render(
      <HeightGrow open onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    transitionEnd(container.firstElementChild!, "grid-template-rows");
    expect(onOpenSettled).toHaveBeenCalledTimes(1);
  });

  it("ignores other properties, a child's transition and a close", () => {
    const onOpenSettled = vi.fn();
    const { container, getByText, rerender } = render(
      <HeightGrow open onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    const grow = container.firstElementChild!;
    transitionEnd(grow, "opacity");
    transitionEnd(getByText("content"), "grid-template-rows");
    rerender(
      <HeightGrow open={false} onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    transitionEnd(grow, "grid-template-rows");
    expect(onOpenSettled).not.toHaveBeenCalled();
  });

  it("under reduced motion fires right after the open commits, not on mount", () => {
    reduceMotion(true);
    const onOpenSettled = vi.fn();
    const { rerender } = render(
      <HeightGrow open={false} onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    expect(onOpenSettled).not.toHaveBeenCalled();
    rerender(
      <HeightGrow open onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    expect(onOpenSettled).toHaveBeenCalledTimes(1);

    onOpenSettled.mockClear();
    render(
      <HeightGrow open onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    expect(onOpenSettled).not.toHaveBeenCalled();
  });

  it("with motion, an open commit alone does not fire (it waits for the event)", () => {
    reduceMotion(false);
    const onOpenSettled = vi.fn();
    const { rerender } = render(
      <HeightGrow open={false} onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    rerender(
      <HeightGrow open onOpenSettled={onOpenSettled}>
        <p>content</p>
      </HeightGrow>,
    );
    expect(onOpenSettled).not.toHaveBeenCalled();
  });
});
