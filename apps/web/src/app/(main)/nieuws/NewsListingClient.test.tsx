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
