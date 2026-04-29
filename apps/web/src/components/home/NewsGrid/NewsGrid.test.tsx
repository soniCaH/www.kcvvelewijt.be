// apps/web/src/components/home/NewsGrid/NewsGrid.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { NewsGrid, type NewsGridArticle } from "./NewsGrid";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

describe("NewsGrid", () => {
  const mockArticles: NewsGridArticle[] = [
    {
      href: "/nieuws/article-1",
      title: "First News Article",
      imageUrl: "/images/article-1.jpg",
      imageAlt: "Article 1 image",
      date: "20 januari 2025",
      tags: [{ name: "Ploeg" }],
    },
    {
      href: "/nieuws/article-2",
      title: "Second News Article",
      imageUrl: "/images/article-2.jpg",
      imageAlt: "Article 2 image",
      date: "19 januari 2025",
      tags: [{ name: "Jeugd" }],
    },
    {
      href: "/nieuws/article-3",
      title: "Third News Article",
      imageUrl: "/images/article-3.jpg",
      imageAlt: "Article 3 image",
      date: "18 januari 2025",
    },
  ];

  describe("Section structure", () => {
    it("renders a section element", () => {
      const { container } = render(<NewsGrid articles={mockArticles} />);
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders default title", () => {
      render(<NewsGrid articles={mockArticles} />);
      // SectionHeader composes EditorialHeading which auto-appends a period.
      expect(screen.getByText("Laatste nieuws.")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(<NewsGrid articles={mockArticles} title="Nieuwsoverzicht" />);
      expect(screen.getByText("Nieuwsoverzicht.")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <NewsGrid articles={mockArticles} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("View All link", () => {
    it("renders view all link by default", () => {
      render(<NewsGrid articles={mockArticles} />);
      const link = screen.getByRole("link", { name: /Alle berichten/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/nieuws");
    });

    it("hides view all link when showViewAll is false", () => {
      render(<NewsGrid articles={mockArticles} showViewAll={false} />);
      expect(
        screen.queryByRole("link", { name: /Alle berichten/i }),
      ).not.toBeInTheDocument();
    });

    it("uses custom viewAllHref", () => {
      render(<NewsGrid articles={mockArticles} viewAllHref="/nieuws" />);
      expect(
        screen.getByRole("link", { name: /Alle berichten/i }),
      ).toHaveAttribute("href", "/nieuws");
    });
  });

  describe("Grid layout", () => {
    it("renders the grid container", () => {
      const { container } = render(<NewsGrid articles={mockArticles} />);
      expect(container.querySelector(".grid")).toBeInTheDocument();
    });

    it("uses 2-column responsive grid", () => {
      const { container } = render(<NewsGrid articles={mockArticles} />);
      // outer grid is 2-col on md+
      const outerGrid = container.querySelector(".grid");
      expect(outerGrid).toHaveClass("grid-cols-1");
      expect(outerGrid?.className).toContain("md:grid-cols-");
    });
  });

  describe("Article rendering", () => {
    it("renders all article titles", () => {
      render(<NewsGrid articles={mockArticles} />);
      expect(screen.getByText("First News Article")).toBeInTheDocument();
      expect(screen.getByText("Second News Article")).toBeInTheDocument();
      expect(screen.getByText("Third News Article")).toBeInTheDocument();
    });

    it("renders article dates", () => {
      render(<NewsGrid articles={mockArticles} />);
      expect(screen.getByText("20 januari 2025")).toBeInTheDocument();
      expect(screen.getByText("19 januari 2025")).toBeInTheDocument();
      expect(screen.getByText("18 januari 2025")).toBeInTheDocument();
    });

    it("renders first article with featured variant (text-2xl heading)", () => {
      render(<NewsGrid articles={mockArticles} />);
      // First article heading is h3 with text-2xl!
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings[0]).toHaveClass("text-2xl!");
    });

    it("renders subsequent articles with standard variant (text-base heading)", () => {
      render(<NewsGrid articles={mockArticles} />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      // headings[1] and [2] are standard
      expect(headings[1]).toHaveClass("text-base!");
      expect(headings[2]).toHaveClass("text-base!");
    });

    it("renders article tags as badge", () => {
      render(<NewsGrid articles={mockArticles} />);
      // Tags rendered as badge text (no # prefix in NewsCard)
      expect(screen.getAllByText("Ploeg").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Jeugd").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Featured event stub", () => {
    const featuredEvent = {
      title: "Jeugdtoernooi 2026",
      href: "/evenementen/jeugdtoernooi",
      imageUrl: "/events/toernooi.jpg",
      imageAlt: "Jeugdtoernooi",
      badge: "Evenement",
      date: "18 april 2026",
    };

    it("renders event title in featured slot when featuredEvent provided", () => {
      render(
        <NewsGrid articles={mockArticles} featuredEvent={featuredEvent} />,
      );
      expect(screen.getByText("Jeugdtoernooi 2026")).toBeInTheDocument();
    });

    it("renders first article as standard (not featured) when event fills featured slot", () => {
      render(
        <NewsGrid articles={mockArticles} featuredEvent={featuredEvent} />,
      );
      const headings = screen.getAllByRole("heading", { level: 3 });
      // Event is featured (text-2xl), articles are standard (text-base)
      const featuredHeading = headings.find((h) =>
        h.textContent?.includes("Jeugdtoernooi"),
      );
      expect(featuredHeading).toHaveClass("text-2xl!");
      // First article is now standard
      const firstArticleHeading = headings.find((h) =>
        h.textContent?.includes("First News Article"),
      );
      expect(firstArticleHeading).toHaveClass("text-base!");
    });
  });

  describe("Empty state", () => {
    it("returns null when no articles and no featuredEvent", () => {
      const { container } = render(<NewsGrid articles={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders when only featuredEvent provided (no articles)", () => {
      const featuredEvent = {
        title: "Evenement zonder artikelen",
        href: "/evenementen/test",
        badge: "Evenement",
      };
      render(<NewsGrid articles={[]} featuredEvent={featuredEvent} />);
      expect(
        screen.getByText("Evenement zonder artikelen"),
      ).toBeInTheDocument();
    });
  });
});
