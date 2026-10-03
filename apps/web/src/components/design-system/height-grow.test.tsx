import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HeightGrow } from "./height-grow";

const root = (container: HTMLElement) => container.firstElementChild!;

describe("HeightGrow", () => {
  it("is open by default and animates the row track at the Arrival speed", () => {
    const { container } = render(<HeightGrow>content</HeightGrow>);
    const cls = root(container).className;

    expect(cls).toContain("grid-rows-[1fr]");
    // The transition names the property it animates: Tailwind's bare
    // `transition` would not list `grid-template-rows`.
    expect(cls).toContain("transition-[grid-template-rows]");
    expect(cls).toContain("duration-500");
    expect(cls).toContain("ease-out");
  });

  it("is instant under prefers-reduced-motion (height is travel)", () => {
    const { container } = render(<HeightGrow>content</HeightGrow>);

    expect(root(container).className).toContain(
      "motion-reduce:transition-none",
    );
  });

  it("only grows on mount when asked to", () => {
    const { container, rerender } = render(<HeightGrow>content</HeightGrow>);
    expect(root(container).className).not.toContain("starting:");

    rerender(<HeightGrow enter>content</HeightGrow>);
    expect(root(container).className).toContain("starting:grid-rows-[0fr]");
  });

  it("collapses to 0fr when closed, and runs the same transition back", () => {
    const { container, rerender } = render(<HeightGrow>content</HeightGrow>);
    rerender(<HeightGrow open={false}>content</HeightGrow>);
    const cls = root(container).className;

    expect(cls).toContain("grid-rows-[0fr]");
    expect(cls).not.toContain("grid-rows-[1fr]");
    expect(cls).toContain("transition-[grid-template-rows]");
  });

  it("clips the content from the first frame without hiding it", () => {
    const { container, getByText } = render(<HeightGrow>content</HeightGrow>);

    const inner = getByText("content");
    expect(inner.className).toContain("min-h-0");
    expect(inner.className).toContain("overflow-hidden");
    expect(root(container).className).not.toContain("opacity");
  });
});
