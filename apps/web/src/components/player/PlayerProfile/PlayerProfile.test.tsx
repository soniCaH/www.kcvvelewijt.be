/**
 * PlayerProfile Component Tests
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlayerProfile } from "./PlayerProfile";
import type { PlayerStatsData } from "../PlayerStats/PlayerStats";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} data-testid="player-image" {...props} />,
}));

describe("PlayerProfile", () => {
  const defaultProps = {
    firstName: "Chiel",
    lastName: "Bertens",
    position: "Verdediger",
    teamName: "Eerste Ploeg",
  };

  describe("rendering", () => {
    it("renders player name correctly", () => {
      render(<PlayerProfile {...defaultProps} />);

      expect(screen.getByText("Chiel")).toBeInTheDocument();
      expect(screen.getByText("Bertens")).toBeInTheDocument();
    });

    it("renders position and team name", () => {
      render(<PlayerProfile {...defaultProps} />);

      expect(screen.getByText("Verdediger")).toBeInTheDocument();
      expect(screen.getByText("Eerste Ploeg")).toBeInTheDocument();
    });

    it("renders jersey number when provided", () => {
      render(<PlayerProfile {...defaultProps} number={5} />);

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("does not render jersey number when not provided", () => {
      render(<PlayerProfile {...defaultProps} />);

      // The number section should not exist
      const numberElements = screen.queryAllByText(/^\d+$/);
      expect(numberElements).toHaveLength(0);
    });

    it("renders player image when imageUrl is provided", () => {
      render(
        <PlayerProfile
          {...defaultProps}
          imageUrl="https://example.com/player.png"
        />,
      );

      const image = screen.getByTestId("player-image");
      expect(image).toHaveAttribute("src", "https://example.com/player.png");
      expect(image).toHaveAttribute("alt", "Chiel Bertens");
    });

    it("renders placeholder when no image URL", () => {
      render(<PlayerProfile {...defaultProps} />);

      // Should render the placeholder SVG
      expect(screen.queryByTestId("player-image")).not.toBeInTheDocument();
    });

    it("renders captain badge when isCaptain is true", () => {
      render(<PlayerProfile {...defaultProps} isCaptain />);

      expect(screen.getByText("Aanvoerder")).toBeInTheDocument();
    });

    it("does not render captain badge when isCaptain is false", () => {
      render(<PlayerProfile {...defaultProps} isCaptain={false} />);

      expect(screen.queryByText("Aanvoerder")).not.toBeInTheDocument();
    });
  });

  describe("PlayerBio integration", () => {
    it("renders PlayerBio with birth date", () => {
      render(<PlayerProfile {...defaultProps} birthDate="1995-03-15" />);

      expect(screen.getByText("Geboortedatum")).toBeInTheDocument();
    });

    it("renders PlayerBio with join date", () => {
      render(<PlayerProfile {...defaultProps} joinDate="2020-07-01" />);

      expect(screen.getByText("Bij KCVV sinds")).toBeInTheDocument();
    });

    it("renders PlayerBio with biography", () => {
      render(
        <PlayerProfile
          {...defaultProps}
          biography="Een geweldige speler met veel ervaring."
        />,
      );

      expect(
        screen.getByText("Een geweldige speler met veel ervaring."),
      ).toBeInTheDocument();
    });

    it("renders empty bio message when no bio info provided", () => {
      render(<PlayerProfile {...defaultProps} />);

      expect(
        screen.getByText("Geen biografie beschikbaar."),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<PlayerProfile {...defaultProps} isLoading />);

      expect(screen.getByLabelText("Profiel laden...")).toBeInTheDocument();
    });

    it("does not render player info in loading state", () => {
      render(<PlayerProfile {...defaultProps} isLoading />);

      expect(screen.queryByText("Chiel")).not.toBeInTheDocument();
      expect(screen.queryByText("Bertens")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders error message when error is provided", () => {
      render(
        <PlayerProfile
          {...defaultProps}
          error="Kon spelersprofiel niet laden."
        />,
      );

      expect(
        screen.getByText("Kon spelersprofiel niet laden."),
      ).toBeInTheDocument();
    });

    it("renders retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(
        <PlayerProfile {...defaultProps} error="Error" onRetry={onRetry} />,
      );

      const retryButton = screen.getByRole("button", {
        name: "Opnieuw proberen",
      });
      expect(retryButton).toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", () => {
      const onRetry = vi.fn();
      render(
        <PlayerProfile {...defaultProps} error="Error" onRetry={onRetry} />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Opnieuw proberen" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("does not render retry button when onRetry is not provided", () => {
      render(<PlayerProfile {...defaultProps} error="Error" />);

      expect(
        screen.queryByRole("button", { name: "Opnieuw proberen" }),
      ).not.toBeInTheDocument();
    });

    it("has role alert for error state", () => {
      render(<PlayerProfile {...defaultProps} error="Error" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("PlayerStats integration", () => {
    const outfieldStats: PlayerStatsData[] = [
      {
        season: "2025-2026",
        matches: 10,
        goals: 4,
        assists: 2,
        yellowCards: 1,
        redCards: 0,
        minutesPlayed: 900,
      },
    ];

    it("renders PlayerStats when stats are provided", () => {
      render(
        <PlayerProfile
          {...defaultProps}
          statsPosition="outfield"
          stats={outfieldStats}
        />,
      );

      expect(screen.getByText("Statistieken")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument(); // goals
    });

    it("renders empty state when stats is empty array", () => {
      render(
        <PlayerProfile {...defaultProps} statsPosition="outfield" stats={[]} />,
      );

      expect(
        screen.getByText("Geen statistieken beschikbaar."),
      ).toBeInTheDocument();
    });

    it("does not render PlayerStats when stats prop is omitted", () => {
      render(<PlayerProfile {...defaultProps} />);

      expect(screen.queryByText("Statistieken")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("uses semantic heading for player name", () => {
      render(<PlayerProfile {...defaultProps} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("has proper aria-hidden on decorative elements", () => {
      const { container } = render(
        <PlayerProfile {...defaultProps} number={5} />,
      );

      // Jersey number should be aria-hidden
      const decorativeNumber = container.querySelector('[aria-hidden="true"]');
      expect(decorativeNumber).toBeInTheDocument();
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the root element", () => {
      const ref = { current: null };
      render(<PlayerProfile {...defaultProps} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("forwards ref in loading state", () => {
      const ref = { current: null };
      render(<PlayerProfile {...defaultProps} isLoading ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("forwards ref in error state", () => {
      const ref = { current: null };
      render(<PlayerProfile {...defaultProps} error="Error" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("className merging", () => {
    it("applies custom className to root element", () => {
      const { container } = render(
        <PlayerProfile {...defaultProps} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies custom className in loading state", () => {
      const { container } = render(
        <PlayerProfile {...defaultProps} isLoading className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
