/**
 * ScrollRail tests — the "row of discrete things" idiom shared by
 * FilterTabs, TeamSectionNav and the organigram breadcrumb (#2444, as
 * amended by #2489). Held space follows real overflow; the spent arrow
 * disables in place.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollRail } from "./ScrollRail";

function mockScrollDimensions(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });
}

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

describe("ScrollRail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).scrollWidth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).clientWidth;
  });

  it("renders children inside the track", () => {
    render(
      <ScrollRail>
        <span data-testid="item">Item</span>
      </ScrollRail>,
    );
    expect(screen.getByTestId("item")).toBeInTheDocument();
  });

  it("renders the track with the given element type", () => {
    const { container } = render(
      <ScrollRail as="ul">
        <li>Item</li>
      </ScrollRail>,
    );
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("mounts no arrows and no rail padding when the row fits", () => {
    mockScrollDimensions(400, 400);
    const { container } = render(
      <ScrollRail trackClassName="track">
        <span>Item</span>
      </ScrollRail>,
    );

    expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    const track = container.querySelector(".track") as HTMLElement;
    expect(track.className).not.toContain("pl-10");
    expect(track.className).not.toContain("pr-10");
  });

  it("mounts both control arrows with a held rail once the row overflows", () => {
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollRail trackClassName="track">
        <span>Item</span>
      </ScrollRail>,
    );

    const left = screen.getByLabelText("Scroll left");
    const right = screen.getByLabelText("Scroll right");
    expect(left).toHaveClass("bg-jersey-deep");
    expect(right).toHaveClass("bg-jersey-deep");

    const track = container.querySelector(".track") as HTMLElement;
    expect(track.className).toContain("pl-10");
    expect(track.className).toContain("pr-10");
  });

  it("disables the left arrow in place at the start of the track, not the right", () => {
    mockScrollDimensions(900, 400);
    render(
      <ScrollRail>
        <span>Item</span>
      </ScrollRail>,
    );

    expect(screen.getByLabelText("Scroll left")).toBeDisabled();
    expect(screen.getByLabelText("Scroll right")).toBeEnabled();
  });

  it("disables the right arrow in place at the end of the track, keeping both mounted", () => {
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollRail>
        <span>Item</span>
      </ScrollRail>,
    );

    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    Object.defineProperty(track, "scrollLeft", { value: 500 });
    runAnimationFrameSynchronously();
    act(() => {
      track.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    expect(screen.getByLabelText("Scroll right")).toBeDisabled();
    expect(screen.getByLabelText("Scroll left")).toBeEnabled();
  });

  it("scrolls the track when an arrow is clicked", async () => {
    mockScrollDimensions(900, 400);
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });
    const user = userEvent.setup();
    render(
      <ScrollRail>
        <span>Item</span>
      </ScrollRail>,
    );

    await user.click(screen.getByLabelText("Scroll right"));
    expect(scrollToMock).toHaveBeenCalled();
  });

  it("names the track with the given aria-label and role", () => {
    mockScrollDimensions(400, 400);
    const { container } = render(
      <ScrollRail role="group" ariaLabel="Sectienavigatie">
        <span>Item</span>
      </ScrollRail>,
    );
    const track = container.querySelector('[role="group"]') as HTMLElement;
    expect(track).toHaveAttribute("aria-label", "Sectienavigatie");
  });

  it("makes the track keyboard-reachable (tabIndex=0)", () => {
    mockScrollDimensions(400, 400);
    const { container } = render(
      <ScrollRail>
        <span>Item</span>
      </ScrollRail>,
    );
    expect(container.querySelector('[tabindex="0"]')).toBeInTheDocument();
  });

  it("merges arrowClassName onto both arrows (e.g. a dark-panel shadow override)", () => {
    mockScrollDimensions(900, 400);
    render(
      <ScrollRail arrowClassName="dark-shadow-override">
        <span>Item</span>
      </ScrollRail>,
    );
    expect(screen.getByLabelText("Scroll left")).toHaveClass(
      "dark-shadow-override",
    );
    expect(screen.getByLabelText("Scroll right")).toHaveClass(
      "dark-shadow-override",
    );
  });

  it("does not expose a register prop — every arrow it renders is control", () => {
    mockScrollDimensions(900, 400);
    render(
      <ScrollRail>
        <span>Item</span>
      </ScrollRail>,
    );
    // control register is 32x32 (h-8 w-8), never the paper register's 48x48.
    expect(screen.getByLabelText("Scroll right")).toHaveClass("h-8");
    expect(screen.getByLabelText("Scroll right")).not.toHaveClass("h-12");
  });
});
