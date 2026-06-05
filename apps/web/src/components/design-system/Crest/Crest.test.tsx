/**
 * Crest unit tests.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Crest } from "./Crest";

describe("Crest", () => {
  it("renders the uppercased first letter of the name when no logo is given", () => {
    render(<Crest name="anderlecht" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders the logo image (decorative) when a logo URL is given", () => {
    const { container } = render(
      <Crest name="Anderlecht" logo="https://cdn.example/crest.png" />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(img?.getAttribute("src")).toContain("crest.png");
    // The initial fallback must not render when a logo is present.
    expect(screen.queryByText("A")).toBeNull();
  });

  it("falls back to '·' when the name is empty or whitespace", () => {
    render(<Crest name="   " />);
    expect(screen.getByText("·")).toBeInTheDocument();
  });

  it("marks the fallback disc as decorative (aria-hidden)", () => {
    render(<Crest name="Test" />);
    const disc = screen.getByText("T");
    expect(disc).toHaveAttribute("aria-hidden", "true");
  });

  it("sizes the fallback disc from the size prop", () => {
    render(<Crest name="Test" size={16} />);
    const disc = screen.getByText("T");
    expect(disc).toHaveStyle({ width: "16px", height: "16px" });
  });
});
