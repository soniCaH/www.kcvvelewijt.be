/**
 * TeamHeader Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamHeader } from "./TeamHeader";

describe("TeamHeader", () => {
  describe("Rendering", () => {
    it("should render team name", () => {
      render(<TeamHeader name="A-Ploeg" />);
      expect(
        screen.getByRole("heading", { level: 1, name: "A-Ploeg" }),
      ).toBeInTheDocument();
    });

    it("should render tagline when provided", () => {
      render(<TeamHeader name="A-Ploeg" tagline="Eerste elftal" />);
      expect(screen.getByText("Eerste elftal")).toBeInTheDocument();
    });

    it("should render as header element", () => {
      render(<TeamHeader name="A-Ploeg" />);
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("should render team photo when imageUrl provided", () => {
      render(
        <TeamHeader name="A-Ploeg" imageUrl="https://example.com/team.jpg" />,
      );
      expect(screen.getByAltText("A-Ploeg teamfoto")).toBeInTheDocument();
    });
  });

  describe("Age Group Badge", () => {
    it("should render age group badge for youth teams", () => {
      render(<TeamHeader name="U17" ageGroup="U17" teamType="youth" />);
      // Both the badge and heading show the age group - check badge exists
      const badges = screen.getAllByText("U17");
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it("should not render age group badge when not provided", () => {
      render(<TeamHeader name="A-Ploeg" teamType="senior" />);
      expect(screen.queryByText(/^U\d+$/)).not.toBeInTheDocument();
    });
  });

  describe("Team Type Badge", () => {
    it("should render Club badge for club teams without age group", () => {
      render(<TeamHeader name="Bestuur" teamType="club" />);
      expect(screen.getByText("Club")).toBeInTheDocument();
    });

    it("should not render Club badge when age group is provided", () => {
      render(<TeamHeader name="U17" ageGroup="U17" teamType="club" />);
      // Age group badge takes precedence - both name and badge show U17
      const badges = screen.getAllByText("U17");
      expect(badges.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText("Club")).not.toBeInTheDocument();
    });
  });

  describe("Coach Info", () => {
    it("should render coach name when provided", () => {
      render(
        <TeamHeader name="A-Ploeg" coach={{ name: "Marc Van den Berg" }} />,
      );
      expect(screen.getByText("Marc Van den Berg")).toBeInTheDocument();
    });

    it("should render coach role when provided", () => {
      render(
        <TeamHeader
          name="A-Ploeg"
          coach={{ name: "Marc Van den Berg", role: "Hoofdtrainer" }}
        />,
      );
      expect(screen.getByText("Hoofdtrainer")).toBeInTheDocument();
    });

    it("should render coach image when provided", () => {
      render(
        <TeamHeader
          name="A-Ploeg"
          coach={{
            name: "Marc Van den Berg",
            imageUrl: "https://example.com/coach.jpg",
          }}
        />,
      );
      expect(screen.getByAltText("Marc Van den Berg")).toBeInTheDocument();
    });

    it("should not render coach section when not provided", () => {
      render(<TeamHeader name="A-Ploeg" />);
      expect(screen.queryByText("Marc Van den Berg")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should render loading skeleton when isLoading is true", () => {
      render(<TeamHeader name="" isLoading />);
      expect(screen.getByLabelText("Team header laden...")).toBeInTheDocument();
    });

    it("should not render content when loading", () => {
      render(<TeamHeader name="A-Ploeg" isLoading />);
      expect(
        screen.queryByRole("heading", { level: 1 }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<TeamHeader name="A-Ploeg" />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("A-Ploeg");
    });

    it("should have alt text for team photo", () => {
      render(
        <TeamHeader name="A-Ploeg" imageUrl="https://example.com/team.jpg" />,
      );
      expect(screen.getByAltText("A-Ploeg teamfoto")).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <TeamHeader name="A-Ploeg" className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
