/**
 * PlayerCard Component Tests — diagonal-cut redesign
 *
 * The redesigned PlayerCard renders an `<a>` (no `<article>` wrapper, no
 * forwardRef), uses CSS `clip-path` on an inner photo wrapper, places a
 * stencil-font jersey number on the diagonal seam, and animates a center-
 * scaled hover accent bar at the top. The `variant` and `isCaptain` props
 * have been removed.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerCard } from "./PlayerCard";

describe("PlayerCard (diagonal redesign)", () => {
  const defaultProps = {
    firstName: "Kevin",
    lastName: "De Bruyne",
    position: "Middenvelder",
    href: "/player/kevin-de-bruyne",
    number: 7,
  };

  it("renders an <a> linking to href", () => {
    render(<PlayerCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/player/kevin-de-bruyne");
  });

  it("renders the player's first and last name", () => {
    render(<PlayerCard {...defaultProps} />);
    expect(screen.getByText("Kevin")).toBeInTheDocument();
    expect(screen.getByText("De Bruyne")).toBeInTheDocument();
  });

  it("renders the position label", () => {
    render(<PlayerCard {...defaultProps} />);
    expect(screen.getByText("Middenvelder")).toBeInTheDocument();
  });

  it("renders the jersey number in a stencil-font element", () => {
    const { container } = render(<PlayerCard {...defaultProps} number={10} />);
    const numberEl = container.querySelector('[data-testid="player-number"]');
    expect(numberEl).not.toBeNull();
    expect(numberEl).toHaveTextContent("10");
    // Stenciletta font + white text-stroke per the design
    expect(numberEl).toHaveStyle({ fontFamily: "stenciletta, sans-serif" });
  });

  it("omits the jersey number element when `number` is not provided", () => {
    const { container } = render(
      <PlayerCard {...defaultProps} number={undefined} />,
    );
    expect(container.querySelector('[data-testid="player-number"]')).toBeNull();
  });

  it("clips the photo wrapper with the diagonal polygon", () => {
    const { container } = render(<PlayerCard {...defaultProps} />);
    const clipped = container.querySelector(
      '[data-testid="player-photo-clip"]',
    );
    expect(clipped).not.toBeNull();
    // The exact polygon defined in the design spec
    expect((clipped as HTMLElement).style.clipPath).toBe(
      "polygon(0 0, 100% 0, 100% 86%, 0 100%)",
    );
  });

  it("has a `relative shrink-0` photo wrapper for equal-height grid layout", () => {
    const { container } = render(<PlayerCard {...defaultProps} />);
    const wrapper = container.querySelector(
      '[data-testid="player-photo-wrapper"]',
    );
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass("relative");
    expect(wrapper).toHaveClass("shrink-0");
  });

  it("renders the card root as a full-height flex column", () => {
    render(<PlayerCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("flex");
    expect(link).toHaveClass("h-full");
    expect(link).toHaveClass("flex-col");
  });

  it("renders a hover accent bar that scales from the center on hover", () => {
    const { container } = render(<PlayerCard {...defaultProps} />);
    const accent = container.querySelector(
      '[data-testid="player-hover-accent"]',
    );
    expect(accent).not.toBeNull();
    expect(accent).toHaveClass("bg-kcvv-green-bright");
    expect(accent).toHaveClass("origin-center");
    expect(accent).toHaveClass("scale-x-0");
    expect(accent).toHaveClass("group-hover:scale-x-100");
  });

  it("renders the loading skeleton when `isLoading` is true", () => {
    const { container } = render(<PlayerCard {...defaultProps} isLoading />);
    expect(screen.getByLabelText("Laden...")).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
    expect(screen.queryByText("Kevin")).not.toBeInTheDocument();
  });

  it("renders the player photo when `imageUrl` is provided", () => {
    render(
      <PlayerCard {...defaultProps} imageUrl="https://example.com/photo.jpg" />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Kevin De Bruyne");
  });
});
