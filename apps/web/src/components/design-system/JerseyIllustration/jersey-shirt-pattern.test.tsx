/**
 * Colocated tests for `<ShirtPatternMarks>` — the garment-vocabulary
 * renderer nothing else exercised until now (code review finding #6):
 * dropping `fill` from the dot circles would render every dotted kit
 * invisible while the rest of the suite stayed green.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShirtPatternMarks } from "./jersey-shirt-pattern";

// <path>/<circle> are only valid inside an <svg> — wrap every render so
// jsdom doesn't silently drop the children.
const renderMarks = (props: React.ComponentProps<typeof ShirtPatternMarks>) => {
  return render(
    <svg>
      <ShirtPatternMarks {...props} />
    </svg>,
  );
};

describe("ShirtPatternMarks", () => {
  it("renders nothing for a plain shirt", () => {
    const { container } = renderMarks({
      pattern: "plain",
      stripeCount: 4,
      strokeWidth: 2,
    });
    expect(container.querySelectorAll("path, circle")).toHaveLength(0);
  });

  it.each([
    [3, 3],
    [4, 4],
    [5, 5],
  ] as const)(
    "renders one path per band for a %i-stripe bands pattern",
    (stripeCount, expectedPaths) => {
      const { container } = renderMarks({
        pattern: "bands",
        stripeCount,
        strokeWidth: 2,
      });
      expect(container.querySelectorAll("path")).toHaveLength(expectedPaths);
    },
  );

  it("renders 5 tapered rows for hoops", () => {
    const { container } = renderMarks({
      pattern: "hoops",
      stripeCount: 4,
      strokeWidth: 2,
    });
    expect(container.querySelectorAll("path")).toHaveLength(5);
  });

  it("renders every dot filled with ink — the dotted youth kit must not render invisible", () => {
    const { container } = renderMarks({
      pattern: "dots",
      stripeCount: 4,
      strokeWidth: 2,
    });
    // `fill`/`stroke` are hoisted onto the wrapping <g> (a presentation
    // attribute inherited by every child) rather than repeated on each
    // circle — assert the wrapper carries them, not the individual dots.
    const wrapper = container.querySelector("g");
    expect(wrapper?.getAttribute("fill")).toBe("var(--color-ink)");
    expect(wrapper?.getAttribute("stroke")).toBe("none");
    const dots = wrapper?.querySelectorAll("circle") ?? [];
    expect(dots.length).toBeGreaterThan(0);
    for (const dot of Array.from(dots)) {
      expect(dot.getAttribute("r")).toBe("2.4");
    }
  });
});
