import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StampBadge } from "./StampBadge";

describe("StampBadge", () => {
  it("renders children", () => {
    render(<StampBadge>★ Inschrijving</StampBadge>);
    expect(screen.getByText(/Inschrijving/)).toBeInTheDocument();
  });

  it("default props: tone='jersey', position='top-right', rotation=2deg", () => {
    const { container } = render(<StampBadge>X</StampBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-tone", "jersey");
    expect(el).toHaveAttribute("data-position", "top-right");
    expect(el.style.transform).toBe("rotate(2deg)");
  });

  it("default tone applies jersey-deep body + cream text", () => {
    const { container } = render(<StampBadge>X</StampBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/bg-jersey-deep/);
    expect(el.className).toMatch(/text-cream/);
  });

  it("tone='ink' applies ink body + cream text", () => {
    const { container } = render(<StampBadge tone="ink">X</StampBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-tone", "ink");
    expect(el.className).toMatch(/bg-ink/);
    expect(el.className).toMatch(/text-cream/);
  });

  it("tone='alert' applies alert body + white text", () => {
    const { container } = render(<StampBadge tone="alert">VOLZET</StampBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-tone", "alert");
    expect(el.className).toMatch(/bg-alert/);
    expect(el.className).toMatch(/text-white/);
  });

  it("border + shadow are ink across all tones (chrome rule)", () => {
    for (const tone of ["jersey", "ink", "alert"] as const) {
      const { container } = render(<StampBadge tone={tone}>X</StampBadge>);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toMatch(/border-ink/);
      expect(el.className).toMatch(/shadow-\[4px_4px_0_0_var\(--color-ink\)\]/);
    }
  });

  it("default position='top-right' anchors to the right edge", () => {
    const { container } = render(<StampBadge>X</StampBadge>);
    expect((container.firstChild as HTMLElement).className).toMatch(/right-9/);
  });

  it("position='top-left' sets data-position and left anchor class", () => {
    const { container } = render(
      <StampBadge position="top-left">X</StampBadge>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-position", "top-left");
    expect(el.className).toMatch(/left-9/);
  });

  it("custom rotation accepts negative values", () => {
    const { container } = render(<StampBadge rotation={-3}>X</StampBadge>);
    expect((container.firstChild as HTMLElement).style.transform).toBe(
      "rotate(-3deg)",
    );
  });

  it("rotation=0 disables the tilt", () => {
    const { container } = render(<StampBadge rotation={0}>X</StampBadge>);
    expect((container.firstChild as HTMLElement).style.transform).toBe(
      "rotate(0deg)",
    );
  });

  it("is positioned absolutely (parent must be position: relative)", () => {
    const { container } = render(<StampBadge>X</StampBadge>);
    expect((container.firstChild as HTMLElement).className).toMatch(/absolute/);
  });

  it("merges className with the computed classes", () => {
    const { container } = render(
      <StampBadge className="custom-y">X</StampBadge>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-y",
    );
  });

  it("typography is mono caps with 0.1em tracking", () => {
    const { container } = render(<StampBadge>X</StampBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/font-mono/);
    expect(el.className).toMatch(/uppercase/);
    expect(el.className).toMatch(/tracking-\[0\.1em\]/);
  });
});
