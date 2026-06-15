/**
 * StaffHero unit tests.
 *
 * Covers the locked person-profile hero (10f2 hero B):
 *  - Two-line name rhythm (first upright black / last italic + warm period)
 *  - Role pills (first jersey-deep, rest cream); auto-hide when none
 *  - Contact row (mailto / tel) with plain Phosphor icons; auto-hide when none
 *  - Photo state vs monogram fallback (data-state) + monogram initials
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffHero } from "./StaffHero";

describe("StaffHero", () => {
  it("renders the kicker and the two-line name", () => {
    render(<StaffHero firstName="Marc" lastName="De Coninck" />);
    expect(screen.getByText("Staf")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Marc");
    expect(heading).toHaveTextContent("De Coninck");
  });

  it("renders the photo state when imageUrl is present", () => {
    render(
      <StaffHero
        firstName="Marc"
        lastName="De Coninck"
        imageUrl="/player-fixtures/player-schulz.jpg"
      />,
    );
    expect(screen.getByTestId("staff-hero").getAttribute("data-state")).toBe(
      "photo",
    );
  });

  it("renders the monogram fallback with initials when imageUrl is absent", () => {
    render(<StaffHero firstName="Marc" lastName="De Coninck" />);
    const hero = screen.getByTestId("staff-hero");
    expect(hero.getAttribute("data-state")).toBe("monogram");
    // Initials of "Marc De Coninck" → first of first + first of last → "MD"
    expect(screen.getByTestId("staff-hero-monogram")).toHaveTextContent("MD");
  });

  it("renders role pills (first jersey-deep, rest cream)", () => {
    render(
      <StaffHero
        firstName="Marc"
        lastName="De Coninck"
        roles={["Hoofdtrainer", "Jeugdtrainer"]}
      />,
    );
    const pills = screen.getAllByTestId("staff-hero-role");
    expect(pills).toHaveLength(2);
    expect(pills[0]).toHaveTextContent("Hoofdtrainer");
    expect(
      pills[0]?.querySelector("[data-variant]")?.getAttribute("data-variant"),
    ).toBe("pill-jersey-deep");
    expect(
      pills[1]?.querySelector("[data-variant]")?.getAttribute("data-variant"),
    ).toBe("pill-cream");
  });

  it("auto-hides the role pills when none are supplied", () => {
    render(<StaffHero firstName="Marc" lastName="De Coninck" roles={[]} />);
    expect(screen.queryByTestId("staff-hero-role")).not.toBeInTheDocument();
  });

  it("renders a mailto link for the email", () => {
    render(
      <StaffHero
        firstName="Marc"
        lastName="De Coninck"
        email="marc@kcvvelewijt.be"
      />,
    );
    const link = screen.getByRole("link", { name: /marc@kcvvelewijt\.be/i });
    expect(link).toHaveAttribute("href", "mailto:marc@kcvvelewijt.be");
  });

  it("renders a tel link for the phone", () => {
    render(
      <StaffHero
        firstName="Marc"
        lastName="De Coninck"
        phone="+32 478 12 34 56"
      />,
    );
    const link = screen.getByRole("link", { name: /\+32 478 12 34 56/ });
    expect(link).toHaveAttribute("href", "tel:+32 478 12 34 56");
  });

  it("auto-hides the contact row when neither email nor phone is present", () => {
    const { container } = render(
      <StaffHero firstName="Marc" lastName="De Coninck" />,
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  });
});
