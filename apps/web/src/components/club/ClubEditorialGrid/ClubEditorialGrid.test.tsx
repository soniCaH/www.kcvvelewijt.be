import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubEditorialGrid } from "./ClubEditorialGrid";

describe("ClubEditorialGrid", () => {
  it("renders section header with label and title", () => {
    render(<ClubEditorialGrid />);

    expect(screen.getByText("Ontdek onze club")).toBeInTheDocument();
    expect(screen.getByText("Meer dan een voetbalclub")).toBeInTheDocument();
  });

  it("renders all 6 editorial cards with correct titles", () => {
    render(<ClubEditorialGrid />);

    expect(
      screen.getByText("75 jaar voetbalpassie in Elewijt"),
    ).toBeInTheDocument();
    expect(screen.getByText("Het team achter het team")).toBeInTheDocument();
    expect(screen.getByText("Onze structuur")).toBeInTheDocument();
    expect(screen.getByText("De 12de man")).toBeInTheDocument();
    expect(screen.getByText("Onze engelen")).toBeInTheDocument();
    expect(screen.getByText("Word lid")).toBeInTheDocument();
  });

  it("renders all 6 links pointing to correct routes", () => {
    render(<ClubEditorialGrid />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);

    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/club/geschiedenis");
    expect(hrefs).toContain("/club/bestuur");
    expect(hrefs).toContain("/club/organigram");
    expect(hrefs).toContain("/club/ultras");
    expect(hrefs).toContain("/club/angels");
    expect(hrefs).toContain("/club/aansluiten");
  });

  it("renders featured card (Geschiedenis) with featured styling", () => {
    render(<ClubEditorialGrid />);

    // Featured card has the description
    expect(screen.getByText(/Van een bescheiden begin/)).toBeInTheDocument();
  });

  it("renders 12-column grid container", () => {
    const { container } = render(<ClubEditorialGrid />);

    const grid = container.querySelector("[data-testid='editorial-grid']");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-12");
  });
});
