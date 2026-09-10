import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuoteMark } from "./QuoteMark";

describe("QuoteMark", () => {
  it("renders the right-double-quote glyph with default jersey colour", () => {
    const { container } = render(<QuoteMark />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el.textContent).toBe("”");
  });

  it("respects color prop", () => {
    const { container } = render(<QuoteMark color="cream" />);
    expect(container.firstChild).toHaveAttribute("data-color", "cream");
  });

  // D14/Y6 (#2617) — the opening mark hangs outside the measure. The actual
  // hang (native `hanging-punctuation` vs. the negative-`text-indent`
  // fallback, and their `@supports` mutual exclusivity) is a CSS rule in
  // globals.css that jsdom cannot evaluate — this only guards that the class
  // the rule hangs off survives onto the rendered element.
  it("carries the quote-mark-hang class every colour variant shares", () => {
    const { container } = render(<QuoteMark />);
    expect(container.firstChild).toHaveClass("quote-mark-hang");
  });
});
