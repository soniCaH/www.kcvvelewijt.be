import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClippedCard } from "./ClippedCard";

describe("ClippedCard", () => {
  it("renders children", () => {
    render(<ClippedCard>document body</ClippedCard>);
    expect(screen.getByText("document body")).toBeInTheDocument();
  });

  it("renders <div> by default", () => {
    const { container } = render(<ClippedCard>X</ClippedCard>);
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });

  it("as='article' renders <article>", () => {
    const { container } = render(<ClippedCard as="article">X</ClippedCard>);
    expect((container.firstChild as HTMLElement).tagName).toBe("ARTICLE");
  });

  it("as='section' renders <section>", () => {
    const { container } = render(<ClippedCard as="section">X</ClippedCard>);
    expect((container.firstChild as HTMLElement).tagName).toBe("SECTION");
  });

  it("applies the signature paper-card chrome (relative + 2px ink border)", () => {
    const { container } = render(<ClippedCard>X</ClippedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/relative/);
    expect(el.className).toMatch(/border-2/);
    expect(el.className).toMatch(/border-ink/);
  });

  it("does not render an offset paper shadow (distinct mood from TapedCard)", () => {
    const { container } = render(<ClippedCard>X</ClippedCard>);
    expect((container.firstChild as HTMLElement).className).not.toMatch(
      /shadow-paper-/,
    );
  });

  it("merges className with the computed classes", () => {
    const { container } = render(
      <ClippedCard className="custom-x">X</ClippedCard>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-x",
    );
  });

  it("renders TL + BR L-mark decorations as decorative-only spans", () => {
    const { container } = render(<ClippedCard>X</ClippedCard>);
    const tl = container.querySelector('[data-corner-clip="tl"]');
    const br = container.querySelector('[data-corner-clip="br"]');
    expect(tl).not.toBeNull();
    expect(br).not.toBeNull();
    expect(tl).toHaveAttribute("aria-hidden", "true");
    expect(br).toHaveAttribute("aria-hidden", "true");
  });

  it("only renders two L-marks (TL + BR — never four)", () => {
    const { container } = render(<ClippedCard>X</ClippedCard>);
    expect(container.querySelectorAll("[data-corner-clip]")).toHaveLength(2);
  });
});
