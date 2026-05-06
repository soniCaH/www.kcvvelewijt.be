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
});
