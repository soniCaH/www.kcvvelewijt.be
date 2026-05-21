import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BodyQuote } from "./BodyQuote";

describe("<BodyQuote>", () => {
  it("renders children inside a <blockquote>", () => {
    render(<BodyQuote>Hier kan ik tonen wat ik in mij heb.</BodyQuote>);
    const blockquote = screen.getByText("Hier kan ik tonen wat ik in mij heb.");
    expect(blockquote.tagName).toBe("BLOCKQUOTE");
  });

  it("wraps the quote in a <figure> marked with data-body-quote", () => {
    const { container } = render(<BodyQuote>quote</BodyQuote>);
    const figure = container.querySelector('figure[data-body-quote="true"]');
    expect(figure).not.toBeNull();
  });

  it("frames the quote with two dotted dividers", () => {
    const { container } = render(<BodyQuote>quote</BodyQuote>);
    const dividers = container.querySelectorAll(
      '[role="separator"][data-style="dotted"]',
    );
    expect(dividers).toHaveLength(2);
  });

  it("merges caller className with internal classes", () => {
    const { container } = render(
      <BodyQuote className="extra-test-class">quote</BodyQuote>,
    );
    const figure = container.querySelector('figure[data-body-quote="true"]');
    expect(figure?.className).toContain("extra-test-class");
  });
});
