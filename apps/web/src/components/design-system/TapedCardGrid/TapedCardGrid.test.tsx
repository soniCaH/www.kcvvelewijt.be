import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapedCardGrid } from "./TapedCardGrid";

describe("TapedCardGrid", () => {
  it("renders children inside grid slots", () => {
    render(
      <TapedCardGrid>
        <span>one</span>
        <span>two</span>
        <span>three</span>
      </TapedCardGrid>,
    );
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByText("three")).toBeInTheDocument();
  });

  it("default columns=3, gap=md, as=div", () => {
    const { container } = render(
      <TapedCardGrid>
        <span>x</span>
      </TapedCardGrid>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("data-columns", "3");
    expect(root).toHaveAttribute("data-gap", "md");
    expect(root.tagName).toBe("DIV");
  });

  it("columns=4 sets data-columns and grid-cols-4 class", () => {
    const { container } = render(
      <TapedCardGrid columns={4}>
        <span>x</span>
      </TapedCardGrid>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("data-columns", "4");
    expect(root.className).toMatch(/grid-cols-4/);
  });

  it("as='ol' renders an ordered list with <li> slots", () => {
    const { container } = render(
      <TapedCardGrid as="ol">
        <span>one</span>
        <span>two</span>
      </TapedCardGrid>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("OL");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("as='ul' renders an unordered list with <li> slots", () => {
    const { container } = render(
      <TapedCardGrid as="ul">
        <span>x</span>
      </TapedCardGrid>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("UL");
    expect(container.querySelectorAll("li")).toHaveLength(1);
  });

  it("assigns rotation pool variable per slot, cycling 4n+1..4", () => {
    const { container } = render(
      <TapedCardGrid>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i}>slot {i}</span>
        ))}
      </TapedCardGrid>,
    );
    const slots = container.querySelectorAll("[data-slot]");
    expect(slots).toHaveLength(5);
    // First four slots cycle through the rotation pool, fifth wraps back to 'a'
    expect((slots[0] as HTMLElement).style.cssText).toContain(
      "--taped-card-rotation",
    );
    expect((slots[0] as HTMLElement).style.cssText).toContain(
      "var(--rotate-tape-a)",
    );
    expect((slots[1] as HTMLElement).style.cssText).toContain(
      "var(--rotate-tape-b)",
    );
    expect((slots[2] as HTMLElement).style.cssText).toContain(
      "var(--rotate-tape-c)",
    );
    expect((slots[3] as HTMLElement).style.cssText).toContain(
      "var(--rotate-tape-d)",
    );
    expect((slots[4] as HTMLElement).style.cssText).toContain(
      "var(--rotate-tape-a)",
    );
  });

  it("renders emptyState when children is empty and prop is provided", () => {
    render(<TapedCardGrid emptyState={<p>Geen items.</p>}>{[]}</TapedCardGrid>);
    expect(screen.getByText("Geen items.")).toBeInTheDocument();
  });

  it("renders nothing when children is empty and emptyState is omitted", () => {
    const { container } = render(<TapedCardGrid>{[]}</TapedCardGrid>);
    expect(container.firstChild).toBeNull();
  });

  it("merges className", () => {
    const { container } = render(
      <TapedCardGrid className="custom-grid">
        <span>x</span>
      </TapedCardGrid>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-grid",
    );
  });
});
