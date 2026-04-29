import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuoteMark } from "./QuoteMark";

describe("QuoteMark", () => {
  it("renders the typographic open-quote glyph with default jersey colour", () => {
    const { container } = render(<QuoteMark />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el.textContent).toBe("“");
  });

  it("respects color prop", () => {
    const { container } = render(<QuoteMark color="cream" />);
    expect(container.firstChild).toHaveAttribute("data-color", "cream");
  });
});
