import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebshopSection } from "./WebshopSection";
import { EXTERNAL_LINKS } from "@/lib/constants";

describe("WebshopSection", () => {
  it("renders the heading", () => {
    render(<WebshopSection />);
    expect(
      screen.getByRole("heading", { name: /clubkledij/i }),
    ).toBeInTheDocument();
  });

  it("renders the body text", () => {
    render(<WebshopSection />);
    expect(screen.getByText(/volledig clubpakket/i)).toBeInTheDocument();
  });

  it("renders a CTA link to the webshop", () => {
    render(<WebshopSection />);
    const link = screen.getByRole("link", { name: /naar de webshop/i });
    expect(link).toHaveAttribute("href", EXTERNAL_LINKS.webshop);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses a Lucide icon in the CTA, not emoji", () => {
    render(<WebshopSection />);
    const link = screen.getByRole("link", { name: /naar de webshop/i });
    const svg = link.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Ensure no emoji arrow characters
    expect(link.textContent).not.toMatch(/[→←↑↓➡️]/);
  });

  it("does not contain hardcoded webshop URLs", () => {
    const { container } = render(<WebshopSection />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      if (link.href.includes("brandsfit")) {
        expect(link.getAttribute("href")).toBe(EXTERNAL_LINKS.webshop);
      }
    });
  });
});
