import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EndMark } from "./EndMark";

describe("EndMark", () => {
  it("renders the default label 'EINDE GESPREK'", () => {
    render(<EndMark />);
    expect(screen.getByText("EINDE GESPREK")).toBeInTheDocument();
  });

  it("renders a custom label when supplied", () => {
    render(<EndMark label="EINDE INTERVIEW" />);
    expect(screen.getByText("EINDE INTERVIEW")).toBeInTheDocument();
  });

  it("renders two decorative ★ glyphs as flex children with aria-hidden", () => {
    const { container } = render(<EndMark />);
    const stars = container.querySelectorAll('[data-endmark="star"]');
    expect(stars).toHaveLength(2);
    stars.forEach((star) => {
      expect(star).toHaveAttribute("aria-hidden", "true");
      expect(star.textContent).toBe("★");
    });
  });

  it("renders two flex 1px ink rules with aria-hidden", () => {
    const { container } = render(<EndMark />);
    const rules = container.querySelectorAll('[data-endmark="rule"]');
    expect(rules).toHaveLength(2);
    rules.forEach((rule) => {
      expect(rule).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("uses an <aside> container so the label remains readable to AT", () => {
    const { container } = render(<EndMark />);
    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe("ASIDE");
    expect(root).not.toHaveAttribute("aria-hidden");
    expect(root).not.toHaveAttribute("role", "presentation");
  });

  it("composes children in [rule, star, label, star, rule] order", () => {
    const { container } = render(<EndMark />);
    const root = container.firstChild as HTMLElement;
    const children = Array.from(root.children);
    expect(children).toHaveLength(5);
    expect(children[0]).toHaveAttribute("data-endmark", "rule");
    expect(children[1]).toHaveAttribute("data-endmark", "star");
    expect(children[2]).toHaveAttribute("data-endmark", "label");
    expect(children[3]).toHaveAttribute("data-endmark", "star");
    expect(children[4]).toHaveAttribute("data-endmark", "rule");
  });
});
