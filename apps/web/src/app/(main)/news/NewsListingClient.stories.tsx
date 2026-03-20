/**
 * NewsListingClient Story
 * The redesigned /news page with featured split (2fr|1fr), 3-column grid,
 * sticky category filter bar, and infinite scroll.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { NewsListingClient } from "./NewsListingClient";
import type { SanityArticle } from "@/lib/effect/services/SanityService";

function makeMockArticle(
  id: number,
  overrides?: Partial<SanityArticle>,
): SanityArticle {
  return {
    _id: `article-${id}`,
    title: `Artikeltitel nummer ${id}`,
    slug: { current: `artikel-${id}` },
    publishAt: `2025-01-${String(20 - id).padStart(2, "0")}T12:00:00Z`,
    featured: id <= 3,
    tags: ["Clubnieuws"],
    coverImageUrl: `https://picsum.photos/seed/article${id}/800/500`,
    body: null,
    ...overrides,
  };
}

const mockCategories = [
  {
    id: "wedstrijdverslagen",
    attributes: { name: "Wedstrijdverslagen", slug: "wedstrijdverslagen" },
  },
  { id: "clubnieuws", attributes: { name: "Clubnieuws", slug: "clubnieuws" } },
  {
    id: "evenementen",
    attributes: { name: "Evenementen", slug: "evenementen" },
  },
  { id: "jeugd", attributes: { name: "Jeugd", slug: "jeugd" } },
  { id: "senioren", attributes: { name: "Senioren", slug: "senioren" } },
  { id: "transfers", attributes: { name: "Transfers", slug: "transfers" } },
];

const featuredArticles: SanityArticle[] = [
  makeMockArticle(1, {
    title: "KCVV Elewijt wint belangrijke derby tegen rivaal",
    tags: ["Wedstrijdverslagen"],
  }),
  makeMockArticle(2, {
    title: "Nieuwe spelers versterken de selectie",
    tags: ["Transfers"],
  }),
  makeMockArticle(3, {
    title: "Jeugdwerking start zomerkamp 2025",
    tags: ["Jeugd"],
  }),
];

const gridArticles: SanityArticle[] = Array.from({ length: 6 }, (_, i) =>
  makeMockArticle(i + 4, {
    tags: [
      mockCategories[i % mockCategories.length]?.attributes.name ??
        "Clubnieuws",
    ],
  }),
);

const extraBatch: SanityArticle[] = Array.from({ length: 6 }, (_, i) =>
  makeMockArticle(i + 10),
);

const noopFetch = fn()
  .mockName("fetchArticles")
  .mockResolvedValue({ articles: [], hasMore: false });

const meta = {
  title: "Pages/NewsListing",
  component: NewsListingClient,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Redesigned news listing page with featured 2fr|1fr split at top, 3-column grid with infinite scroll, and sticky category filter bar.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    fetchArticles: noopFetch,
  },
} satisfies Meta<typeof NewsListingClient>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full page with featured split + grid articles */
export const Default: Story = {
  args: {
    featuredArticles,
    initialArticles: gridArticles,
    categories: mockCategories,
    hasMore: true,
    fetchArticles: fn()
      .mockName("fetchArticles")
      .mockResolvedValue({ articles: extraBatch, hasMore: false }),
  },
};

/** With a category pre-selected */
export const WithActiveCategory: Story = {
  args: {
    featuredArticles,
    initialArticles: gridArticles.filter((a) =>
      a.tags.includes("Wedstrijdverslagen"),
    ),
    categories: mockCategories,
    hasMore: false,
    initialCategory: "wedstrijdverslagen",
  },
};

/** Empty state when no articles match */
export const EmptyState: Story = {
  args: {
    featuredArticles: [],
    initialArticles: [],
    categories: mockCategories,
    hasMore: false,
    initialCategory: "transfers",
  },
};

/** Only featured articles, no grid */
export const FeaturedOnly: Story = {
  args: {
    featuredArticles,
    initialArticles: [],
    categories: mockCategories,
    hasMore: false,
  },
};

/** Mobile viewport */
export const Mobile: Story = {
  args: {
    featuredArticles,
    initialArticles: gridArticles,
    categories: mockCategories,
    hasMore: true,
    fetchArticles: fn()
      .mockName("fetchArticles")
      .mockResolvedValue({ articles: extraBatch, hasMore: false }),
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
