import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialByline } from "./EditorialByline";

describe("EditorialByline", () => {
  it("renders nothing when author is omitted — no invented 'redactie' fallback (#2531)", () => {
    const { container } = render(<EditorialByline />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when author is empty or whitespace-only", () => {
    const { container: a } = render(<EditorialByline author="" />);
    expect(a).toBeEmptyDOMElement();
    const { container: b } = render(<EditorialByline author="   " />);
    expect(b).toBeEmptyDOMElement();
  });

  it("renders the supplied author name with a 'Door' prefix", () => {
    render(<EditorialByline author="Tom Janssens" />);
    expect(screen.getByText("Door Tom Janssens")).toBeInTheDocument();
  });

  it("prefixes the byline with a decorative ★ glyph", () => {
    const { container } = render(<EditorialByline author="Tom Janssens" />);
    const star = container.querySelector('[aria-hidden="true"]');
    expect(star?.textContent).toBe("★");
  });

  describe("author monogram chip (5.d-col)", () => {
    it("renders a byline-scale monogram when a real author is supplied", () => {
      const { container } = render(<EditorialByline author="Tom Janssens" />);
      const chip = container.querySelector(
        '[data-round-avatar="monogram"][data-size="24"]',
      );
      expect(chip).not.toBeNull();
      // Full name known: first + last initial (the family initials helper).
      expect(chip?.textContent).toBe("TJ");
    });

    it("trims surrounding whitespace before deriving the monogram + display name", () => {
      const { container } = render(<EditorialByline author="  Anouk  " />);
      const chip = container.querySelector(
        '[data-round-avatar="monogram"][data-size="24"]',
      );
      expect(chip?.textContent).toBe("A");
      expect(screen.getByText("Door Anouk")).toBeInTheDocument();
    });
  });
});
