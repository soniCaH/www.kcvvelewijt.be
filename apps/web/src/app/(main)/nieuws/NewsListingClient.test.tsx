import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { NewsListingClient } from "./NewsListingClient";
import type { ArticleVM } from "@/lib/repositories/article.repository";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const mockFetchArticles = vi.fn();

function makeArticle(overrides: Partial<ArticleVM> = {}): ArticleVM {
  const id = overrides.id ?? `article-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: overrides.title ?? "Test Article",
    slug: overrides.title?.toLowerCase().replace(/\s/g, "-") ?? "test",
    publishedAt: "2026-03-15T10:00:00Z",
    featured: false,
    coverImageUrl: null,
    tags: overrides.tags ?? [],
    ...overrides,
  };
}

const categories = [
  {
    id: "Eerste ploeg",
    attributes: { name: "Eerste ploeg", slug: "Eerste ploeg" },
  },
  { id: "Jeugd", attributes: { name: "Jeugd", slug: "Jeugd" } },
];

describe("NewsListingClient", () => {
  let intersectionCallback:
    | ((entries: Array<{ isIntersecting: boolean }>) => void)
    | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    intersectionCallback = null;
    // Mock IntersectionObserver with a class
    class MockIntersectionObserver {
      constructor(
        callback: (entries: Array<{ isIntersecting: boolean }>) => void,
      ) {
        intersectionCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  it("renders featured articles in the top section", () => {
    const featuredArticles = [
      makeArticle({ id: "f1", title: "Featured One" }),
      makeArticle({ id: "f2", title: "Featured Two" }),
      makeArticle({ id: "f3", title: "Featured Three" }),
    ];
    const gridArticles = [makeArticle({ id: "g1", title: "Grid One" })];

    render(
      <NewsListingClient
        featuredArticles={featuredArticles}
        initialArticles={gridArticles}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    expect(screen.getByText("Featured One")).toBeInTheDocument();
    expect(screen.getByText("Featured Two")).toBeInTheDocument();
    expect(screen.getByText("Featured Three")).toBeInTheDocument();
    expect(screen.getByText("Grid One")).toBeInTheDocument();
  });

  it("renders category filter tabs as buttons", () => {
    render(
      <NewsListingClient
        featuredArticles={[makeArticle()]}
        initialArticles={[]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    expect(screen.getByRole("tab", { name: "Alles" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Eerste ploeg" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Jeugd" })).toBeInTheDocument();
  });

  it("shows empty state when no articles match category", async () => {
    mockFetchArticles.mockResolvedValue({ articles: [], hasMore: false });

    render(
      <NewsListingClient
        featuredArticles={[]}
        initialArticles={[]}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    // Click a category tab
    fireEvent.click(screen.getByRole("tab", { name: "Jeugd" }));

    await waitFor(() => {
      expect(screen.getByText(/geen artikelen/i)).toBeInTheDocument();
    });
  });

  it("deduplicates articles returned by loadMore against featured and grid", async () => {
    const featured = [
      makeArticle({ id: "a1", title: "Article One" }),
      makeArticle({ id: "a2", title: "Article Two" }),
      makeArticle({ id: "a3", title: "Article Three" }),
    ];
    const grid = [
      makeArticle({ id: "a4", title: "Article Four" }),
      makeArticle({ id: "a5", title: "Article Five" }),
      makeArticle({ id: "a6", title: "Article Six" }),
    ];

    // loadMore returns a mix of duplicates (a3, a6) and new articles (a7, a8)
    mockFetchArticles.mockResolvedValue({
      articles: [
        makeArticle({ id: "a3", title: "Article Three" }),
        makeArticle({ id: "a6", title: "Article Six" }),
        makeArticle({ id: "a7", title: "Article Seven" }),
        makeArticle({ id: "a8", title: "Article Eight" }),
      ],
      hasMore: false,
    });

    render(
      <NewsListingClient
        featuredArticles={featured}
        initialArticles={grid}
        categories={categories}
        hasMore={true}
        fetchArticles={mockFetchArticles}
      />,
    );

    // Trigger the IntersectionObserver
    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: true }]);
    }

    // New articles should appear, duplicates should not create extra DOM nodes
    await waitFor(() => {
      expect(screen.getByText("Article Seven")).toBeInTheDocument();
      expect(screen.getByText("Article Eight")).toBeInTheDocument();
    });

    // Verify no duplicate IDs in the rendered output
    const allArticleTitles = [
      "Article One",
      "Article Two",
      "Article Three",
      "Article Four",
      "Article Five",
      "Article Six",
      "Article Seven",
      "Article Eight",
    ];
    for (const title of allArticleTitles) {
      const elements = screen.getAllByText(title);
      expect(elements).toHaveLength(1);
    }
  });

  it("deduplicates articles after category change", async () => {
    const featured = [
      makeArticle({ id: "a1", title: "First Article" }),
      makeArticle({ id: "a2", title: "Second Article" }),
      makeArticle({ id: "a3", title: "Third Article" }),
    ];
    const grid = [makeArticle({ id: "a4", title: "Fourth Article" })];

    // Duplicate "c1" appears within the first three items so the pre-split
    // dedup path (deduplicateById on the whole result before slicing into
    // featured/grid) is exercised.
    mockFetchArticles.mockResolvedValue({
      articles: [
        makeArticle({ id: "c1", title: "Cat One" }),
        makeArticle({ id: "c1", title: "Cat One" }), // duplicate within featured slice
        makeArticle({ id: "c2", title: "Cat Two" }),
        makeArticle({ id: "c3", title: "Cat Three" }),
        makeArticle({ id: "c4", title: "Cat Four" }),
      ],
      hasMore: false,
    });

    render(
      <NewsListingClient
        featuredArticles={featured}
        initialArticles={grid}
        categories={categories}
        hasMore={false}
        fetchArticles={mockFetchArticles}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Jeugd" }));

    await waitFor(() => {
      expect(screen.getByText("Cat Four")).toBeInTheDocument();
    });

    // Cat One should appear exactly once (featured), not also in the grid
    expect(screen.getAllByText("Cat One")).toHaveLength(1);
  });

  it("shows loading indicator while fetching", async () => {
    // Make fetchArticles hang
    let resolvePromise: (value: unknown) => void;
    mockFetchArticles.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(
      <NewsListingClient
        featuredArticles={[makeArticle()]}
        initialArticles={[makeArticle({ id: "g1" })]}
        categories={categories}
        hasMore={true}
        fetchArticles={mockFetchArticles}
      />,
    );

    // Trigger the IntersectionObserver callback
    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: true }]);
    }

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    // Resolve to prevent act warnings
    resolvePromise!({ articles: [], hasMore: false });
  });
});
