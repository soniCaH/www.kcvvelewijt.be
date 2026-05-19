import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapeStrip } from "./TapeStrip";

describe("TapeStrip", () => {
  it("renders with default jersey colour and lg length", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el).toHaveAttribute("data-length", "lg");
  });

  it("respects color and length (non-default values)", () => {
    // Use length="sm" — non-default — so the test catches a regression that
    // would silently fall back to the default lg.
    const { container } = render(<TapeStrip color="ink" length="sm" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-length", "sm");
  });

  it("defaults to position=left and reads var(--tape-left,12%)", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-position", "left");
    expect(el.className).toContain("left-[var(--tape-left,12%)]");
    expect(el.className).not.toContain("right-[var(--tape-right,12%)]");
  });

  it("position=right reads var(--tape-right,12%) and drops the left anchor", () => {
    const { container } = render(<TapeStrip position="right" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-position", "right");
    expect(el.className).toContain("right-[var(--tape-right,12%)]");
    expect(el.className).not.toContain("left-[var(--tape-left,12%)]");
  });

  it("rotation reads var(--tape-rotation,-5deg) so grid slots can auto-vary", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain(
      "var(--tape-rotation, var(--rotate-tape-a))",
    );
    expect(el.style.transform).toContain("translateY(-50%)");
  });

  it("color=cream applies --color-tape-cream as inline background-color", () => {
    // Cream tape is the dedicated tape token (rgb 232 224 200 / 0.85), NOT
    // the body cream surface colour. The bg-cream Tailwind utility must not
    // be applied — that would render the tape invisible on cream cards.
    const { container } = render(<TapeStrip color="cream" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("bg-cream");
    expect(el.style.backgroundColor).toBe("var(--color-tape-cream)");
  });

  it("color=warm applies --tape-warm as inline background-color (regression)", () => {
    const { container } = render(<TapeStrip color="warm" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundColor).toBe("var(--tape-warm)");
  });

  it("rotation prop pins the transform to the named pool entry", () => {
    // Without the prop, transform falls back to var(--tape-rotation).
    // With rotation="c", it skips the var and uses --rotate-tape-c
    // directly — so a per-strip rotation can override grid context.
    const { container } = render(<TapeStrip rotation="c" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-rotation", "c");
    expect(el.style.transform).toContain("var(--rotate-tape-c)");
    expect(el.style.transform).not.toContain("var(--tape-rotation");
  });

  it("defaults verticalEdge to 'top' and renders top-0 with translateY(-50%)", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-vertical-edge", "top");
    expect(el.className).toContain("top-0");
    expect(el.className).not.toContain("bottom-0");
    expect(el.style.transform).toContain("translateY(-50%)");
  });

  it("verticalEdge='bottom' swaps the anchor class to bottom-0 and lifts translateY to +50%", () => {
    // EventFactInline polaroid uses this combination for the bottom-right
    // tape strip per eventfact-inline-locked §Round 1.
    const { container } = render(<TapeStrip verticalEdge="bottom" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-vertical-edge", "bottom");
    expect(el.className).toContain("bottom-0");
    expect(el.className).not.toContain("top-0");
    expect(el.style.transform).toContain("translateY(50%)");
  });

  it("rotation='polaroid-a' maps to --rotate-tape-polaroid-a (steep polaroid tilt, scoped to EventFactInline)", () => {
    const { container } = render(<TapeStrip rotation="polaroid-a" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-rotation", "polaroid-a");
    expect(el.style.transform).toContain("var(--rotate-tape-polaroid-a)");
    expect(el.style.transform).not.toContain("var(--tape-rotation");
  });

  it("rotation='polaroid-b' maps to --rotate-tape-polaroid-b", () => {
    const { container } = render(<TapeStrip rotation="polaroid-b" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-rotation", "polaroid-b");
    expect(el.style.transform).toContain("var(--rotate-tape-polaroid-b)");
  });

  it("verticalEdge='bottom' composes with an explicit rotation pick (translateY(50%) + token)", () => {
    // Exercises the explicit-rotation branch of the transform builder —
    // bottom edge must still flip translateY even when rotation token
    // skips --tape-rotation.
    const { container } = render(
      <TapeStrip verticalEdge="bottom" rotation="polaroid-b" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("translateY(50%)");
    expect(el.style.transform).toContain("var(--rotate-tape-polaroid-b)");
  });

  it("renders above absolutely-positioned siblings (z-20) and is non-interactive", () => {
    // Flush-edge NewsCard has the tape rendered before <Image fill>;
    // without a positive z-index + pointer-events override the image
    // overlays the tape and the tape would intercept clicks meant for
    // the cover link.
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("z-20");
    expect(el.className).toContain("pointer-events-none");
  });
});
