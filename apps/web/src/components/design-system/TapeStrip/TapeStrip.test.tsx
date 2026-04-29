import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapeStrip } from "./TapeStrip";

describe("TapeStrip", () => {
  it("renders with default jersey colour and tl position", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el).toHaveAttribute("data-position", "tl");
  });

  it("respects color, position, length", () => {
    const { container } = render(
      <TapeStrip color="ink" position="br" length="lg" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-position", "br");
    expect(el).toHaveAttribute("data-length", "lg");
  });

  it("default rotation is position-driven (tl=-5deg, tape straddles top edge)", () => {
    const { container } = render(<TapeStrip position="tl" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("rotate(-5deg)");
    expect(el.style.transform).toContain("translateY(-50%)");
  });

  it("bottom-position tapes straddle the bottom edge with translateY(50%)", () => {
    const { container } = render(<TapeStrip position="bl" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("rotate(5deg)");
    expect(el.style.transform).toContain("translateY(50%)");
  });

  it("each position has its own rotation lean (br is mirror of bl)", () => {
    const { container } = render(<TapeStrip position="br" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("rotate(-5deg)");
  });
});
