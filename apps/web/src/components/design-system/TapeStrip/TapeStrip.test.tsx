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

  it("respects color, position, length, and rotation props", () => {
    const { container } = render(
      <TapeStrip color="ink" position="br" length="lg" rotation={-12} />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-position", "br");
    expect(el).toHaveAttribute("data-length", "lg");
    expect(el.style.transform).toContain("rotate(-12deg)");
  });
});
