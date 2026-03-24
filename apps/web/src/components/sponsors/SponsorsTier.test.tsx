/**
 * SponsorsTier Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SponsorsTier, type Sponsor } from "./SponsorsTier";

const mockSponsors: Sponsor[] = [
  {
    id: "1",
    name: "Sponsor One",
    logo: "https://placehold.co/200x133/4B9B48/FFFFFF?text=Sponsor+1",
    url: "https://example.com/sponsor1",
  },
  {
    id: "2",
    name: "Sponsor Two",
    logo: "https://placehold.co/200x133/4B9B48/FFFFFF?text=Sponsor+2",
  },
  {
    id: "3",
    name: "Sponsor Three",
    logo: "https://placehold.co/200x133/4B9B48/FFFFFF?text=Sponsor+3",
    url: "https://example.com/sponsor3",
  },
];

describe("SponsorsTier", () => {
  describe("Rendering", () => {
    it("renders with gold tier styling", () => {
      const { container } = render(
        <SponsorsTier
          tier="gold"
          title="Gold Sponsors"
          sponsors={mockSponsors}
        />,
      );

      expect(screen.getByText("Gold Sponsors")).toBeInTheDocument();
      expect(screen.getByAltText("Sponsor One")).toBeInTheDocument();
      // Gold tier uses grid-cols-2 md:grid-cols-3 lg:grid-cols-4
      const grid = container.querySelector(".grid");
      expect(grid?.className).toContain("grid-cols-2");
      expect(grid?.className).toContain("md:grid-cols-3");
      expect(grid?.className).toContain("lg:grid-cols-4");
    });

    it("renders with silver tier styling", () => {
      const { container } = render(
        <SponsorsTier
          tier="silver"
          title="Silver Sponsors"
          sponsors={mockSponsors}
        />,
      );

      expect(screen.getByText("Silver Sponsors")).toBeInTheDocument();
      // Silver tier uses grid-cols-2 md:grid-cols-4 lg:grid-cols-5
      const grid = container.querySelector(".grid");
      expect(grid?.className).toContain("grid-cols-2");
      expect(grid?.className).toContain("md:grid-cols-4");
      expect(grid?.className).toContain("lg:grid-cols-5");
    });

    it("renders with bronze tier styling", () => {
      const { container } = render(
        <SponsorsTier
          tier="bronze"
          title="Bronze Sponsors"
          sponsors={mockSponsors}
        />,
      );

      expect(screen.getByText("Bronze Sponsors")).toBeInTheDocument();
      // Bronze tier uses grid-cols-2 md:grid-cols-4 lg:grid-cols-6
      const grid = container.querySelector(".grid");
      expect(grid?.className).toContain("grid-cols-2");
      expect(grid?.className).toContain("md:grid-cols-4");
      expect(grid?.className).toContain("lg:grid-cols-6");
    });

    it("renders all sponsors", () => {
      render(
        <SponsorsTier
          tier="gold"
          title="Test Sponsors"
          sponsors={mockSponsors}
        />,
      );

      expect(screen.getByAltText("Sponsor One")).toBeInTheDocument();
      expect(screen.getByAltText("Sponsor Two")).toBeInTheDocument();
      expect(screen.getByAltText("Sponsor Three")).toBeInTheDocument();
    });

    it("returns null when sponsors array is empty", () => {
      const { container } = render(
        <SponsorsTier tier="gold" title="Empty" sponsors={[]} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Links", () => {
    it("renders sponsors with URLs as links", () => {
      render(<SponsorsTier tier="gold" title="Test" sponsors={mockSponsors} />);

      const link1 = screen
        .getByLabelText("Bezoek website van Sponsor One")
        .closest("a");
      expect(link1).toHaveAttribute("href", "https://example.com/sponsor1");
      expect(link1).toHaveAttribute("target", "_blank");
      expect(link1).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders sponsors without URLs as non-clickable divs", () => {
      render(<SponsorsTier tier="gold" title="Test" sponsors={mockSponsors} />);

      const sponsor2Container = screen.getByLabelText("Sponsor Two");
      expect(sponsor2Container.tagName).toBe("DIV");
      expect(sponsor2Container.closest("a")).toBeNull();
    });
  });

  describe("Images", () => {
    it("renders images with correct alt text", () => {
      render(<SponsorsTier tier="gold" title="Test" sponsors={mockSponsors} />);

      const img1 = screen.getByAltText("Sponsor One");
      expect(img1).toHaveAttribute("alt", "Sponsor One");

      const img2 = screen.getByAltText("Sponsor Two");
      expect(img2).toHaveAttribute("alt", "Sponsor Two");
    });

    it("renders images with correct dimensions for gold tier", () => {
      render(
        <SponsorsTier tier="gold" title="Test" sponsors={[mockSponsors[0]]} />,
      );

      const img = screen.getByAltText("Sponsor One");
      expect(img).toHaveAttribute("width", "280");
      // Height is 2/3 of width: 280 * 2/3 = 186.666...
      expect(img).toHaveAttribute("height", "186.66666666666666");
    });

    it("renders images with correct dimensions for silver tier", () => {
      render(
        <SponsorsTier
          tier="silver"
          title="Test"
          sponsors={[mockSponsors[0]]}
        />,
      );

      const img = screen.getByAltText("Sponsor One");
      expect(img).toHaveAttribute("width", "200");
      // Height is 2/3 of width: 200 * 2/3 = 133.333...
      expect(img).toHaveAttribute("height", "133.33333333333331");
    });

    it("renders images with correct dimensions for bronze tier", () => {
      render(
        <SponsorsTier
          tier="bronze"
          title="Test"
          sponsors={[mockSponsors[0]]}
        />,
      );

      const img = screen.getByAltText("Sponsor One");
      expect(img).toHaveAttribute("width", "160");
      // Height is 2/3 of width: 160 * 2/3 = 106.666...
      expect(img).toHaveAttribute("height", "106.66666666666666");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <SponsorsTier
          tier="gold"
          title="Test"
          sponsors={mockSponsors}
          className="custom-class"
        />,
      );

      const section = container.querySelector("section");
      expect(section?.className).toContain("custom-class");
      expect(section?.className).toContain("mb-12");
    });

    it("applies hover effects to sponsor cards", () => {
      const { container } = render(
        <SponsorsTier tier="gold" title="Test" sponsors={[mockSponsors[0]]} />,
      );

      const card = container.querySelector(".bg-white");
      expect(card?.className).toContain("hover:shadow-card-hover");
      expect(card?.className).toContain("hover:-translate-y-1");
      expect(card?.className).toContain("transition-all");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(
        <SponsorsTier
          tier="gold"
          title="Gold Sponsors"
          sponsors={mockSponsors}
        />,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Gold Sponsors");
    });

    it("has aria-label for clickable sponsors", () => {
      render(<SponsorsTier tier="gold" title="Test" sponsors={mockSponsors} />);

      expect(
        screen.getByLabelText("Bezoek website van Sponsor One"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Bezoek website van Sponsor Three"),
      ).toBeInTheDocument();
    });

    it("has aria-label for non-clickable sponsors", () => {
      render(<SponsorsTier tier="gold" title="Test" sponsors={mockSponsors} />);

      expect(screen.getByLabelText("Sponsor Two")).toBeInTheDocument();
    });
  });
});
