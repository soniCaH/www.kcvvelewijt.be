import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SectionDivider } from "./SectionDivider";

describe("SectionDivider", () => {
  it("renders a hidden div", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("positions at top-0 for position=top", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    expect(container.firstChild).toHaveClass("top-0");
  });

  it("positions at bottom-0 for position=bottom", () => {
    const { container } = render(
      <SectionDivider color="white" position="bottom" />,
    );
    expect(container.firstChild).toHaveClass("bottom-0");
  });

  it("applies bg-white for color=white", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-white");
  });

  it("applies bg-gray-100 for color=gray-100", () => {
    const { container } = render(
      <SectionDivider color="gray-100" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-gray-100");
  });

  it("applies bg-kcvv-black for color=kcvv-black", () => {
    const { container } = render(
      <SectionDivider color="kcvv-black" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-kcvv-black");
  });

  it("applies bg-kcvv-green-dark for color=kcvv-green-dark", () => {
    const { container } = render(
      <SectionDivider color="kcvv-green-dark" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-kcvv-green-dark");
  });

  it("sets top clip-path for position=top", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.clipPath).toBe("polygon(0 0, 100% 0, 100% 0%, 0 100%)");
  });

  it("sets bottom clip-path for position=bottom", () => {
    const { container } = render(
      <SectionDivider color="white" position="bottom" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.clipPath).toBe(
      "polygon(0 100%, 100% 100%, 100% 0%, 0 100%)",
    );
  });

  it("accepts extra className", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" className="z-20" />,
    );
    expect(container.firstChild).toHaveClass("z-20");
  });
});
