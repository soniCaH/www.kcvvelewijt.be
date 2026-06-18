import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SectionTransition, getTransitionBleed } from "./SectionTransition";
import { STRIPED_SEAM_HEIGHT_PX } from "@/components/design-system/StripedSeam";

describe("SectionTransition", () => {
  it("renders the striped-seam wrapper (aria-hidden, data-type) ", () => {
    const { container } = render(<SectionTransition />);
    const wrapper = container.querySelector(
      "[data-testid='section-transition']",
    ) as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveAttribute("data-type", "striped-seam");
    expect(wrapper.className).toContain("pointer-events-none");
    expect(wrapper.className).toContain("relative");
  });

  it("composes a <StripedSeam> (presentation SVG) inside the wrapper", () => {
    const { container } = render(<SectionTransition />);
    const wrapper = container.querySelector(
      "[data-testid='section-transition']",
    ) as HTMLElement;
    const svg = wrapper.querySelector("svg[role='presentation']");
    expect(svg).not.toBeNull();
  });

  it("defaults to horizontal: applies -mb-px w-full", () => {
    const { container } = render(<SectionTransition />);
    const wrapper = container.querySelector(
      "[data-testid='section-transition']",
    ) as HTMLElement;
    expect(wrapper.className).toContain("-mb-px");
    expect(wrapper.className).toContain("w-full");
    expect(wrapper.className).not.toContain("-mr-px");
    // The seam itself defaults to horizontal.
    const svg = wrapper.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("data-direction")).toBe("horizontal");
  });

  it("vertical direction: applies -mr-px h-full and a vertical seam", () => {
    const { container } = render(<SectionTransition direction="vertical" />);
    const wrapper = container.querySelector(
      "[data-testid='section-transition']",
    ) as HTMLElement;
    expect(wrapper.className).toContain("-mr-px");
    expect(wrapper.className).toContain("h-full");
    expect(wrapper.className).not.toContain("-mb-px");
    const svg = wrapper.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("data-direction")).toBe("vertical");
  });

  it("forwards height and colorPair to <StripedSeam>", () => {
    const { container } = render(
      <SectionTransition height="xl" colorPair="cream-jersey-deep" />,
    );
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("data-height")).toBe("xl");
    expect(svg.getAttribute("data-color-pair")).toBe("cream-jersey-deep");
  });

  it("forwards direction to <StripedSeam>", () => {
    const { container } = render(<SectionTransition direction="vertical" />);
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("data-direction")).toBe("vertical");
  });

  it("falls back to md height / ink-cream colorPair when unset", () => {
    const { container } = render(<SectionTransition />);
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("data-height")).toBe("md");
    expect(svg.getAttribute("data-color-pair")).toBe("ink-cream");
  });

  it("merges a caller className onto the wrapper", () => {
    const { container } = render(
      <SectionTransition className="custom-seam-class" />,
    );
    const wrapper = container.querySelector(
      "[data-testid='section-transition']",
    ) as HTMLElement;
    expect(wrapper.className).toContain("custom-seam-class");
    // Base classes survive the merge.
    expect(wrapper.className).toContain("pointer-events-none");
  });
});

describe("getTransitionBleed", () => {
  it("returns the striped-seam height in px (matching STRIPED_SEAM_HEIGHT_PX)", () => {
    expect(
      getTransitionBleed({
        type: "striped-seam",
        height: "md",
        colorPair: "ink-cream",
      }),
    ).toBe(`${STRIPED_SEAM_HEIGHT_PX.md}px`);

    expect(
      getTransitionBleed({
        type: "striped-seam",
        height: "xl",
        colorPair: "cream-jersey-deep",
      }),
    ).toBe(`${STRIPED_SEAM_HEIGHT_PX.xl}px`);
  });
});
