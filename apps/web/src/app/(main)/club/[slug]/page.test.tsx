import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";
import {
  PageRepository,
  type PageVM,
} from "@/lib/repositories/page.repository";

// Mock runtime to provide the PageRepository layer
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: <A,>(effect: Effect.Effect<A, never, PageRepository>) =>
    Effect.runPromise(Effect.provide(effect, testLayer)),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const mockFindBySlug = vi.fn<(slug: string) => Effect.Effect<PageVM | null>>();
const testLayer = Layer.succeed(PageRepository, {
  findBySlug: (slug) => mockFindBySlug(slug),
});

// Dynamic import after mocks are set up
const { default: DynamicClubPage } = await import("./page");

function makePage(overrides: Partial<PageVM> = {}): PageVM {
  return {
    id: "page-1",
    title: "Downloads",
    slug: "downloads",
    heroImageUrl: null,
    metaDescription: null,
    ogImageUrl: null,
    body: [
      {
        _type: "block" as const,
        _key: "k1",
        children: [
          {
            _type: "span" as const,
            _key: "s1",
            text: "Page content",
            marks: [] as string[],
          },
        ],
        style: "normal" as const,
        markDefs: [],
        fileUrl: null,
        fileSize: null,
        fileMimeType: null,
        fileOriginalFilename: null,
        asset: null,
      },
    ],
    ...overrides,
  };
}

describe("/club/[slug] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the PageHero (typographic state) when heroImage is not set", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(makePage()));

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "downloads" }),
    });
    const { container } = render(page);

    // PageHero renders the title and kicker even without an image
    expect(screen.getByText("Downloads")).toBeInTheDocument();
    expect(screen.getByText("Club")).toBeInTheDocument();
    // No hero image → typographic state (no img element)
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-hero")).toHaveAttribute(
      "data-state",
      "typographic",
    );
  });

  it("renders the PageHero with an image when heroImage is set", async () => {
    mockFindBySlug.mockReturnValue(
      Effect.succeed(
        makePage({
          heroImageUrl:
            "https://cdn.sanity.io/images/proj/dataset/abc.jpg?w=1600&q=80&fm=webp&fit=max",
        }),
      ),
    );

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "downloads" }),
    });
    render(page);

    // PageHero renders the kicker, title, and the image (split state)
    expect(screen.getByText("Club")).toBeInTheDocument();
    expect(screen.getByText("Downloads")).toBeInTheDocument();
    expect(screen.getByTestId("page-hero")).toHaveAttribute(
      "data-state",
      "image",
    );
  });

  it("renders the body through <ArticleBody>", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(makePage()));

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "downloads" }),
    });
    const { container } = render(page);

    // The Phase-5 body column renders the page body (first paragraph as the
    // drop-cap), so the body text is on the page.
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(
      container.querySelector('[data-article-body="true"]'),
    ).toBeInTheDocument();
  });

  it("renders an articleImage body block as a captioned figure", async () => {
    mockFindBySlug.mockReturnValue(
      Effect.succeed(
        makePage({
          body: [
            {
              _key: "img-1",
              _type: "articleImage" as const,
              width: "prose" as const,
              alt: "Sportpark Elewijt",
              fileUrl: null,
              fileSize: null,
              fileMimeType: null,
              fileOriginalFilename: null,
              asset: {
                url: "https://cdn.sanity.io/images/proj/dataset/ground.jpg?w=800&q=80&fm=webp&fit=max",
                title: null,
                description: "De ingang van Sportpark Elewijt",
                creditLine: null,
                metadata: { dimensions: null, lqip: null },
              },
            },
          ],
        }),
      ),
    );

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "praktische-info" }),
    });
    const { container } = render(page);

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "Sportpark Elewijt");
    // Caption pulled from `asset.description` by the <ArticleBody> renderer.
    expect(
      screen.getByText("De ingang van Sportpark Elewijt"),
    ).toBeInTheDocument();
  });

  it("adds a 'Schrijf je in' CTA to /club/word-lid on the inschrijven (Praktische Informatie) page", async () => {
    mockFindBySlug.mockReturnValue(
      Effect.succeed(
        makePage({ slug: "inschrijven", title: "Praktische Informatie" }),
      ),
    );

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "inschrijven" }),
    });
    render(page);

    expect(
      screen.getByRole("link", { name: /schrijf je in/i }),
    ).toHaveAttribute("href", "/club/word-lid");
  });

  it("does not add the membership CTA on other club pages", async () => {
    mockFindBySlug.mockReturnValue(
      Effect.succeed(makePage({ slug: "downloads" })),
    );

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "downloads" }),
    });
    render(page);

    expect(
      screen.queryByRole("link", { name: /schrijf je in/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render SanityArticleBody / InteriorPageHero artefacts", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(makePage()));

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "downloads" }),
    });
    const { container } = render(page);

    // The legacy renderer wrapped the body in `.prose`; the new ArticleBody
    // ships a `data-article-body` cream shell instead.
    expect(container.querySelector(".prose")).not.toBeInTheDocument();
  });
});
