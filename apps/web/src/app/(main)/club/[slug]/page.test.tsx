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

  it("renders PageHero with gradient when heroImage is not set", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(makePage()));

    const page = await DynamicClubPage({
      params: Promise.resolve({ slug: "downloads" }),
    });
    const { container } = render(page);

    // PageHero renders the title and label even without image
    expect(screen.getByText("Downloads")).toBeInTheDocument();
    expect(screen.getByText("Club")).toBeInTheDocument();
    // Should use gradient fallback (no img element)
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-testid='hero-gradient']"),
    ).toBeInTheDocument();
  });

  it("renders PageHero when heroImage is set", async () => {
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

    // PageHero renders the label
    expect(screen.getByText("Club")).toBeInTheDocument();
    expect(screen.getByText("Downloads")).toBeInTheDocument();
  });
});
