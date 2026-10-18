import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";
import {
  PageRepository,
  type PageVM,
} from "@/lib/repositories/page.repository";

vi.mock("@/lib/effect/runtime", () => ({
  runPromise: <A,>(effect: Effect.Effect<A, never, PageRepository>) =>
    Effect.runPromise(Effect.provide(effect, testLayer)),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  usePathname: () => "/club/cashless/voorwaarden",
}));

const mockFindBySlug = vi.fn<(slug: string) => Effect.Effect<PageVM | null>>();
const testLayer = Layer.succeed(PageRepository, {
  findAll: () => Effect.succeed([]),
  findBySlug: (slug) => mockFindBySlug(slug),
});

const { default: CashlessTermsPage, generateMetadata } = await import("./page");

const page: PageVM = {
  id: "page-cashless-voorwaarden",
  title: "Algemene voorwaarden: Cashless Clubkaart",
  slug: "cashless/voorwaarden",
  heroImageUrl: null,
  metaDescription: null,
  ogImageUrl: null,
  body: [],
};

describe("/club/cashless/voorwaarden page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the CMS page stored under the two-segment slug", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(page));

    render(await CashlessTermsPage());

    expect(mockFindBySlug).toHaveBeenCalledWith("cashless/voorwaarden");
    expect(
      screen.getByText("Algemene voorwaarden: Cashless Clubkaart"),
    ).toBeInTheDocument();
  });

  it("points the breadcrumb and canonical at the full path", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(page));

    const { container } = render(await CashlessTermsPage());
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script?.innerHTML).toContain("/club/cashless/voorwaarden");

    const meta = await generateMetadata();
    expect(meta.alternates?.canonical).toContain("/club/cashless/voorwaarden");
  });

  it("is a 404 until the CMS page exists", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(null));

    await expect(CashlessTermsPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
