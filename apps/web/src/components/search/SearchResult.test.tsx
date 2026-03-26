/**
 * SearchResult Component Tests
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchResult } from "./SearchResult";
import {
  createMockArticle,
  createMockPlayer,
  createMockTeam,
  resetIdCounter,
} from "@/../tests/helpers/search.helpers";

// Mock Next.js modules
// Note: Kept in each file due to Vitest hoisting requirements
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
  }) => <img src={src} alt={alt} {...props} />,
}));

describe("SearchResult", () => {
  beforeEach(() => {
    // Reset ID counter to ensure deterministic IDs across tests
    resetIdCounter();
  });
  describe("Rendering", () => {
    it("should render article result", () => {
      const article = createMockArticle({
        title: "Test Article",
        description: "Test description",
      });

      render(<SearchResult result={article} />);

      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(screen.getByText("Test Article")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
      expect(screen.getByText("Nieuws")).toBeInTheDocument();
    });

    it("should render player result", () => {
      const player = createMockPlayer({
        title: "Jan Janssens",
        description: "Aanvaller - Eerste Ploeg",
      });

      render(<SearchResult result={player} />);

      expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
      expect(screen.getByText("Aanvaller - Eerste Ploeg")).toBeInTheDocument();
      expect(screen.getByText("Speler")).toBeInTheDocument();
    });

    it("should render team result", () => {
      const team = createMockTeam({
        title: "Eerste Ploeg",
        description: "Senioren team",
      });

      render(<SearchResult result={team} />);

      expect(screen.getByText("Eerste Ploeg")).toBeInTheDocument();
      expect(screen.getByText("Senioren team")).toBeInTheDocument();
      expect(screen.getByText("Team")).toBeInTheDocument();
    });

    it("should render correct link href", () => {
      const article = createMockArticle({ url: "/nieuws/test-article" });

      render(<SearchResult result={article} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/nieuws/test-article");
    });
  });

  describe("Article Type", () => {
    it("should display article image when provided", () => {
      const article = createMockArticle({
        imageUrl: "/images/test.jpg",
        title: "Article with image",
      });

      render(<SearchResult result={article} />);

      const image = screen.getByAltText("Article with image");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "/images/test.jpg");
    });

    it("should not display image container when imageUrl is missing", () => {
      const article = createMockArticle({
        imageUrl: undefined,
        title: "Article without image",
      });

      render(<SearchResult result={article} />);

      // No image should be rendered
      const image = screen.queryByRole("img");
      expect(image).not.toBeInTheDocument();
    });

    it("should display formatted date for articles", () => {
      const article = createMockArticle({
        date: "2024-03-15",
      });

      render(<SearchResult result={article} />);

      // Assert on numeric parts to be locale-agnostic (avoids small-ICU failures)
      expect(screen.getByText(/15.*2024/)).toBeInTheDocument();
    });

    it("should not display date when missing", () => {
      const article = createMockArticle({
        date: undefined,
        title: "Article without date",
      });

      render(<SearchResult result={article} />);

      // Date format pattern should not be present
      // Dutch dates follow pattern "DD maand YYYY" (e.g., "15 maart 2024")
      expect(
        screen.queryByText(/\d{1,2}\s+\w+\s+\d{4}/i),
      ).not.toBeInTheDocument();
    });

    it("should display up to 3 tags", () => {
      const article = createMockArticle({
        tags: ["Tag 1", "Tag 2", "Tag 3", "Tag 4"],
      });

      render(<SearchResult result={article} />);

      expect(screen.getByText("Tag 1")).toBeInTheDocument();
      expect(screen.getByText("Tag 2")).toBeInTheDocument();
      expect(screen.getByText("Tag 3")).toBeInTheDocument();
      expect(screen.queryByText("Tag 4")).not.toBeInTheDocument();
    });

    it("should show overflow indicator when more than 3 tags", () => {
      const article = createMockArticle({
        tags: ["Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5"],
      });

      render(<SearchResult result={article} />);

      expect(screen.getByText("+2 meer")).toBeInTheDocument();
    });

    it("should not show overflow indicator when 3 or fewer tags", () => {
      const article = createMockArticle({
        tags: ["Tag 1", "Tag 2", "Tag 3"],
      });

      render(<SearchResult result={article} />);

      expect(screen.queryByText(/\+\d+ meer/)).not.toBeInTheDocument();
    });

    it("should not display tags section when empty", () => {
      const article = createMockArticle({
        tags: [],
        title: "Article without tags",
      });

      render(<SearchResult result={article} />);

      // No overflow indicator should be present
      expect(screen.queryByText(/\+\d+ meer/)).not.toBeInTheDocument();
      // Article title should still render
      expect(screen.getByText("Article without tags")).toBeInTheDocument();
    });

    it("should not display tags section when undefined", () => {
      const article = createMockArticle({
        tags: undefined,
        title: "Article without tags",
      });

      render(<SearchResult result={article} />);

      // No overflow indicator should be present
      expect(screen.queryByText(/\+\d+ meer/)).not.toBeInTheDocument();
      // Article title should still render
      expect(screen.getByText("Article without tags")).toBeInTheDocument();
    });
  });

  describe("Player Type", () => {
    it("should not display date for players", () => {
      const player = createMockPlayer({
        title: "Test Player",
      });

      render(<SearchResult result={player} />);

      // Date format pattern should not be present for players
      expect(
        screen.queryByText(/\d{1,2}\s+\w+\s+\d{4}/i),
      ).not.toBeInTheDocument();
      // Player title should still render
      expect(screen.getByText("Test Player")).toBeInTheDocument();
    });

    it("should not display tags for players", () => {
      const player = createMockPlayer({
        title: "Test Player",
      });

      render(<SearchResult result={player} />);

      // No overflow indicator for players
      expect(screen.queryByText(/\+\d+ meer/)).not.toBeInTheDocument();
      // Player title should still render
      expect(screen.getByText("Test Player")).toBeInTheDocument();
    });

    it("should display player image when provided", () => {
      const player = createMockPlayer({
        imageUrl: "/images/player.jpg",
        title: "Jan Janssens",
      });

      render(<SearchResult result={player} />);

      const image = screen.getByAltText("Jan Janssens");
      expect(image).toBeInTheDocument();
    });
  });

  describe("Team Type", () => {
    it("should not display date for teams", () => {
      const team = createMockTeam({
        title: "Test Team",
      });

      render(<SearchResult result={team} />);

      // Date format pattern should not be present for teams
      expect(
        screen.queryByText(/\d{1,2}\s+\w+\s+\d{4}/i),
      ).not.toBeInTheDocument();
      // Team title should still render
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    it("should not display tags for teams", () => {
      const team = createMockTeam({
        title: "Test Team",
      });

      render(<SearchResult result={team} />);

      // No overflow indicator for teams
      expect(screen.queryByText(/\+\d+ meer/)).not.toBeInTheDocument();
      // Team title should still render
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    it("should display team image when provided", () => {
      const team = createMockTeam({
        imageUrl: "/images/team.jpg",
        title: "Eerste Ploeg",
      });

      render(<SearchResult result={team} />);

      const image = screen.getByAltText("Eerste Ploeg");
      expect(image).toBeInTheDocument();
    });
  });

  describe("Conditional Content", () => {
    it("should display description when provided", () => {
      const result = createMockArticle({
        description: "This is a description",
      });

      render(<SearchResult result={result} />);

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should not display description paragraph when missing", () => {
      const result = createMockArticle({
        description: undefined,
        title: "Article without description",
      });

      render(<SearchResult result={result} />);

      // Only title should be present, no description text
      expect(
        screen.getByText("Article without description"),
      ).toBeInTheDocument();
      // Verify no additional paragraph content besides title
      const allText = screen.getByRole("link").textContent;
      expect(allText).not.toContain("Test article description");
    });
  });

  describe("Accessibility", () => {
    it("should render as a link with correct role", () => {
      const result = createMockArticle();

      render(<SearchResult result={result} />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("should have accessible link text from title", () => {
      const result = createMockArticle({
        title: "Accessible Article Title",
      });

      render(<SearchResult result={result} />);

      expect(
        screen.getByRole("link", { name: /accessible article title/i }),
      ).toBeInTheDocument();
    });

    it("should have proper alt text for images", () => {
      const result = createMockArticle({
        title: "Article Title",
        imageUrl: "/images/test.jpg",
      });

      render(<SearchResult result={result} />);

      const image = screen.getByAltText("Article Title");
      expect(image).toBeInTheDocument();
    });

    it("should have aria-hidden on arrow icon", () => {
      const result = createMockArticle();

      render(<SearchResult result={result} />);

      const arrowWrapper = screen.getByTestId("search-result-arrow");
      const arrowIcon = arrowWrapper.querySelector("svg");
      expect(arrowIcon).toBeInTheDocument();
      expect(arrowIcon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
