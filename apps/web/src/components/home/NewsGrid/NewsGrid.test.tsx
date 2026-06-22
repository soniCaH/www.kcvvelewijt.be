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

const makeArticle = (
  n: number,
  over: Partial<NewsGridArticle> = {},
): NewsGridArticle => ({
  href: `/nieuws/article-${n}`,
  title: `Article ${n}`,
  imageUrl: `/images/article-${n}.jpg`,
  imageAlt: `Article ${n} image`,
  date: `${n} januari 2025`,
  tags: [{ name: `Tag${n}` }],
  ...over,
});

const sixArticles: NewsGridArticle[] = [1, 2, 3, 4, 5, 6].map((n) =>
  makeArticle(n),
);

describe("NewsGrid", () => {
  describe("Section structure", () => {
    it("renders a section element", () => {
      const { container } = render(<NewsGrid articles={sixArticles} />);
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders default title", () => {
      render(<NewsGrid articles={sixArticles} />);
      // SectionHeader composes EditorialHeading which auto-appends a period.
      expect(screen.getByText("Laatste nieuws.")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(<NewsGrid articles={sixArticles} title="Nieuwsoverzicht" />);
      expect(screen.getByText("Nieuwsoverzicht.")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <NewsGrid articles={sixArticles} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("View All link", () => {
    it("renders view all link by default", () => {
      render(<NewsGrid articles={sixArticles} />);
      const link = screen.getByRole("link", { name: /Al het nieuws/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/nieuws");
    });

    it("hides view all link when showViewAll is false", () => {
      render(<NewsGrid articles={sixArticles} showViewAll={false} />);
      expect(
        screen.queryByRole("link", { name: /Al het nieuws/i }),
      ).not.toBeInTheDocument();
    });

    it("uses custom viewAllHref", () => {
      render(<NewsGrid articles={sixArticles} viewAllHref="/archief" />);
      expect(
        screen.getByRole("link", { name: /Al het nieuws/i }),
      ).toHaveAttribute("href", "/archief");
    });
  });

  describe("R2.B flat 3×2 — no lead/supporting hierarchy", () => {
    it("renders every card with the standard variant (display-sm heading)", () => {
      render(<NewsGrid articles={sixArticles} />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings).toHaveLength(6);
      headings.forEach((heading) => {
        expect(heading).toHaveAttribute("data-size", "display-sm");
      });
    });

    it("renders cards inside semantic <ul>/<li> (not role='list' on divs)", () => {
      const { container } = render(<NewsGrid articles={sixArticles} />);
      const ul = container.querySelector("ul");
      expect(ul).not.toBeNull();
      expect(ul!.querySelectorAll(":scope > li")).toHaveLength(6);
    });
  });

  describe("Slot rotation cycle (6 entries: a / b / c / d / a / b)", () => {
    it("applies rotations across all 6 slots", () => {
      const { container } = render(<NewsGrid articles={sixArticles} />);
      const cards = container.querySelectorAll("a[data-rotation]");
      expect(cards).toHaveLength(6);
      const expected = ["a", "b", "c", "d", "a", "b"];
      expected.forEach((rot, idx) => {
        expect(cards[idx]).toHaveAttribute("data-rotation", rot);
      });
    });
  });

  describe("Per-articleType backgrounds (R3.B BG_BY_TYPE)", () => {
    it("transfer → jersey-deep; interview / announcement / event → cream", () => {
      const articles: NewsGridArticle[] = [
        makeArticle(1, { articleType: "transfer" }),
        makeArticle(2, { articleType: "interview" }),
        makeArticle(3, { articleType: "announcement" }),
        makeArticle(4, { articleType: "event" }),
      ];
      const { container } = render(<NewsGrid articles={articles} />);
      const cards = container.querySelectorAll("a[data-bg]");
      expect(cards[0]).toHaveAttribute("data-bg", "jersey-deep");
      expect(cards[1]).toHaveAttribute("data-bg", "cream");
      expect(cards[2]).toHaveAttribute("data-bg", "cream");
      expect(cards[3]).toHaveAttribute("data-bg", "cream");
    });

    it("falls back to cream when articleType is missing (legacy untyped)", () => {
      const { container } = render(
        <NewsGrid articles={[makeArticle(1, { articleType: null })]} />,
      );
      expect(container.querySelector("a[data-bg]")).toHaveAttribute(
        "data-bg",
        "cream",
      );
    });
  });

  describe("Aspect ratio", () => {
    it("applies landscape-16-9 aspect to every card", () => {
      const { container } = render(<NewsGrid articles={sixArticles} />);
      const cards = container.querySelectorAll("a[data-aspect]");
      expect(cards).toHaveLength(6);
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-aspect", "landscape-16-9");
      });
    });
  });

  describe("Partial states (R2.B graceful collapse)", () => {
    it("N=0 returns null", () => {
      const { container } = render(<NewsGrid articles={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("N=1 renders 1 card", () => {
      render(<NewsGrid articles={sixArticles.slice(0, 1)} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    });

    it("N=3 fills the first row", () => {
      render(<NewsGrid articles={sixArticles.slice(0, 3)} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    });

    it("N=6 fills the full 3×2", () => {
      render(<NewsGrid articles={sixArticles} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
    });

    it("N=8 caps at the first 6 — overflow flows through the 'Al het nieuws →' link", () => {
      const eight = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => makeArticle(n));
      render(<NewsGrid articles={eight} />);
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
      // The link is the contract for "where does the 7th+ article go" — if
      // it disappears (e.g. showViewAll regression) overflow becomes
      // inaccessible from the homepage.
      expect(
        screen.getByRole("link", { name: /Al het nieuws/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Article rendering", () => {
    it("renders all article titles", () => {
      render(<NewsGrid articles={sixArticles} />);
      // EditorialHeading appends a trailing period — match with optional `.`.
      sixArticles.forEach((a) => {
        expect(
          screen.getByRole("heading", {
            level: 3,
            name: new RegExp(`^${a.title}\\.?$`),
          }),
        ).toBeInTheDocument();
      });
    });

    it("renders article tags as badge", () => {
      render(<NewsGrid articles={sixArticles} />);
      expect(screen.getAllByText("Tag1").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Tag6").length).toBeGreaterThanOrEqual(1);
    });
  });
});
