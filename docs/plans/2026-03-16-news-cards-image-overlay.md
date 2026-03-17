# News Cards Image-Overlay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the homepage `LatestNews` section's old card layout with a full-bleed image-overlay `NewsCard` in a 1 featured + 2 standard grid.

**Architecture:** New `NewsCard` component (server, no `"use client"`) lives alongside `ArticleCard` (untouched). `LatestNews` is updated in-place to use `NewsCard` and a new 2-column grid. A `featuredEvent` stub prop is typed now; wired in #802.

**Tech Stack:** Next.js 16, Tailwind CSS v4, `next/image`, Vitest + Testing Library, Storybook 10 (`@storybook/nextjs-vite`).

---

### Task 1: Write failing `NewsCard` tests

**Files:**

- Create: `apps/web/src/components/home/LatestNews/NewsCard.test.tsx`

**Step 1: Create the test file**

```typescript
// apps/web/src/components/home/LatestNews/NewsCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { NewsCard } from "./NewsCard";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

describe("NewsCard", () => {
  const defaultProps = {
    title: "Test Article Title",
    href: "/news/test-article",
  };

  describe("Rendering", () => {
    it("renders as article element", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("renders title in a heading", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
        "Test Article Title",
      );
    });

    it("renders as a link with correct href", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/news/test-article",
      );
    });
  });

  describe("Image", () => {
    it("renders image when imageUrl provided", () => {
      render(
        <NewsCard {...defaultProps} imageUrl="/test.jpg" imageAlt="Test image" />,
      );
      expect(screen.getByRole("img")).toHaveAttribute("alt", "Test image");
    });

    it("uses title as alt when imageAlt not provided", () => {
      render(<NewsCard {...defaultProps} imageUrl="/test.jpg" />);
      expect(screen.getByRole("img")).toHaveAttribute(
        "alt",
        "Test Article Title",
      );
    });

    it("renders no img element when imageUrl not provided", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("Badge and date", () => {
    it("renders badge above title", () => {
      render(<NewsCard {...defaultProps} badge="Clubnieuws" />);
      // badge appears above title AND in footer — getAllByText
      expect(screen.getAllByText("Clubnieuws").length).toBeGreaterThanOrEqual(1);
    });

    it("renders date in footer", () => {
      render(<NewsCard {...defaultProps} date="5 mei 2025" />);
      expect(screen.getByText("5 mei 2025")).toBeInTheDocument();
    });

    it("does not render footer when no date and no badge", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(
        container.querySelector(".border-t.border-white\\/10"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("standard variant uses text-base title", () => {
      render(<NewsCard {...defaultProps} variant="standard" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
        "text-base",
      );
    });

    it("featured variant uses text-2xl title", () => {
      render(<NewsCard {...defaultProps} variant="featured" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
        "text-2xl",
      );
    });

    it("defaults to standard variant", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
        "text-base",
      );
    });
  });

  describe("Hover and interaction", () => {
    it("has group class for hover coordination", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toHaveClass("group");
    });

    it("has hover translate class", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toHaveClass(
        "hover:-translate-y-1",
      );
    });
  });

  describe("Custom className", () => {
    it("accepts custom className on the article", () => {
      const { container } = render(
        <NewsCard {...defaultProps} className="my-custom-class" />,
      );
      expect(container.querySelector("article")).toHaveClass("my-custom-class");
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/web && pnpm vitest run src/components/home/LatestNews/NewsCard.test.tsx
```

Expected: `Cannot find module './NewsCard'`

---

### Task 2: Implement `NewsCard`

**Files:**

- Create: `apps/web/src/components/home/LatestNews/NewsCard.tsx`

**Step 1: Create the component**

```tsx
// apps/web/src/components/home/LatestNews/NewsCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface NewsCardProps {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Single category label — shown above title and in footer */
  badge?: string;
  date?: string;
  variant?: "standard" | "featured";
  className?: string;
}

export const NewsCard = ({
  title,
  href,
  imageUrl,
  imageAlt,
  badge,
  date,
  variant = "standard",
  className,
}: NewsCardProps) => {
  const isFeatured = variant === "featured";

  return (
    <article
      className={cn(
        // Base
        "relative group overflow-hidden rounded bg-kcvv-black",
        // Hover lift + shadow
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        // Green top-border revealed on hover via before pseudo-element
        "before:absolute before:top-0 before:inset-x-0 before:h-0.5 before:bg-kcvv-green",
        "before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 before:z-10",
        // Aspect ratio — wide on desktop for featured, square-ish for standard
        isFeatured ? "aspect-[3/2] md:aspect-[21/9]" : "aspect-[3/2]",
        className,
      )}
    >
      <Link href={href} className="absolute inset-0">
        {/* Background image */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes={
              isFeatured
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
          />
        ) : (
          <div className="absolute inset-0 bg-kcvv-black" aria-hidden="true" />
        )}

        {/* Bottom gradient for text legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-kcvv-black/90 to-transparent"
          aria-hidden="true"
        />

        {/* Content overlay */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            isFeatured ? "p-6 md:p-8" : "p-5",
          )}
        >
          {badge && (
            <span className="block border-l-2 border-kcvv-green pl-2 text-kcvv-green text-xs font-bold uppercase tracking-wider mb-2">
              {badge}
            </span>
          )}

          <h3
            className={cn(
              "text-white font-bold leading-snug line-clamp-3",
              isFeatured ? "text-2xl" : "text-base",
            )}
          >
            {title}
          </h3>

          {(date ?? badge) && (
            <div className="border-t border-white/10 mt-3 pt-3 text-white/40 text-xs flex justify-between">
              {date && <time>{date}</time>}
              {badge && <span>{badge}</span>}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
};
```

**Step 2: Run tests — expect pass**

```bash
cd apps/web && pnpm vitest run src/components/home/LatestNews/NewsCard.test.tsx
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/components/home/LatestNews/NewsCard.tsx \
        apps/web/src/components/home/LatestNews/NewsCard.test.tsx
git commit -m "feat(ui): NewsCard — image-overlay card component (#813)"
```

---

### Task 3: `NewsCard` Storybook stories

**Files:**

- Create: `apps/web/src/components/home/LatestNews/NewsCard.stories.tsx`

**Step 1: Create the stories file**

```typescript
// apps/web/src/components/home/LatestNews/NewsCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsCard } from "./NewsCard";

const meta = {
  title: "Features/News/NewsCard",
  component: NewsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Full-bleed image-overlay card for news articles and future events. " +
          "Reusable across any content type — passes title, href, badge, date as generic props.",
      },
    },
  },
  argTypes: {
    variant: { control: "radio", options: ["standard", "featured"] },
    badge: { control: "text" },
    date: { control: "text" },
    imageUrl: { control: "text" },
  },
} satisfies Meta<typeof NewsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    href: "/news/derby-overwinning",
    imageUrl: "https://picsum.photos/800/500?random=1",
    imageAlt: "Derby match",
    badge: "Competitie",
    date: "15 januari 2025",
    variant: "standard",
  },
};

export const Featured: Story = {
  args: {
    title:
      "Spelersvoorstelling seizoen 2025-2026: versterkingen voor nationaal debuut",
    href: "/news/spelersvoorstelling",
    imageUrl: "https://picsum.photos/1200/500?random=2",
    imageAlt: "New players announcement",
    badge: "Selectie",
    date: "14 maart 2026",
    variant: "featured",
  },
};

export const WithoutImage: Story = {
  args: {
    title: "Nieuwe trainingsschema seizoen 2025-2026 bekendgemaakt",
    href: "/news/trainingsschema",
    badge: "Club",
    date: "12 januari 2025",
    variant: "standard",
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/news/titel",
    imageUrl: "https://picsum.photos/800/500?random=3",
    imageAlt: "Championship celebration",
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "standard",
  },
};

export const FeaturedLongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/news/titel",
    imageUrl: "https://picsum.photos/1200/500?random=4",
    imageAlt: "Championship celebration",
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "featured",
  },
};

export const NoBadge: Story = {
  args: {
    title: "Clubbericht zonder categorie",
    href: "/news/bericht",
    imageUrl: "https://picsum.photos/800/500?random=5",
    imageAlt: "Club news",
    date: "10 januari 2025",
    variant: "standard",
  },
};

export const MobileView: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: "mobile1" } },
};
```

**Step 2: Verify Storybook builds without error**

```bash
cd apps/web && pnpm storybook build --quiet 2>&1 | tail -5
```

Expected: `✓ built in Xs` (no errors).

**Step 3: Commit**

```bash
git add apps/web/src/components/home/LatestNews/NewsCard.stories.tsx
git commit -m "feat(ui): NewsCard Storybook stories — Features/News/NewsCard (#813)"
```

---

### Task 4: Update `LatestNews` tests

**Files:**

- Modify: `apps/web/src/components/home/LatestNews/LatestNews.test.tsx`

**Step 1: Replace the test file**

```typescript
// apps/web/src/components/home/LatestNews/LatestNews.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { LatestNews, type LatestNewsArticle } from "./LatestNews";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

describe("LatestNews", () => {
  const mockArticles: LatestNewsArticle[] = [
    {
      href: "/news/article-1",
      title: "First News Article",
      imageUrl: "/images/article-1.jpg",
      imageAlt: "Article 1 image",
      date: "20 januari 2025",
      tags: [{ name: "Ploeg" }],
    },
    {
      href: "/news/article-2",
      title: "Second News Article",
      imageUrl: "/images/article-2.jpg",
      imageAlt: "Article 2 image",
      date: "19 januari 2025",
      tags: [{ name: "Jeugd" }],
    },
    {
      href: "/news/article-3",
      title: "Third News Article",
      imageUrl: "/images/article-3.jpg",
      imageAlt: "Article 3 image",
      date: "18 januari 2025",
    },
  ];

  describe("Section structure", () => {
    it("renders a section element", () => {
      const { container } = render(<LatestNews articles={mockArticles} />);
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders default title", () => {
      render(<LatestNews articles={mockArticles} />);
      expect(screen.getByText("Laatste nieuws")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(<LatestNews articles={mockArticles} title="Nieuwsoverzicht" />);
      expect(screen.getByText("Nieuwsoverzicht")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <LatestNews articles={mockArticles} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("View All link", () => {
    it("renders view all link by default", () => {
      render(<LatestNews articles={mockArticles} />);
      const link = screen.getByRole("link", { name: /Alle berichten/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/news");
    });

    it("hides view all link when showViewAll is false", () => {
      render(<LatestNews articles={mockArticles} showViewAll={false} />);
      expect(
        screen.queryByRole("link", { name: /Alle berichten/i }),
      ).not.toBeInTheDocument();
    });

    it("uses custom viewAllHref", () => {
      render(<LatestNews articles={mockArticles} viewAllHref="/nieuws" />);
      expect(screen.getByRole("link", { name: /Alle berichten/i })).toHaveAttribute(
        "href",
        "/nieuws",
      );
    });
  });

  describe("Grid layout", () => {
    it("renders the grid container", () => {
      const { container } = render(<LatestNews articles={mockArticles} />);
      expect(container.querySelector(".grid")).toBeInTheDocument();
    });

    it("uses 2-column responsive grid", () => {
      const { container } = render(<LatestNews articles={mockArticles} />);
      // outer grid is 2-col on md+
      const outerGrid = container.querySelector(".grid");
      expect(outerGrid).toHaveClass("grid-cols-1");
      expect(outerGrid?.className).toContain("md:grid-cols-");
    });
  });

  describe("Article rendering", () => {
    it("renders all article titles", () => {
      render(<LatestNews articles={mockArticles} />);
      expect(screen.getByText("First News Article")).toBeInTheDocument();
      expect(screen.getByText("Second News Article")).toBeInTheDocument();
      expect(screen.getByText("Third News Article")).toBeInTheDocument();
    });

    it("renders article dates", () => {
      render(<LatestNews articles={mockArticles} />);
      expect(screen.getByText("20 januari 2025")).toBeInTheDocument();
      expect(screen.getByText("19 januari 2025")).toBeInTheDocument();
      expect(screen.getByText("18 januari 2025")).toBeInTheDocument();
    });

    it("renders first article with featured variant (text-2xl heading)", () => {
      render(<LatestNews articles={mockArticles} />);
      // First article heading is h3 with text-2xl
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings[0]).toHaveClass("text-2xl");
    });

    it("renders subsequent articles with standard variant (text-base heading)", () => {
      render(<LatestNews articles={mockArticles} />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      // headings[1] and [2] are standard
      expect(headings[1]).toHaveClass("text-base");
      expect(headings[2]).toHaveClass("text-base");
    });

    it("renders article tags as badge", () => {
      render(<LatestNews articles={mockArticles} />);
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
        <LatestNews articles={mockArticles} featuredEvent={featuredEvent} />,
      );
      expect(screen.getByText("Jeugdtoernooi 2026")).toBeInTheDocument();
    });

    it("renders first article as standard (not featured) when event fills featured slot", () => {
      render(
        <LatestNews articles={mockArticles} featuredEvent={featuredEvent} />,
      );
      const headings = screen.getAllByRole("heading", { level: 3 });
      // Event is featured (text-2xl), articles are standard (text-base)
      const featuredHeading = headings.find((h) =>
        h.textContent?.includes("Jeugdtoernooi"),
      );
      expect(featuredHeading).toHaveClass("text-2xl");
      // First article is now standard
      const firstArticleHeading = headings.find((h) =>
        h.textContent?.includes("First News Article"),
      );
      expect(firstArticleHeading).toHaveClass("text-base");
    });
  });

  describe("Empty state", () => {
    it("returns null when no articles and no featuredEvent", () => {
      const { container } = render(<LatestNews articles={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders when only featuredEvent provided (no articles)", () => {
      const featuredEvent = {
        title: "Evenement zonder artikelen",
        href: "/evenementen/test",
        badge: "Evenement",
      };
      render(<LatestNews articles={[]} featuredEvent={featuredEvent} />);
      expect(screen.getByText("Evenement zonder artikelen")).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run to verify failures**

```bash
cd apps/web && pnpm vitest run src/components/home/LatestNews/LatestNews.test.tsx
```

Expected: multiple failures (grid classes, heading variants, badge rendering).

---

### Task 5: Update `LatestNews` component

**Files:**

- Modify: `apps/web/src/components/home/LatestNews/LatestNews.tsx`

**Step 1: Replace the component**

```tsx
// apps/web/src/components/home/LatestNews/LatestNews.tsx
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { NewsCard } from "./NewsCard";

export interface LatestNewsArticle {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  tags?: Array<{ name: string }>;
}

/** Stub for upcoming featured event — wired in #802 */
export interface FeaturedEventStub {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  date?: string;
}

export interface LatestNewsProps {
  /** 2–3 articles; first becomes featured when no featuredEvent */
  articles: LatestNewsArticle[];
  /** When provided, fills the featured slot instead of articles[0]. #802 */
  featuredEvent?: FeaturedEventStub;
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  className?: string;
}

export const LatestNews = ({
  articles,
  featuredEvent,
  title = "Laatste nieuws",
  showViewAll = true,
  viewAllHref = "/news",
  className,
}: LatestNewsProps) => {
  if (articles.length === 0 && !featuredEvent) {
    return null;
  }

  // When an event fills the featured slot, articles[0] and [1] are standard.
  // Otherwise articles[0] is featured, articles[1] and [2] are standard.
  const standardArticles = featuredEvent
    ? articles.slice(0, 2)
    : articles.slice(1, 3);

  return (
    <section className={cn("bg-gray-100 py-20", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section header */}
        <header className="flex items-end justify-between mb-10">
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-black uppercase tracking-tight leading-none pl-4 border-l-4 border-kcvv-green text-kcvv-black">
            {title}
          </h2>

          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-xs font-bold uppercase tracking-[0.1em] text-kcvv-green-dark inline-flex items-center gap-2 group"
            >
              Alle berichten
              <span
                className="inline-block transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          )}
        </header>

        {/* 1 featured + 2 standard grid */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          {/* Featured slot — event (if provided) or first article */}
          {featuredEvent ? (
            <NewsCard
              variant="featured"
              title={featuredEvent.title}
              href={featuredEvent.href}
              imageUrl={featuredEvent.imageUrl}
              imageAlt={featuredEvent.imageAlt}
              badge={featuredEvent.badge}
              date={featuredEvent.date}
            />
          ) : articles[0] ? (
            <NewsCard
              variant="featured"
              title={articles[0].title}
              href={articles[0].href}
              imageUrl={articles[0].imageUrl}
              imageAlt={articles[0].imageAlt}
              badge={articles[0].tags?.[0]?.name}
              date={articles[0].date}
            />
          ) : null}

          {/* Standard slots — right column */}
          {standardArticles.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {standardArticles.map((article) => (
                <NewsCard
                  key={article.href}
                  variant="standard"
                  title={article.title}
                  href={article.href}
                  imageUrl={article.imageUrl}
                  imageAlt={article.imageAlt}
                  badge={article.tags?.[0]?.name}
                  date={article.date}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
```

**Step 2: Run tests — expect pass**

```bash
cd apps/web && pnpm vitest run src/components/home/LatestNews/LatestNews.test.tsx
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/components/home/LatestNews/LatestNews.tsx \
        apps/web/src/components/home/LatestNews/LatestNews.test.tsx
git commit -m "feat(ui): LatestNews — 1+2 overlay grid with NewsCard (#813)"
```

---

### Task 6: Update `LatestNews` Storybook stories

**Files:**

- Modify: `apps/web/src/components/home/LatestNews/LatestNews.stories.tsx`

**Step 1: Replace the stories file**

```typescript
// apps/web/src/components/home/LatestNews/LatestNews.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LatestNews } from "./LatestNews";

const meta = {
  title: "Features/News/NewsGrid",
  component: LatestNews,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage news section: 1 featured card (col-span-2) + 2 standard cards. " +
          "Featured slot can hold an article or an upcoming event (#802). " +
          "Data selection logic lives in the homepage — see #818.",
      },
    },
  },
} satisfies Meta<typeof LatestNews>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockArticles = [
  {
    href: "/news/2025-05-05-kampioen",
    title: "Kampioen! 58 punten en titel in eerste provinciale",
    imageUrl: "https://picsum.photos/900/500?random=10",
    imageAlt: "Championship celebration",
    date: "5 mei 2025",
    tags: [{ name: "Clubnieuws" }],
  },
  {
    href: "/news/2026-03-14-spelersvoorstelling",
    title:
      "Spelersvoorstelling seizoen 2025-2026: versterkingen voor nationaal debuut",
    imageUrl: "https://picsum.photos/600/400?random=11",
    imageAlt: "New players",
    date: "14 maart 2026",
    tags: [{ name: "Selectie" }],
  },
  {
    href: "/news/2026-03-10-jeugdtoernooi",
    title: "Jeugdtoernooi 2026: inschrijvingen open voor U9 t/m U15",
    imageUrl: "https://picsum.photos/600/400?random=12",
    imageAlt: "Youth tournament",
    date: "10 maart 2026",
    tags: [{ name: "Jeugd" }],
  },
];

/** Default: 3 articles, first is featured */
export const Default: Story = {
  args: {
    articles: mockArticles,
    title: "Nieuws",
    showViewAll: true,
    viewAllHref: "/news",
  },
};

/** Two articles: featured + 1 standard */
export const TwoArticles: Story = {
  args: {
    articles: mockArticles.slice(0, 2),
    title: "Nieuws",
    showViewAll: true,
  },
};

/** One article: only featured slot rendered */
export const SingleArticle: Story = {
  args: {
    articles: mockArticles.slice(0, 1),
    title: "Nieuws",
    showViewAll: true,
  },
};

/** Featured event fills the wide slot; articles fill the 2 standard slots.
 *  This is the #802 hook — FeaturedEventStub is typed but not yet wired. */
export const WithFeaturedEventStub: Story = {
  args: {
    articles: mockArticles.slice(0, 2),
    featuredEvent: {
      title: "Jeugdtoernooi 2026 — schrijf je nu in!",
      href: "/evenementen/jeugdtoernooi-2026",
      imageUrl: "https://picsum.photos/900/500?random=20",
      imageAlt: "Youth tournament 2026",
      badge: "Evenement",
      date: "18 april 2026",
    },
    title: "Nieuws & evenementen",
    showViewAll: true,
  },
};

/** Cards without cover images — fallback background */
export const WithoutImages: Story = {
  args: {
    articles: mockArticles.map((a) => ({ ...a, imageUrl: undefined })),
    title: "Nieuws",
    showViewAll: true,
  },
};

/** No "Alle berichten" link */
export const WithoutViewAll: Story = {
  args: {
    articles: mockArticles,
    title: "Nieuws",
    showViewAll: false,
  },
};

/** Mobile viewport */
export const MobileView: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: "mobile1" } },
};
```

**Step 2: Verify Storybook builds**

```bash
cd apps/web && pnpm storybook build --quiet 2>&1 | tail -5
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/components/home/LatestNews/LatestNews.stories.tsx
git commit -m "feat(ui): NewsGrid Storybook stories — Features/News/NewsGrid (#813)"
```

---

### Task 7: Export `NewsCard` from home barrel

**Files:**

- Modify: `apps/web/src/components/home/index.ts`

**Step 1: Add export**

In `apps/web/src/components/home/index.ts`, add after the `LatestNews` exports:

```typescript
export { NewsCard } from "./LatestNews/NewsCard";
export type { NewsCardProps } from "./LatestNews/NewsCard";
export type { FeaturedEventStub } from "./LatestNews";
```

The file should look like:

```typescript
export { FeaturedArticles } from "./FeaturedArticles";
export type {
  FeaturedArticlesProps,
  FeaturedArticle,
} from "./FeaturedArticles";

export { LatestNews } from "./LatestNews";
export type {
  LatestNewsProps,
  LatestNewsArticle,
  FeaturedEventStub,
} from "./LatestNews";

export { NewsCard } from "./LatestNews/NewsCard";
export type { NewsCardProps } from "./LatestNews/NewsCard";

export { UpcomingMatches } from "./UpcomingMatches";
export type { UpcomingMatchesProps, UpcomingMatch } from "./UpcomingMatches";

export { MatchWidget } from "./MatchWidget";
export type { MatchWidgetProps } from "./MatchWidget";
```

**Step 2: Run full type-check**

```bash
pnpm --filter @kcvv/web type-check
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/components/home/index.ts
git commit -m "feat(ui): export NewsCard and FeaturedEventStub from home barrel (#813)"
```

---

### Task 8: Full checks + push

**Step 1: Run all web tests**

```bash
pnpm --filter @kcvv/web test run
```

Expected: all pass, no regressions.

**Step 2: Run lint + type-check**

```bash
pnpm --filter @kcvv/web check-all
```

Expected: no errors.

**Step 3: Push branch**

```bash
git push -u origin feat/news-cards-image-overlay
```

**Step 4: Comment on #813**

```bash
gh issue comment 813 --body "Implementation complete on \`feat/news-cards-image-overlay\`.

- \`NewsCard\` — full-bleed overlay card, standard + featured variants, reusable
- \`LatestNews\` — updated to 1 featured + 2 standard grid, \`featuredEvent\` stub for #802
- Storybook: \`Features/News/NewsCard\` + \`Features/News/NewsGrid\`
- All tests pass, lint clean

Ready for review."
```
