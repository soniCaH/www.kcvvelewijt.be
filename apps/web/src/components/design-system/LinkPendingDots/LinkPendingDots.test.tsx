/**
 * LinkPendingDots Tests
 *
 * `useLinkStatus` is Next.js's own seam (it reads the nearest `<Link>`'s
 * pending state), so it is the one thing mocked here. The 150 ms delay is
 * pure CSS (`.kcvv-pending-reveal`) and is asserted as a class contract —
 * happy-dom does not run animations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkPendingDots } from "./LinkPendingDots";

const useLinkStatus = vi.fn();

vi.mock("next/link", () => ({
  useLinkStatus: () => useLinkStatus(),
}));

describe("LinkPendingDots", () => {
  beforeEach(() => {
    useLinkStatus.mockReset();
  });

  it("renders nothing while the navigation is not pending", () => {
    useLinkStatus.mockReturnValue({ pending: false });
    const { container } = render(<LinkPendingDots />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the compact Spinner while the navigation is pending", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    const { container } = render(<LinkPendingDots />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector(".kcvv-spinner-pulse")).toBeInTheDocument();
  });

  it("delays the reveal on the wrapper, not on the dots (150 ms)", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    render(<LinkPendingDots />);
    expect(screen.getByRole("status")).toHaveClass("kcvv-pending-reveal");
  });

  it("sits after the label by default (inline)", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    render(<LinkPendingDots />);
    const dots = screen.getByRole("status");
    expect(dots).toHaveClass("ml-2");
    expect(dots).not.toHaveClass("absolute");
  });

  it("is lifted out of the flow in the corner placement", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    render(<LinkPendingDots placement="corner" />);
    const dots = screen.getByRole("status");
    expect(dots).toHaveClass("absolute", "pointer-events-none");
    expect(dots).not.toHaveClass("ml-2");
  });

  it("merges a custom className", () => {
    useLinkStatus.mockReturnValue({ pending: true });
    render(<LinkPendingDots placement="corner" className="bottom-2 left-2" />);
    expect(screen.getByRole("status")).toHaveClass("bottom-2", "left-2");
  });
});
