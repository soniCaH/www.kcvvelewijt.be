import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YouthSection } from "./YouthSection";

describe("YouthSection", () => {
  it("renders the section label", () => {
    render(<YouthSection />);
    expect(screen.getByText("Jeugdwerking")).toBeInTheDocument();
  });

  it("renders the editorial title", () => {
    render(<YouthSection />);
    expect(
      screen.getByRole("heading", { name: /de toekomst van elewijt/i }),
    ).toBeInTheDocument();
  });

  it("renders the body text", () => {
    render(<YouthSection />);
    expect(screen.getByText(/meer dan 220 jonge spelers/i)).toBeInTheDocument();
  });

  it("renders the stats line", () => {
    render(<YouthSection />);
    expect(screen.getByText(/220\+ spelers · 16 ploegen/i)).toBeInTheDocument();
  });

  it("renders a CTA link to /jeugd", () => {
    render(<YouthSection />);
    const link = screen.getByRole("link", { name: /ontdek onze jeugd/i });
    expect(link).toHaveAttribute("href", "/jeugd");
  });

  it("does not clip section overflow so background can bleed into diagonal transitions", () => {
    const { container } = render(<YouthSection />);
    const section = container.querySelector("section");
    expect(section?.className).not.toContain("overflow-hidden");
  });
});
