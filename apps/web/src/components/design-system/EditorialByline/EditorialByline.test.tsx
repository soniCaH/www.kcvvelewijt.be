import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialByline } from "./EditorialByline";

describe("EditorialByline", () => {
  it("falls back to 'Door redactie' when author is omitted", () => {
    render(<EditorialByline />);
    expect(screen.getByText("Door redactie")).toBeInTheDocument();
  });

  it("renders the supplied author name with a 'Door' prefix", () => {
    render(<EditorialByline author="Tom Janssens" />);
    expect(screen.getByText("Door Tom Janssens")).toBeInTheDocument();
  });

  it("prefixes the byline with a decorative ★ glyph", () => {
    const { container } = render(<EditorialByline />);
    const star = container.querySelector('[aria-hidden="true"]');
    expect(star?.textContent).toBe("★");
  });

  describe("author monogram chip (5.d-col)", () => {
    it("renders a byline-scale monogram when a real author is supplied", () => {
      const { container } = render(<EditorialByline author="Tom Janssens" />);
      const chip = container.querySelector(
        '[data-subject-avatar="monogram"][data-scale="byline"]',
      );
      expect(chip).not.toBeNull();
      // First letter of the author, uppercased.
      expect(chip?.textContent).toBe("T");
    });

    it("does NOT render the monogram on the 'redactie' fallback", () => {
      const { container } = render(<EditorialByline />);
      expect(
        container.querySelector('[data-subject-avatar="monogram"]'),
      ).toBeNull();
    });

    it("does NOT render the monogram when author is an empty/whitespace string", () => {
      const { container: a } = render(<EditorialByline author="" />);
      expect(a.querySelector('[data-subject-avatar="monogram"]')).toBeNull();
      const { container: b } = render(<EditorialByline author="   " />);
      expect(b.querySelector('[data-subject-avatar="monogram"]')).toBeNull();
      // Byline still reads "Door redactie" in both cases (fallback).
      expect(screen.getAllByText("Door redactie")).toHaveLength(2);
    });

    it("trims surrounding whitespace before deriving the monogram + display name", () => {
      const { container } = render(<EditorialByline author="  Anouk  " />);
      const chip = container.querySelector(
        '[data-subject-avatar="monogram"][data-scale="byline"]',
      );
      expect(chip?.textContent).toBe("A");
      expect(screen.getByText("Door Anouk")).toBeInTheDocument();
    });
  });
});
