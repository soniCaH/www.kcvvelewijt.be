import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebshopBanner } from "./WebshopBanner";
import { EXTERNAL_LINKS } from "@/lib/constants";

describe("WebshopBanner", () => {
  it("renders the WEBSHOP · onze partner meta label", () => {
    render(<WebshopBanner />);
    expect(screen.getByText(/webshop · onze partner/i)).toBeInTheDocument();
  });

  it("renders the editorial headline", () => {
    render(<WebshopBanner />);
    expect(
      screen.getByRole("heading", { name: /trainingsgear bestel je/i }),
    ).toBeInTheDocument();
  });

  it("renders the lead copy", () => {
    render(<WebshopBanner />);
    expect(
      screen.getByText(/trainingskledij, clubpakketten/i),
    ).toBeInTheDocument();
  });

  it("renders a single CTA opening the partner webshop in a new tab", () => {
    render(<WebshopBanner />);
    const cta = screen.getByRole("link", { name: /naar de webshop/i });
    expect(cta).toHaveAttribute("href", EXTERNAL_LINKS.webshop);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders the content inside a jersey-deep paper card on a cream-deep surface", () => {
    const { container } = render(<WebshopBanner />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("bg-cream-deep");
    // Card body — TapedCard renders with data-bg attribute on its root element.
    expect(container.querySelector('[data-bg="jersey-deep"]')).not.toBeNull();
  });
});
