import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JerseyShirt } from "./JerseyShirt";

describe("JerseyShirt", () => {
  it("is silent — an artefact is not a likeness (#2559 rule 4)", () => {
    // The same drawing stands in for all 294 players, so it identifies nobody.
    // It takes no accessible name and there is no prop to give it one.
    const { container } = render(<JerseyShirt />);
    const figure = container.querySelector("figure");
    expect(figure).toHaveAttribute("aria-hidden", "true");
    expect(figure).not.toHaveAttribute("aria-label");
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  });

  it("does not render the letter overlay when letterOverlay is omitted", () => {
    const { container } = render(<JerseyShirt />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });

  it("does not render the letter overlay for an empty string", () => {
    const { container } = render(<JerseyShirt letterOverlay="" />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });

  it("renders the letter overlay when supplied, marked aria-hidden", () => {
    render(<JerseyShirt letterOverlay="U11" />);
    const overlay = screen.getByText("U11");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("marks the figure and both print-pass layers as aria-hidden", () => {
    const { container } = render(<JerseyShirt />);
    const hiddenLayers = container.querySelectorAll('[aria-hidden="true"]');
    // The figure itself + 2 print passes (underprint + overprint); no overlay
    // in the default render.
    expect(hiddenLayers).toHaveLength(3);
  });

  it("renders all stripe + collar + outline paths verbatim from the shared paths module", () => {
    const { container } = render(<JerseyShirt />);
    // 1 underprint fill + 1 outline + 1 V-collar + 4 stripes = 7 paths total.
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(7);
  });

  it("merges className with cn() so a caller's size and margin win over the defaults (#2777)", () => {
    const { container } = render(<JerseyShirt className="mx-0 h-20 w-20" />);
    const figure = container.querySelector("figure");
    expect(figure).toHaveClass("h-20", "w-20", "mx-0");
    expect(figure).not.toHaveClass("h-60", "w-60", "mx-auto");
  });

  it("scales its inner layers with a caller's requested size instead of a fixed px inset (#2777)", () => {
    // A fixed-px inset only looks right at the 240px default — a caller
    // asking for a smaller figure would slide the outline off the fill and
    // overflow the letter overlay. Once a caller passes a className, every
    // inset must be relative (%/cqw), not an absolute px value tuned for
    // one size.
    const { container } = render(
      <JerseyShirt className="h-20 w-20" letterOverlay="U11" />,
    );
    const insetLayers = container.querySelectorAll('div[aria-hidden="true"]');
    expect(insetLayers.length).toBeGreaterThan(0);
    for (const layer of insetLayers) {
      expect(layer.className).not.toMatch(/-\[\d+px\]/);
      expect(layer.className).not.toMatch(/\b(?:top|right|bottom|left)-\d+\b/);
    }
    const overlay = screen.getByText("U11");
    expect(overlay.style.fontSize).not.toBe("56px");
    expect(overlay.style.fontSize).toContain("cqw");
  });

  it("keeps the literal 240px-default inner layers when no className is passed (#2777)", () => {
    // The scaled (%/cqw) form and the literal px form render the same
    // geometry at 240px but not the same bytes (browser antialiasing on a
    // computed length differs at the sub-pixel level) — so every caller
    // that renders the bare default (no className) must keep getting the
    // literal form, or every existing VR baseline moves for zero reason.
    const { container } = render(<JerseyShirt letterOverlay="U11" />);
    const insetLayers = container.querySelectorAll('div[aria-hidden="true"]');
    expect(insetLayers.length).toBeGreaterThan(0);
    const hasFixedPxInset = Array.from(insetLayers).some((layer) =>
      /-\[\d+px\]|\b(?:top|right|bottom|left)-\d+\b/.test(layer.className),
    );
    expect(hasFixedPxInset).toBe(true);
    const overlay = screen.getByText("U11");
    expect(overlay.style.fontSize).toBe("56px");
  });
});
