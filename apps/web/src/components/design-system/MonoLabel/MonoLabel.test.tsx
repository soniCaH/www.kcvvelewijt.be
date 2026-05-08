import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoLabel } from "./MonoLabel";

describe("MonoLabel", () => {
  it("renders children", () => {
    render(<MonoLabel>interview</MonoLabel>);
    expect(screen.getByText("interview")).toBeInTheDocument();
  });

  it("default variant is 'plain', size 'sm', tone 'ink'", () => {
    const { container } = render(<MonoLabel>X</MonoLabel>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-variant", "plain");
    expect(el).toHaveAttribute("data-size", "sm");
    expect(el).toHaveAttribute("data-tone", "ink");
  });

  it("variant pill-jersey sets data-variant", () => {
    const { container } = render(
      <MonoLabel variant="pill-jersey">X</MonoLabel>,
    );
    expect(container.firstChild).toHaveAttribute("data-variant", "pill-jersey");
  });

  it("size md sets data-size", () => {
    const { container } = render(<MonoLabel size="md">X</MonoLabel>);
    expect(container.firstChild).toHaveAttribute("data-size", "md");
  });

  it("plain variant + tone='cream' applies text-cream (full opacity), not text-ink", () => {
    const { container } = render(<MonoLabel tone="cream">X</MonoLabel>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/(?:^|\s)text-cream(?:\s|$)/);
    expect(el.className).not.toMatch(/(?:^|\s)text-ink(?:\s|$)/);
    // Guard: any future regression to `text-cream/<alpha>` will fail axe on
    // jersey-deep surfaces (contrast drops below 4.5:1).
    expect(el.className).not.toMatch(/text-cream\/\d/);
  });

  it("plain variant + tone='ink' (default) applies text-ink, not text-cream", () => {
    const { container } = render(<MonoLabel>X</MonoLabel>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("text-ink");
    expect(el.className).not.toContain("text-cream");
  });

  it("pill variants ignore tone — pill-ink keeps text-cream regardless of tone='cream'", () => {
    const { container } = render(
      <MonoLabel variant="pill-ink" tone="cream">
        X
      </MonoLabel>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("text-cream");
  });

  it("pill variants ignore tone — pill-jersey keeps text-ink even when tone='cream'", () => {
    const { container } = render(
      <MonoLabel variant="pill-jersey" tone="cream">
        X
      </MonoLabel>,
    );
    expect(container.firstChild).toHaveClass("text-ink");
  });
});
