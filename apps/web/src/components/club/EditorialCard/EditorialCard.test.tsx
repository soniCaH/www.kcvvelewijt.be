import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorialCard } from "./EditorialCard";

describe("EditorialCard", () => {
  const defaultProps = {
    href: "/club/bestuur",
    tag: "Bestuur",
    title: "Het team achter het team",
    arrowText: "Ontdek",
  };

  it("renders tag, title, and arrow text", () => {
    render(<EditorialCard {...defaultProps} />);

    expect(screen.getByText("Bestuur")).toBeInTheDocument();
    expect(screen.getByText("Het team achter het team")).toBeInTheDocument();
    expect(screen.getByText("Ontdek")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("renders optional description when provided", () => {
    render(
      <EditorialCard
        {...defaultProps}
        description="Maak kennis met het bestuur."
      />,
    );

    expect(
      screen.getByText("Maak kennis met het bestuur."),
    ).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EditorialCard {...defaultProps} />);

    // Description element should not exist
    expect(
      container.querySelector("[data-testid='card-description']"),
    ).not.toBeInTheDocument();
  });

  it("links to the correct href", () => {
    render(<EditorialCard {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/club/bestuur");
  });

  it("renders featured variant with larger padding and title", () => {
    render(<EditorialCard {...defaultProps} featured />);

    const link = screen.getByRole("link");
    // Featured card uses p-10 instead of p-6
    const content = link.querySelector("[data-testid='card-content']");
    expect(content?.className).toContain("p-10");

    // Featured title uses clamp font size
    const title = screen.getByText("Het team achter het team");
    expect(title).toHaveStyle({
      fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
    });
  });

  it("renders background image when provided", () => {
    render(
      <EditorialCard
        {...defaultProps}
        backgroundImage="/images/club/bestuur.jpg"
      />,
    );

    const link = screen.getByRole("link");
    const bgDiv = link.querySelector("[data-testid='card-bg']");
    expect(bgDiv).toBeInTheDocument();
    expect(bgDiv).toHaveStyle({
      backgroundImage: 'url("/images/club/bestuur.jpg")',
    });
  });

  it("applies blue-ish nav gradient when variant is nav", () => {
    render(<EditorialCard {...defaultProps} variant="nav" />);

    const link = screen.getByRole("link");
    const overlay = link.querySelector(
      "[data-testid='card-overlay']",
    ) as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).toContain("editorial-card-overlay--nav");
  });

  it("applies default gradient when variant is not set", () => {
    render(<EditorialCard {...defaultProps} />);

    const link = screen.getByRole("link");
    const overlay = link.querySelector(
      "[data-testid='card-overlay']",
    ) as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).toContain("editorial-card-overlay--default");
  });
});
