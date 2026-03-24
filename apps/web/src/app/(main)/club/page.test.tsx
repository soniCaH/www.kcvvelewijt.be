import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClubPage from "./page";

describe("/club page", () => {
  it("renders ClubHero inside the page", () => {
    render(<ClubPage />);

    // Hero content is present
    expect(screen.getByText("Onze club")).toBeInTheDocument();
    expect(screen.getByText(/de plezantste/i)).toBeInTheDocument();
    expect(screen.getByText(/compagnie/i)).toBeInTheDocument();
  });

  it("renders at least one editorial card linking to a /club/* sub-page", () => {
    render(<ClubPage />);

    const link = screen.getByRole("link", { name: /bestuur/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/club/bestuur");
  });

  it("uses SectionStack for layout", () => {
    const { container } = render(<ClubPage />);

    // SectionStack renders section-transition divs between sections
    const transitions = container.querySelectorAll(
      '[data-testid="section-transition"]',
    );
    expect(transitions.length).toBeGreaterThanOrEqual(1);
  });
});
