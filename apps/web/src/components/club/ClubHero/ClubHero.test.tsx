import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubHero } from "./ClubHero";

describe("ClubHero", () => {
  it("renders label, title with green accent, and subtitle", () => {
    render(<ClubHero />);

    // Label
    expect(screen.getByText("Onze club")).toBeInTheDocument();

    // Title parts
    expect(screen.getByText(/de plezantste/i)).toBeInTheDocument();
    const greenAccent = screen.getByText(/compagnie/i);
    expect(greenAccent).toBeInTheDocument();
    expect(greenAccent.tagName).toBe("SPAN");
    expect(greenAccent.className).toContain("text-kcvv-green");
  });

  it("renders built-in diagonal SVG", () => {
    const { container } = render(<ClubHero />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 100 100");
    expect(svg).toHaveAttribute("preserveAspectRatio", "none");

    // Lower-left triangle filled with gray-100
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBeGreaterThanOrEqual(2);

    const grayPolygon = Array.from(polygons).find(
      (p) => p.getAttribute("fill") === "#f3f4f6",
    );
    expect(grayPolygon).toBeInTheDocument();
  });
});
