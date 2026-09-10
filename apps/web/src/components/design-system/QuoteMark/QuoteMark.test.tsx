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

  // D14/Y6 (#2617) — the opening mark hangs outside the measure, but only
  // where a caller opts in: the pull is sized for <PullQuote>'s own
  // padding, and an unconditional hang breaks a tighter wrapper (a real
  // bug this suite caught — see the QuoteMark.stories.tsx AllColours
  // regression noted in the PR). The actual hang mechanism (a CSS
  // `text-indent` rule in globals.css) is untestable from jsdom — these
  // two guard the prop's default and its opt-in only.
  it("does NOT carry quote-mark-hang by default", () => {
    const { container } = render(<QuoteMark />);
    expect(container.firstChild).not.toHaveClass("quote-mark-hang");
  });

  it("carries quote-mark-hang when hang is true", () => {
    const { container } = render(<QuoteMark hang />);
    expect(container.firstChild).toHaveClass("quote-mark-hang");
  });
});
