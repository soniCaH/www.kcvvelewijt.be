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

const makeArticle = (n: number): NewsGridArticle => ({
  href: `/nieuws/article-${n}`,
  title: `Article ${n}`,
  imageUrl: `/images/article-${n}.jpg`,
  imageAlt: `Article ${n} image`,
  date: `${n} januari 2025`,
  tags: [{ name: `Tag${n}` }],
});

const fiveArticles: NewsGridArticle[] = [1, 2, 3, 4, 5].map(makeArticle);

describe("NewsGrid", () => {
  describe("Section structure", () => {
    it("renders a section element", () => {
      const { container } = render(<NewsGrid articles={fiveArticles} />);
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders default title", () => {
      render(<NewsGrid articles={fiveArticles} />);
      // SectionHeader composes EditorialHeading which auto-appends a period.
      expect(screen.getByText("Laatste nieuws.")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(<NewsGrid articles={fiveArticles} title="Nieuwsoverzicht" />);
      expect(screen.getByText("Nieuwsoverzicht.")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <NewsGrid articles={fiveArticles} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("View All link", () => {
    it("renders view all link by default", () => {
      render(<NewsGrid articles={fiveArticles} />);
      const link = screen.getByRole("link", { name: /Alle berichten/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/nieuws");
    });

    it("hides view all link when showViewAll is false", () => {
      render(<NewsGrid articles={fiveArticles} showViewAll={false} />);
      expect(
        screen.queryByRole("link", { name: /Alle berichten/i }),
      ).not.toBeInTheDocument();
    });

    it("uses custom viewAllHref", () => {
      render(<NewsGrid articles={fiveArticles} viewAllHref="/archief" />);
      expect(
        screen.getByRole("link", { name: /Alle berichten/i }),
      ).toHaveAttribute("href", "/archief");
    });
  });

  describe("Lead vs supporting variant", () => {
    it("renders the first article with featured variant (text-2xl heading)", () => {
      render(<NewsGrid articles={fiveArticles} />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings[0]).toHaveClass("text-2xl!");
    });

    it("renders subsequent articles with standard variant (text-base heading)", () => {
      render(<NewsGrid articles={fiveArticles} />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings[1]).toHaveClass("text-base!");
      expect(headings[4]).toHaveClass("text-base!");
    });
  });

  describe("Slot rotation cycle (Round 5d T.1)", () => {
    it("applies rotations [a, b, c, d, a] across the 5 slots", () => {
      const { container } = render(<NewsGrid articles={fiveArticles} />);
      const cards = container.querySelectorAll("[data-rotation]");
      expect(cards).toHaveLength(5);
      expect(cards[0]).toHaveAttribute("data-rotation", "a");
      expect(cards[1]).toHaveAttribute("data-rotation", "b");
      expect(cards[2]).toHaveAttribute("data-rotation", "c");
      expect(cards[3]).toHaveAttribute("data-rotation", "d");
      expect(cards[4]).toHaveAttribute("data-rotation", "a");
    });
  });

  describe("Aspect ratio (Round 5c C.1)", () => {
    it("applies landscape-16-9 aspect to every card", () => {
      const { container } = render(<NewsGrid articles={fiveArticles} />);
      const cards = container.querySelectorAll("[data-aspect]");
      expect(cards).toHaveLength(5);
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-aspect", "landscape-16-9");
      });
    });
  });

  describe("Sparse states (Round 5f E.1)", () => {
    it("N=0 returns null", () => {
      const { container } = render(<NewsGrid articles={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("N=1 renders only the lead", () => {
      render(<NewsGrid articles={fiveArticles.slice(0, 1)} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    });

    it("N=2 renders lead + 1 supporting", () => {
      render(<NewsGrid articles={fiveArticles.slice(0, 2)} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    });

    it("N=3 renders lead + 2 supporting", () => {
      render(<NewsGrid articles={fiveArticles.slice(0, 3)} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    });

    it("N=4 renders lead + 3 supporting", () => {
      render(<NewsGrid articles={fiveArticles.slice(0, 4)} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    });

    it("N=5 renders lead + 4 supporting (full cluster)", () => {
      render(<NewsGrid articles={fiveArticles} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
    });

    it("only spans the lead 2 rows when N>=3", () => {
      const { container: c2 } = render(
        <NewsGrid articles={fiveArticles.slice(0, 2)} />,
      );
      expect(c2.querySelector(".md\\:row-span-2")).toBeNull();

      const { container: c3 } = render(
        <NewsGrid articles={fiveArticles.slice(0, 3)} />,
      );
      expect(c3.querySelector(".md\\:row-span-2")).toBeInTheDocument();
    });
  });

  describe("Article rendering", () => {
    it("renders all article titles", () => {
      render(<NewsGrid articles={fiveArticles} />);
      fiveArticles.forEach((a) => {
        expect(screen.getByText(a.title)).toBeInTheDocument();
      });
    });

    it("renders article tags as badge", () => {
      render(<NewsGrid articles={fiveArticles} />);
      expect(screen.getAllByText("Tag1").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Tag5").length).toBeGreaterThanOrEqual(1);
    });
  });
});
