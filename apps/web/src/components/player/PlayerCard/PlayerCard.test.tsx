/**
 * PlayerCard Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerCard } from "./PlayerCard";

describe("PlayerCard", () => {
  const defaultProps = {
    firstName: "Kevin",
    lastName: "De Bruyne",
    position: "Middenvelder",
    href: "/player/kevin-de-bruyne",
    number: 7,
  };

  describe("Rendering", () => {
    it("should render player name", () => {
      render(<PlayerCard {...defaultProps} />);
      expect(screen.getByText("Kevin")).toBeInTheDocument();
      expect(screen.getByText("De Bruyne")).toBeInTheDocument();
    });

    it("should render player position in content section", () => {
      render(<PlayerCard {...defaultProps} />);
      expect(screen.getByText("Middenvelder")).toBeInTheDocument();
    });

    it("should render as article element", () => {
      const { container } = render(<PlayerCard {...defaultProps} />);
      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("should render link with correct href", () => {
      render(<PlayerCard {...defaultProps} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/player/kevin-de-bruyne");
    });

    it("should have accessible label with full player info", () => {
      render(<PlayerCard {...defaultProps} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "aria-label",
        "Bekijk profiel van Kevin De Bruyne, Middenvelder, nummer 7",
      );
    });

    it("should have white card container with border", () => {
      render(<PlayerCard {...defaultProps} />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-white");
      expect(link).toHaveClass("border");
      expect(link).toHaveClass("shadow-sm");
    });
  });

  describe("Jersey Number", () => {
    it("should display jersey number using NumberBadge", () => {
      const { container } = render(
        <PlayerCard {...defaultProps} number={10} />,
      );
      // NumberBadge has .number-badge class and is aria-hidden
      const numberEl = container.querySelector(".number-badge");
      expect(numberEl).toHaveTextContent("10");
      expect(numberEl).toHaveAttribute("aria-hidden", "true");
    });

    it("should not display jersey number when not provided", () => {
      const { container } = render(
        <PlayerCard {...defaultProps} number={undefined} />,
      );
      const numberEl = container.querySelector(".number-badge");
      expect(numberEl).toBeNull();
    });

    it("should not include number in accessible label when not provided", () => {
      render(<PlayerCard {...defaultProps} number={undefined} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "aria-label",
        "Bekijk profiel van Kevin De Bruyne, Middenvelder",
      );
    });
  });

  describe("Captain Badge", () => {
    it("should display captain badge when isCaptain is true", () => {
      render(<PlayerCard {...defaultProps} isCaptain />);
      expect(screen.getByLabelText("Aanvoerder")).toBeInTheDocument();
      expect(screen.getByText("Aanvoerder")).toBeInTheDocument();
    });

    it("should not display captain badge by default", () => {
      render(<PlayerCard {...defaultProps} />);
      expect(screen.queryByLabelText("Aanvoerder")).not.toBeInTheDocument();
    });
  });

  describe("Player Image", () => {
    it("should render image when imageUrl is provided", () => {
      render(
        <PlayerCard
          {...defaultProps}
          imageUrl="https://example.com/photo.jpg"
        />,
      );
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Kevin De Bruyne");
    });

    it("should render placeholder when no image provided", () => {
      const { container } = render(<PlayerCard {...defaultProps} />);
      // Check for SVG placeholder
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("should render default variant", () => {
      const { container } = render(<PlayerCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article).toHaveClass("player-card");
    });

    it("should render compact variant with smaller image section", () => {
      const { container } = render(
        <PlayerCard {...defaultProps} variant="compact" />,
      );
      // Compact variant should have h-[200px] image section
      const imageSection = container.querySelector(
        ".overflow-hidden.flex-shrink-0",
      );
      expect(imageSection).toHaveClass("h-[200px]");
    });
  });

  describe("Loading State", () => {
    it("should render loading skeleton when isLoading is true", () => {
      render(<PlayerCard {...defaultProps} isLoading />);
      expect(screen.getByLabelText("Laden...")).toBeInTheDocument();
    });

    it("should not render player info when loading", () => {
      render(<PlayerCard {...defaultProps} isLoading />);
      expect(screen.queryByText("Kevin")).not.toBeInTheDocument();
      expect(screen.queryByText("De Bruyne")).not.toBeInTheDocument();
    });

    it("should have skeleton animation class", () => {
      const { container } = render(<PlayerCard {...defaultProps} isLoading />);
      expect(container.firstChild).toHaveClass("animate-pulse");
    });

    it("should have card styling when loading", () => {
      const { container } = render(<PlayerCard {...defaultProps} isLoading />);
      expect(container.firstChild).toHaveClass("bg-white");
      expect(container.firstChild).toHaveClass("rounded-card");
      // Border is applied via Tailwind class with color from tokens
      expect(container.firstChild).toHaveClass("border");
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className", () => {
      const { container } = render(
        <PlayerCard {...defaultProps} className="custom-class" />,
      );
      const article = container.querySelector("article");
      expect(article).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<PlayerCard {...defaultProps} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe("Card Design", () => {
    it("should have separate content section for names", () => {
      const { container } = render(<PlayerCard {...defaultProps} />);
      // Content section has p-4 class
      const contentSection = container.querySelector(".p-4.flex-1");
      expect(contentSection).toBeInTheDocument();
      // Names should be inside content section
      expect(contentSection).toHaveTextContent("Kevin");
      expect(contentSection).toHaveTextContent("De Bruyne");
    });

    it("should have image section with background color", () => {
      const { container } = render(<PlayerCard {...defaultProps} />);
      const imageSection = container.querySelector(
        ".overflow-hidden.flex-shrink-0",
      );
      expect(imageSection).toHaveStyle({ backgroundColor: "#edeff4" });
    });
  });
});
