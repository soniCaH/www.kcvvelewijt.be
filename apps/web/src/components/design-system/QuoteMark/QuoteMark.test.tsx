import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuoteMark } from "./QuoteMark";

describe("QuoteMark", () => {
  it("renders an SVG with default jersey colour", () => {
    const { container } = render(<QuoteMark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("data-color", "jersey");
  });

  it("respects color prop", () => {
    const { container } = render(<QuoteMark color="cream" />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "data-color",
      "cream",
    );
  });

  it("renders two glyphs (left + right)", () => {
    const { container } = render(<QuoteMark />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });
});
