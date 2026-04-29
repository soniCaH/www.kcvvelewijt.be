import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapedCard } from "./TapedCard";

describe("TapedCard", () => {
  it("renders children", () => {
    render(<TapedCard>hello</TapedCard>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("default props are rotation=none, bg=cream, shadow=md, padding=md, interactive=false", () => {
    const { container } = render(<TapedCard>X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-rotation", "none");
    expect(el).toHaveAttribute("data-bg", "cream");
    expect(el).toHaveAttribute("data-shadow", "md");
    expect(el).toHaveAttribute("data-padding", "md");
    expect(el).toHaveAttribute("data-interactive", "false");
  });

  it("renders <div> by default", () => {
    const { container } = render(<TapedCard>X</TapedCard>);
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });

  it("as=article renders <article>", () => {
    const { container } = render(<TapedCard as="article">X</TapedCard>);
    expect((container.firstChild as HTMLElement).tagName).toBe("ARTICLE");
  });

  it("as=figure renders <figure>", () => {
    const { container } = render(<TapedCard as="figure">X</TapedCard>);
    expect((container.firstChild as HTMLElement).tagName).toBe("FIGURE");
  });

  it("as=li renders <li>", () => {
    const { container } = render(
      <ul>
        <TapedCard as="li">X</TapedCard>
      </ul>,
    );
    expect(container.querySelector("li")).not.toBeNull();
  });

  it("rotation='a' applies the var(--rotate-tape-a) custom property", () => {
    const { container } = render(<TapedCard rotation="a">X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-rotation")).toBe("a");
    expect(el.style.transform).toContain("var(--rotate-tape-a)");
  });

  it("rotation='auto' uses var(--taped-card-rotation,0deg)", () => {
    const { container } = render(<TapedCard rotation="auto">X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-rotation")).toBe("auto");
    expect(el.style.transform).toContain("var(--taped-card-rotation");
  });

  it("rotation={5} (numeric) renders deg value and data-rotation='custom'", () => {
    const { container } = render(<TapedCard rotation={5}>X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-rotation")).toBe("custom");
    expect(el.style.transform).toContain("5deg");
  });

  it("bg='ink' sets data-bg and applies ink background class", () => {
    const { container } = render(<TapedCard bg="ink">X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-bg", "ink");
    expect(el.className).toMatch(/bg-ink/);
    expect(el.className).toMatch(/text-cream/);
  });

  it("padding='none' applies p-0 (no padding)", () => {
    const { container } = render(<TapedCard padding="none">X</TapedCard>);
    expect((container.firstChild as HTMLElement).className).toMatch(/p-0/);
  });

  it("shadow='lift' applies shadow-paper-lift", () => {
    const { container } = render(<TapedCard shadow="lift">X</TapedCard>);
    expect((container.firstChild as HTMLElement).className).toMatch(
      /shadow-paper-lift/,
    );
  });

  it("renders one TapeStrip when tape is a single object", () => {
    const { container } = render(
      <TapedCard tape={{ position: "tl", color: "jersey" }}>X</TapedCard>,
    );
    expect(container.querySelectorAll('[data-position="tl"]')).toHaveLength(1);
  });

  it("renders multiple TapeStrips when tape is an array", () => {
    const { container } = render(
      <TapedCard
        tape={[
          { position: "tl", color: "jersey" },
          { position: "br", color: "ink" },
        ]}
      >
        X
      </TapedCard>,
    );
    expect(container.querySelector('[data-position="tl"]')).not.toBeNull();
    expect(container.querySelector('[data-position="br"]')).not.toBeNull();
  });

  it("interactive=true sets data-interactive and adds hover/transition classes", () => {
    const { container } = render(<TapedCard interactive>X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-interactive", "true");
    expect(el.className).toMatch(/motion-safe:hover:/);
    expect(el.className).toMatch(/transition-/);
  });

  it("interactive=false (default) does not add hover classes", () => {
    const { container } = render(<TapedCard>X</TapedCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toMatch(/motion-safe:hover:/);
  });

  it("merges className with the computed classes", () => {
    const { container } = render(<TapedCard className="custom-x">X</TapedCard>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-x",
    );
  });
});
