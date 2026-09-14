/**
 * ScrollOverlay tests — the "content scrolled past" idiom shared by
 * HtmlTableBlock, StandingsTable and VolledigOrganigram's chart (#2444, as
 * amended by #2476). No reserved rail; the arrow overlays the edge and
 * mounts per direction on real overflow, with a capped fade.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollOverlay } from "./ScrollOverlay";
import { stubAnimationFrame } from "@/../tests/helpers/scroll-hint.helpers";

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

describe("ScrollOverlay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).scrollWidth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).clientWidth;
  });

  it("renders children inside the track", () => {
    render(
      <ScrollOverlay>
        <span data-testid="item">Item</span>
      </ScrollOverlay>,
    );
    expect(screen.getByTestId("item")).toBeInTheDocument();
  });

  it("mounts no arrows when the content fits", () => {
    mockScrollDimensions(400, 400);
    render(
      <ScrollOverlay>
        <span>Item</span>
      </ScrollOverlay>,
    );
    expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
  });

  it('direction="right" (the default) never mounts a left arrow', () => {
    mockScrollDimensions(900, 400);
    render(
      <ScrollOverlay>
        <span>Item</span>
      </ScrollOverlay>,
    );
    expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
  });

  it('direction="both" mounts a left arrow once scrolled', () => {
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollOverlay direction="both">
        <span>Item</span>
      </ScrollOverlay>,
    );

    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    const { flush } = stubAnimationFrame();
    Object.defineProperty(track, "scrollLeft", { value: 100 });
    act(() => {
      track.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      flush();
    });

    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
  });

  it("re-measures across two separate scroll events, not just the first (regression: #2860)", () => {
    // A naive synchronous rAF mock (`cb(); return 0;`) jams
    // `useScrollHint`'s `scheduleScrollCheck` re-entrancy guard after the
    // very first scroll tick, because the callback resets `rafRef.current`
    // to `null` before the `rafRef.current = requestAnimationFrame(cb)`
    // assignment lands — so the assignment then overwrites it back to a
    // non-null handle. Every later scroll event in the same test is then
    // silently dropped. `stubAnimationFrame`'s queue defers the callback
    // the way a real frame does, so this must keep working across a second,
    // independent scroll + flush cycle.
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollOverlay direction="both">
        <span>Item</span>
      </ScrollOverlay>,
    );

    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    const { flush } = stubAnimationFrame();

    Object.defineProperty(track, "scrollLeft", {
      value: 100,
      configurable: true,
    });
    act(() => {
      track.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      flush();
    });
    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();

    Object.defineProperty(track, "scrollLeft", {
      value: 0,
      configurable: true,
    });
    act(() => {
      track.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      flush();
    });
    expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
  });

  it("mounts the control register (32x32, jersey-deep)", () => {
    mockScrollDimensions(900, 400);
    render(
      <ScrollOverlay>
        <span>Item</span>
      </ScrollOverlay>,
    );
    const arrow = screen.getByLabelText("Scroll right");
    expect(arrow).toHaveClass("h-8");
    expect(arrow).toHaveClass("bg-jersey-deep");
  });

  it("never reserves a rail — the track carries no rail padding", () => {
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollOverlay trackClassName="my-track">
        <span>Item</span>
      </ScrollOverlay>,
    );
    const track = container.querySelector(".my-track") as HTMLElement;
    expect(track.className).not.toContain("pl-10");
    expect(track.className).not.toContain("pr-10");
  });

  it("caps the right fade at 24px and shrinks it as the scroll runs out", () => {
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollOverlay>
        <span>Item</span>
      </ScrollOverlay>,
    );

    let fade = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(fade.style.width).toBe("24px");

    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    const { flush } = stubAnimationFrame();
    // 500px total overflow; scrolled to 485 leaves 15px.
    Object.defineProperty(track, "scrollLeft", { value: 485 });
    act(() => {
      track.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      flush();
    });

    fade = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(fade.style.width).toBe("15px");
  });

  it("applies overflowsClassName whenever the track overflows at all, even once scrolled to the end", () => {
    mockScrollDimensions(400, 400);
    const { container: fitContainer, unmount } = render(
      <ScrollOverlay trackClassName="base" overflowsClassName="anchor-col">
        <span>Item</span>
      </ScrollOverlay>,
    );
    const fitTrack = fitContainer.querySelector(
      '[tabindex="0"]',
    ) as HTMLElement;
    expect(fitTrack.className).not.toContain("anchor-col");
    unmount();

    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollOverlay trackClassName="base" overflowsClassName="anchor-col">
        <span>Item</span>
      </ScrollOverlay>,
    );
    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    expect(track.className).toContain("anchor-col");

    // Scrolled all the way to the end — `canScrollRight` is now false, but
    // the track still overflows at this width, so the anchor must not
    // un-pin (#2582: this reacts to `overflows`, not `canScrollRight`).
    const { flush } = stubAnimationFrame();
    Object.defineProperty(track, "scrollLeft", { value: 500 });
    act(() => {
      track.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      flush();
    });
    expect(track.className).toContain("anchor-col");
  });

  it("renders dangerouslySetInnerHTML on the track instead of children", () => {
    const { container } = render(
      <ScrollOverlay
        dangerouslySetInnerHTML={{
          __html: "<table><tr><td>x</td></tr></table>",
        }}
      />,
    );
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("names the track with the given aria-label and role", () => {
    const { container } = render(
      <ScrollOverlay role="region" ariaLabel="Klassement">
        <span>Item</span>
      </ScrollOverlay>,
    );
    const track = container.querySelector('[role="region"]') as HTMLElement;
    expect(track).toHaveAttribute("aria-label", "Klassement");
  });

  it("makes the track keyboard-reachable (tabIndex=0)", () => {
    const { container } = render(
      <ScrollOverlay>
        <span>Item</span>
      </ScrollOverlay>,
    );
    expect(container.querySelector('[tabindex="0"]')).toBeInTheDocument();
  });

  it("scrolls the track when the arrow is clicked", async () => {
    mockScrollDimensions(900, 400);
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });
    const user = userEvent.setup();
    render(
      <ScrollOverlay>
        <span>Item</span>
      </ScrollOverlay>,
    );

    await user.click(screen.getByLabelText("Scroll right"));
    expect(scrollToMock).toHaveBeenCalled();
  });

  it("merges chromeClassName onto both the arrow and its fade (e.g. print-hiding)", () => {
    mockScrollDimensions(900, 400);
    const { container } = render(
      <ScrollOverlay chromeClassName="vo-no-print">
        <span>Item</span>
      </ScrollOverlay>,
    );
    expect(screen.getByLabelText("Scroll right")).toHaveClass("vo-no-print");
    const fade = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(fade).toHaveClass("vo-no-print");
  });

  it("overrides the default overflow-x-auto via overflowClassName", () => {
    const { container } = render(
      <ScrollOverlay overflowClassName="overflow-auto">
        <span>Item</span>
      </ScrollOverlay>,
    );
    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    expect(track.className).toContain("overflow-auto");
    expect(track.className).not.toContain("overflow-x-auto");
  });

  it("re-checks overflow when a remeasureOn dependency changes", () => {
    let currentScrollWidth = 400;
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get: () => currentScrollWidth,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 400,
    });

    function ZoomHost({ scaleStep }: { scaleStep: number }) {
      return (
        <ScrollOverlay direction="both" remeasureOn={[scaleStep]}>
          <span>Item</span>
        </ScrollOverlay>
      );
    }

    const { rerender } = render(<ZoomHost scaleStep={0} />);
    expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();

    currentScrollWidth = 900;
    act(() => {
      rerender(<ZoomHost scaleStep={1} />);
    });

    expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
  });
});
