/**
 * SearchResults Component Tests
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchResults } from "./SearchResults";
import {
  mockSearchResults,
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

describe("SearchResults", () => {
  beforeEach(() => {
    // Reset ID counter to ensure deterministic IDs across tests
    resetIdCounter();
  });
  describe("Rendering", () => {
    it("should render results list", () => {
      render(
        <SearchResults
          results={mockSearchResults}
          query="test"
          activeType="all"
        />,
      );

      // Should display results
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });

    it("should display result count message", () => {
      render(
        <SearchResults
          results={mockSearchResults}
          query="test"
          activeType="all"
        />,
      );

      expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    it("should display all results when activeType is 'all'", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockPlayer({ title: "Player 1" }),
        createMockTeam({ title: "Team 1" }),
      ];

      render(<SearchResults results={results} query="test" activeType="all" />);

      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.getByText("Team 1")).toBeInTheDocument();
    });
  });

  describe("Client-Side Filtering", () => {
    it("should filter to show only articles when activeType is 'article'", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockPlayer({ title: "Player 1" }),
        createMockTeam({ title: "Team 1" }),
      ];

      render(
        <SearchResults results={results} query="test" activeType="article" />,
      );

      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.queryByText("Player 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Team 1")).not.toBeInTheDocument();
    });

    it("should filter to show only players when activeType is 'player'", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockPlayer({ title: "Player 1" }),
        createMockTeam({ title: "Team 1" }),
      ];

      render(
        <SearchResults results={results} query="test" activeType="player" />,
      );

      expect(screen.queryByText("Article 1")).not.toBeInTheDocument();
      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.queryByText("Team 1")).not.toBeInTheDocument();
    });

    it("should filter to show only teams when activeType is 'team'", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockPlayer({ title: "Player 1" }),
        createMockTeam({ title: "Team 1" }),
      ];

      render(
        <SearchResults results={results} query="test" activeType="team" />,
      );

      expect(screen.queryByText("Article 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Player 1")).not.toBeInTheDocument();
      expect(screen.getByText("Team 1")).toBeInTheDocument();
    });

    it("should handle multiple results of same type", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockArticle({ title: "Article 2" }),
        createMockArticle({ title: "Article 3" }),
        createMockPlayer({ title: "Player 1" }),
      ];

      render(
        <SearchResults results={results} query="test" activeType="article" />,
      );

      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Article 2")).toBeInTheDocument();
      expect(screen.getByText("Article 3")).toBeInTheDocument();
      expect(screen.queryByText("Player 1")).not.toBeInTheDocument();
    });

    it("should show empty state when filter yields no results", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockArticle({ title: "Article 2" }),
      ];

      render(
        <SearchResults results={results} query="test" activeType="player" />,
      );

      expect(screen.getByText("Geen resultaten gevonden")).toBeInTheDocument();
    });
  });

  describe("Result Count Message", () => {
    it("should use singular 'resultaat' for 1 result", () => {
      const results = [createMockArticle({ title: "Single Article" })];

      render(<SearchResults results={results} query="test" activeType="all" />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/resultaat voor/i)).toBeInTheDocument();
    });

    it("should use plural 'resultaten' for multiple results", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockArticle({ title: "Article 2" }),
      ];

      render(<SearchResults results={results} query="test" activeType="all" />);

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText(/resultaten voor/i)).toBeInTheDocument();
    });

    it("should display the search query in the count message", () => {
      render(
        <SearchResults
          results={mockSearchResults}
          query="KCVV voetbal"
          activeType="all"
        />,
      );

      expect(screen.getByText("KCVV voetbal")).toBeInTheDocument();
    });

    it("should reflect filtered count, not total count", () => {
      const results = [
        createMockArticle({ title: "Article 1" }),
        createMockArticle({ title: "Article 2" }),
        createMockPlayer({ title: "Player 1" }),
      ];

      render(
        <SearchResults results={results} query="test" activeType="article" />,
      );

      // Should show 2 (filtered) not 3 (total)
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no results", () => {
      render(<SearchResults results={[]} query="nothing" activeType="all" />);

      expect(screen.getByText("Geen resultaten gevonden")).toBeInTheDocument();
      expect(
        screen.getByText(/probeer een andere zoekopdracht/i),
      ).toBeInTheDocument();
    });

    it("should display empty state with emoji", () => {
      render(<SearchResults results={[]} query="nothing" activeType="all" />);

      expect(screen.getByText("🔍")).toBeInTheDocument();
    });

    it("should not display count message when empty", () => {
      render(<SearchResults results={[]} query="nothing" activeType="all" />);

      expect(screen.queryByText(/resultaten voor/i)).not.toBeInTheDocument();
    });

    it("should display empty state when filter removes all results", () => {
      const results = [createMockArticle({ title: "Article" })];

      render(
        <SearchResults results={results} query="test" activeType="player" />,
      );

      expect(screen.getByText("Geen resultaten gevonden")).toBeInTheDocument();
    });
  });

  describe("Results Display", () => {
    it("should pass result data to SearchResult components", () => {
      const result = createMockArticle({
        title: "Unique Title",
        description: "Unique description",
      });

      render(
        <SearchResults results={[result]} query="test" activeType="all" />,
      );

      expect(screen.getByText("Unique Title")).toBeInTheDocument();
      expect(screen.getByText("Unique description")).toBeInTheDocument();
    });

    it("should use unique keys combining type and id", () => {
      const results = [
        createMockArticle({ id: "1", title: "Article" }),
        createMockPlayer({ id: "1", title: "Player" }), // Same ID, different type
      ];

      const { container } = render(
        <SearchResults results={results} query="test" activeType="all" />,
      );

      // Both should render without key conflicts
      const links = container.querySelectorAll("a");
      expect(links).toHaveLength(2);
    });

    it("should render results in order", () => {
      const results = [
        createMockArticle({ title: "First" }),
        createMockArticle({ title: "Second" }),
        createMockArticle({ title: "Third" }),
      ];

      render(<SearchResults results={results} query="test" activeType="all" />);

      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveTextContent("First");
      expect(links[1]).toHaveTextContent("Second");
      expect(links[2]).toHaveTextContent("Third");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array gracefully", () => {
      render(<SearchResults results={[]} query="test" activeType="all" />);

      expect(screen.getByText("Geen resultaten gevonden")).toBeInTheDocument();
    });

    it("should handle single result", () => {
      const result = createMockArticle({ title: "Only One" });

      render(
        <SearchResults results={[result]} query="test" activeType="all" />,
      );

      expect(screen.getByText("Only One")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/resultaat voor/i)).toBeInTheDocument();
    });

    it("should handle large number of results", () => {
      const results = Array.from({ length: 50 }, (_, i) =>
        createMockArticle({ title: `Article ${i + 1}` }),
      );

      render(<SearchResults results={results} query="test" activeType="all" />);

      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Article 50")).toBeInTheDocument();
    });

    it("should handle special characters in query", () => {
      render(
        <SearchResults
          results={mockSearchResults}
          query="test & <special> 'chars'"
          activeType="all"
        />,
      );

      expect(screen.getByText("test & <special> 'chars'")).toBeInTheDocument();
    });

    it("should rerender when results change", () => {
      const initialResults = [createMockArticle({ title: "Initial" })];

      const { rerender } = render(
        <SearchResults
          results={initialResults}
          query="test"
          activeType="all"
        />,
      );

      expect(screen.getByText("Initial")).toBeInTheDocument();

      const newResults = [createMockArticle({ title: "Updated" })];

      rerender(
        <SearchResults results={newResults} query="test" activeType="all" />,
      );

      expect(screen.queryByText("Initial")).not.toBeInTheDocument();
      expect(screen.getByText("Updated")).toBeInTheDocument();
    });

    it("should rerender when activeType changes", () => {
      const results = [
        createMockArticle({
          id: "article-1",
          title: "News Article",
          tags: [],
        }),
        createMockPlayer({ id: "player-1", title: "Player Name" }),
      ];

      const { rerender } = render(
        <SearchResults results={results} query="test" activeType="all" />,
      );

      expect(screen.getByText("News Article")).toBeInTheDocument();
      expect(screen.getByText("Player Name")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // Count should be 2

      rerender(
        <SearchResults results={results} query="test" activeType="article" />,
      );

      expect(screen.getByText("News Article")).toBeInTheDocument();
      expect(screen.queryByText("Player Name")).not.toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument(); // Count should be 1
    });
  });

  describe("Accessibility", () => {
    it("should use semantic HTML structure", () => {
      render(
        <SearchResults
          results={mockSearchResults}
          query="test"
          activeType="all"
        />,
      );

      // Each result should be accessible as a link
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      // Results should have accessible text content
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("should maintain accessible links in results", () => {
      const results = [
        createMockArticle({ title: "Accessible Article", url: "/nieuws/test" }),
      ];

      render(<SearchResults results={results} query="test" activeType="all" />);

      const link = screen.getByRole("link", { name: /accessible article/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/nieuws/test");
    });
  });
});
