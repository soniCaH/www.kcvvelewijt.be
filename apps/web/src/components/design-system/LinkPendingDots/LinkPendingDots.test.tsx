/**
 * LinkPendingDots Tests
 *
 * `useLinkStatus` is Next.js's own seam (it reads the nearest `<Link>`'s
 * pending state), so it is the one thing mocked here. The 150 ms delay is a
 * timer, driven with fake timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LinkPendingDots, type LinkPendingDotsProps } from "./LinkPendingDots";

const useLinkStatus = vi.fn();

vi.mock("next/link", () => ({
  useLinkStatus: () => useLinkStatus(),
}));

// The dots are `aria-hidden`, so the status role is only reachable with
// `hidden: true`.
const dots = () => screen.getByRole("status", { hidden: true });

const renderPending = (props?: LinkPendingDotsProps) => {
  useLinkStatus.mockReturnValue({ pending: true });
  const result = render(<LinkPendingDots {...props} />);
  act(() => {
    vi.advanceTimersByTime(150);
  });
  return result;
};

describe("LinkPendingDots", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useLinkStatus.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while the navigation is not pending", () => {
    useLinkStatus.mockReturnValue({ pending: false });
    const { container } = render(<LinkPendingDots />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the compact Spinner once the navigation has been pending for 150 ms", () => {
    const { container } = renderPending();
    expect(dots()).toBeInTheDocument();
    expect(container.querySelector(".kcvv-spinner-pulse")).toBeInTheDocument();
  });

  it("shows nothing before 150 ms, and takes no room in the meantime", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    const { container } = render(<LinkPendingDots />);
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(container).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(dots()).toBeInTheDocument();
  });

  it("never shows for a navigation that completes inside 150 ms", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    const { container, rerender } = render(<LinkPendingDots />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    useLinkStatus.mockReturnValue({ pending: false });
    rerender(<LinkPendingDots />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("waits the full 150 ms again on the next tap", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    const { container, rerender } = render(<LinkPendingDots />);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(dots()).toBeInTheDocument();

    useLinkStatus.mockReturnValue({ pending: false });
    rerender(<LinkPendingDots />);
    useLinkStatus.mockReturnValue({ pending: true });
    rerender(<LinkPendingDots />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is decorative for assistive tech — a visual tap acknowledgement only", () => {
    renderPending();
    expect(screen.queryByRole("status")).toBeNull();
    expect(dots()).toHaveAttribute("aria-hidden", "true");
  });

  it("sits after the label with a gap by default (inline)", () => {
    renderPending();
    expect(dots()).toHaveClass("ml-2");
    expect(dots()).not.toHaveClass("absolute");
  });

  it("drops the gap when the parent already spaces its children", () => {
    renderPending({ spaced: false });
    expect(dots()).not.toHaveClass("ml-2");
  });

  it("is lifted out of the flow in the corner placement", () => {
    renderPending({ placement: "corner" });
    expect(dots()).toHaveClass("absolute", "pointer-events-none");
    expect(dots()).not.toHaveClass("ml-2");
  });

  it("keeps jersey-deep dots by default and recolours them cream for a dark ground", () => {
    renderPending();
    expect(dots().className).not.toContain("--spinner-dot");
    renderPending({ tone: "light" });
    expect(
      screen
        .getAllByRole("status", { hidden: true })
        .some((el) =>
          el.className.includes("[--spinner-dot:var(--color-cream)]"),
        ),
    ).toBe(true);
  });

  it("merges a custom className", () => {
    renderPending({ placement: "corner", className: "bottom-2 left-2" });
    expect(dots()).toHaveClass("bottom-2", "left-2");
  });
});
