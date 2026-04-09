/**
 * PageHeader Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImageProps } from "next/image";
import { PageHeader } from "./PageHeader";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    // Using img in tests is acceptable as we're mocking Next.js Image
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

describe("PageHeader", () => {
  describe("Rendering", () => {
    it("should render header", () => {
      const { container } = render(<PageHeader />);
      expect(container.querySelector("header")).toBeInTheDocument();
    });

    it("should render logo", () => {
      render(<PageHeader />);
      const logos = screen.getAllByAltText("KCVV ELEWIJT");
      expect(logos.length).toBeGreaterThan(0);
    });

    it("should have fixed navigation", () => {
      const { container } = render(<PageHeader />);
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("fixed");
      expect(nav).toHaveClass("top-[3px]");
      expect(nav).toHaveClass("h-16");
    });
  });

  describe("Mobile View", () => {
    it("should render mobile hamburger button", () => {
      render(<PageHeader />);
      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      expect(menuButton).toBeInTheDocument();
    });

    it("should render mobile search link", () => {
      render(<PageHeader />);
      const searchLinks = screen.getAllByLabelText(/search/i);
      expect(searchLinks.length).toBeGreaterThan(0);
    });

    it("should open mobile menu when hamburger clicked", async () => {
      const user = userEvent.setup();
      render(<PageHeader />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      await user.click(menuButton);

      // Menu should be visible (check for close button)
      const closeButton = screen.getByLabelText(/close menu/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Desktop View", () => {
    it("should render navigation", () => {
      const { container } = render(<PageHeader />);
      const nav = container.querySelector("nav");
      expect(nav).toBeInTheDocument();
    });

    it("should render 'Word lid' link pointing to /club/inschrijven", () => {
      const { container } = render(<PageHeader />);
      const wordLidLink = container.querySelector(
        'a[href="/club/inschrijven"]',
      );
      expect(wordLidLink).toBeInTheDocument();
      expect(wordLidLink).toHaveTextContent(/word lid/i);
    });

    it("should render desktop search link in utility group", () => {
      const { container } = render(<PageHeader />);
      // Desktop utility group search link - there are multiple search links (mobile + desktop)
      const searchLinks = container.querySelectorAll('a[href="/zoeken"]');
      expect(searchLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Touch targets", () => {
    it("should have ≥44×44 tap area on hamburger button", () => {
      render(<PageHeader />);
      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      expect(menuButton).toHaveClass("min-h-11", "min-w-11");
    });

    it("should have ≥44×44 tap area on mobile search link", () => {
      render(<PageHeader />);
      const searchLinks = screen.getAllByLabelText(/search/i);
      // First match is the mobile search link
      const mobileSearchLink = searchLinks[0];
      expect(mobileSearchLink).toHaveClass("min-h-11", "min-w-11");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<PageHeader />);
      expect(
        screen.getByLabelText(/toggle navigation menu/i),
      ).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<PageHeader />);

      // Tab to hamburger button
      await user.tab();
      expect(screen.getByLabelText(/toggle navigation menu/i)).toHaveFocus();
    });
  });

  describe("Focus management", () => {
    it("should return focus to hamburger button when mobile menu is closed", async () => {
      const user = userEvent.setup();
      render(<PageHeader />);

      const menuButton = screen.getByLabelText(/toggle navigation menu/i);
      await user.click(menuButton);

      // Menu is open — close it via the close button
      const closeButton = screen.getByLabelText(/close menu/i);
      await user.click(closeButton);

      // Focus should return to the hamburger button
      expect(menuButton).toHaveFocus();
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className", () => {
      const { container } = render(<PageHeader className="custom-class" />);
      const header = container.querySelector("header");
      expect(header).toHaveClass("custom-class");
    });
  });
});
