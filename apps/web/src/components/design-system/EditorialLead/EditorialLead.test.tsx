import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialLead, truncateLead } from "./EditorialLead";

describe("EditorialLead", () => {
  it("renders the supplied lead text", () => {
    render(<EditorialLead>De zomer van 2026 begint nu.</EditorialLead>);
    expect(
      screen.getByText("De zomer van 2026 begint nu."),
    ).toBeInTheDocument();
  });

  it("renders a paragraph element so it composes into article flow", () => {
    const { container } = render(<EditorialLead>x</EditorialLead>);
    expect(container.firstChild?.nodeName).toBe("P");
  });
});

describe("truncateLead", () => {
  it("returns the input unchanged when at or below 280 chars", () => {
    const input = "a".repeat(280);
    expect(truncateLead(input)).toBe(input);
  });

  it("truncates to 280 chars with an ellipsis when input is longer", () => {
    const input = "a".repeat(400);
    const result = truncateLead(input);
    expect(result.length).toBeLessThanOrEqual(280);
    expect(result.endsWith("…")).toBe(true);
  });

  it("prefers a word boundary near the limit when one is available", () => {
    const input = `${"woord ".repeat(50)}einde-na-282-tekens-zonder-spatie`;
    const result = truncateLead(input);
    expect(result.endsWith("…")).toBe(true);
    // Cut should land after a complete "woord" — the `einde-…` tail must
    // not appear in the result and the character before the ellipsis must
    // come from one of the repeated "woord" tokens, never mid-token.
    expect(result).not.toContain("einde");
    expect(result).toMatch(/woord…$/);
  });

  it("hard-cuts when no word boundary lies within 40 chars of the limit", () => {
    const input = "a".repeat(500);
    const result = truncateLead(input);
    expect(result).toBe(`${"a".repeat(279)}…`);
  });
});
