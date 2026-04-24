import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FooterSafeArea } from "./FooterSafeArea";

describe("FooterSafeArea", () => {
  it("renders an aria-hidden spacer with the footer-diagonal height", () => {
    const { container } = render(<FooterSafeArea />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.className).toContain("h-[var(--footer-diagonal)]");
    expect(el.className).toContain("bg-transparent");
  });

  it("applies the requested bg class", () => {
    const { container } = render(<FooterSafeArea bg="kcvv-black" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("bg-kcvv-black");
  });

  it("merges caller-supplied className", () => {
    const { container } = render(<FooterSafeArea className="my-extra-class" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("my-extra-class");
    expect(el.className).toContain("h-[var(--footer-diagonal)]");
  });
});
