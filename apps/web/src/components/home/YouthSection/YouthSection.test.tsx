import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { YouthSection } from "./YouthSection";
import { YouthBackdrop } from "./YouthBackdrop";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => (
    <img alt={alt} src={typeof src === "string" ? src : ""} {...rest} />
  ),
}));

describe("YouthSection", () => {
  it("renders the section label", () => {
    render(<YouthSection />);
    expect(screen.getByText("Jeugdwerking")).toBeInTheDocument();
  });

  it("renders the editorial title", () => {
    render(<YouthSection />);
    expect(
      screen.getByRole("heading", { name: /de toekomst van elewijt/i }),
    ).toBeInTheDocument();
  });

  it("renders the body text", () => {
    render(<YouthSection />);
    expect(screen.getByText(/meer dan 220 jonge spelers/i)).toBeInTheDocument();
  });

  it("renders the stats line", () => {
    render(<YouthSection />);
    expect(screen.getByText(/220\+ spelers · 16 ploegen/i)).toBeInTheDocument();
  });

  it("renders a CTA link to /jeugd", () => {
    render(<YouthSection />);
    const link = screen.getByRole("link", { name: /ontdek onze jeugd/i });
    expect(link).toHaveAttribute("href", "/jeugd");
  });

  it("renders no inline SVG diagonals (now owned by SectionTransition via SectionStack)", () => {
    const { container } = render(<YouthSection />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("does not apply marginTop / paddingBottom positioning hacks (inline or pt-0/pb-0 classes)", () => {
    const { container } = render(<YouthSection />);
    const root = container.firstElementChild as HTMLElement | null;
    expect(root?.style.marginTop).toBe("");
    expect(root?.style.paddingBottom).toBe("");
    expect(root?.className).not.toContain("pt-0");
    expect(root?.className).not.toContain("pb-0");
  });
});

describe("YouthBackdrop", () => {
  it("renders the youth-trainers background image", () => {
    const { container } = render(<YouthBackdrop />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("youth-trainers");
  });

  it("marks itself decorative for assistive tech", () => {
    const { container } = render(<YouthBackdrop />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });
});
