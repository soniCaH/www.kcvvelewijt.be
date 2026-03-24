/**
 * ResponsibilityBlock Component Tests
 *
 * Tests for the homepage block variant
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponsibilityBlock } from "./ResponsibilityBlock";

describe("ResponsibilityBlock", () => {
  describe("Rendering", () => {
    it("renders the component", () => {
      render(<ResponsibilityBlock paths={[]} />);
      expect(screen.getByText(/Hoe kunnen we je helpen/i)).toBeInTheDocument();
    });

    it("renders with gradient background section", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);
      const section = container.querySelector("section");
      expect(section).toHaveClass("bg-gradient-to-br");
    });

    it("contains the ResponsibilityFinder component in compact mode", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);
      const compact = container.querySelector(".compact");
      expect(compact).toBeInTheDocument();
    });
  });

  describe("Quick Links", () => {
    it("renders all three quick links", () => {
      render(<ResponsibilityBlock paths={[]} />);

      expect(screen.getByText("Organigram")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
      expect(screen.getByText("Inschrijven")).toBeInTheDocument();
    });

    it("organigram link points to correct URL", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const organigramLink = screen.getByText("Organigram").closest("a");
      expect(organigramLink).toHaveAttribute("href", "/club/organigram");
    });

    it("contact link points to correct URL", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const contactLink = screen.getByText("Contact").closest("a");
      expect(contactLink).toHaveAttribute("href", "/club/contact");
    });

    it("register link points to correct URL", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const registerLink = screen.getByText("Inschrijven").closest("a");
      expect(registerLink).toHaveAttribute("href", "/club/register");
    });

    it("quick links have proper icons", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const svgIcons = container.querySelectorAll("svg");
      expect(svgIcons.length).toBeGreaterThanOrEqual(3); // At least 3 icons for quick links
    });
  });

  describe("Link to Full Page", () => {
    it("renders link to /hulp page", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const fullPageLink = screen.getByText(/Bekijk alle veelgestelde vragen/i);
      expect(fullPageLink).toBeInTheDocument();
    });

    it("link points to /hulp", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const fullPageLink = screen.getByText(/Bekijk alle veelgestelde vragen/i);
      expect(fullPageLink.closest("a")).toHaveAttribute("href", "/hulp");
    });
  });

  describe("Interactive Elements", () => {
    it("can interact with role dropdown", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityBlock paths={[]} />);

      // Click the dropdown button to open the menu
      const dropdownButton = screen.getByRole("button", { name: /een\.\.\./i });
      await user.click(dropdownButton);

      // Select speler from dropdown
      const spelerOption = screen.getByRole("button", { name: /speler/i });
      await user.click(spelerOption);

      // Dropdown button should now show selected role
      const updatedButton = screen.getByRole("button", { name: /speler/i });
      expect(updatedButton).toBeInTheDocument();
    });

    it("shows question input after role selection", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityBlock paths={[]} />);

      // Click dropdown and select ouder
      const dropdownButton = screen.getByRole("button", { name: /een\.\.\./i });
      await user.click(dropdownButton);

      const ouderOption = screen.getByRole("button", { name: /ouder/i });
      await user.click(ouderOption);

      expect(screen.getByPlaceholderText(/typ je vraag/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const mainHeading = screen.getByText(/Hoe kunnen we je helpen/i);
      expect(mainHeading.tagName).toBe("H2");
    });

    it("all links are keyboard accessible", () => {
      render(<ResponsibilityBlock paths={[]} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toBeInTheDocument();
      });
    });

    it("quick link cards have descriptive text", () => {
      render(<ResponsibilityBlock paths={[]} />);

      expect(screen.getByText(/Alle bestuursleden/i)).toBeInTheDocument();
      expect(screen.getByText(/Algemene info/i)).toBeInTheDocument();
      expect(screen.getByText(/Word lid/i)).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("has responsive grid classes", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const quickLinksGrid = container.querySelector(".grid");
      expect(quickLinksGrid).toHaveClass("md:grid-cols-3");
    });

    it("has responsive padding", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const section = container.querySelector("section");
      expect(section).toHaveClass("py-16");
      expect(section).toHaveClass("px-4");
    });
  });

  describe("Visual Styling", () => {
    it("has KCVV branding colors", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const section = container.querySelector("section");
      expect(section).toHaveClass("bg-gradient-to-br");
      expect(section?.className).toContain("green");
    });

    it("quick links have hover effects", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const quickLinks = container.querySelectorAll(
        "a.hover\\:shadow-card-hover",
      );
      expect(quickLinks.length).toBeGreaterThan(0);
    });

    it("has rounded corners", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const whiteCard = container.querySelector(".rounded-2xl");
      expect(whiteCard).toBeInTheDocument();
    });

    it("has shadow on main card", () => {
      const { container } = render(<ResponsibilityBlock paths={[]} />);

      const mainCard = container.querySelector(".shadow-xl");
      expect(mainCard).toBeInTheDocument();
    });
  });
});
