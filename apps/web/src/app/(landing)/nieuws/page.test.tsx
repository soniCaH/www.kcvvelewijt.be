/**
 * A failed tag-list read must degrade to an empty page, not throw (#2863).
 *
 * `ArticleRepository.findTags` is a Sanity read — every Sanity read ends in
 * `Effect.orDie` (`lib/sanity/fetch-groq.ts`), so the effect is typed
 * `Effect<A>` with `E = never` and its failures arrive as *defects*. An
 * `Effect.catchAll` on it type-checks but never runs; only a cause-aware
 * guard (`degradeSection`) can see the failure. The tag list is a filter
 * facet, not the page's subject (the article grid is), so a failed read must
 * keep the page up with an empty category list rather than take it down.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/repositories/article.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/article.repository")
    >();
  const { Effect, Layer } = await import("effect");
  return {
    ...mod,
    ArticleRepositoryLive: Layer.succeed(mod.ArticleRepository, {
      findAll: () => Effect.die(new Error("Sanity is unreachable")),
      findBySlug: () => Effect.die(new Error("Sanity is unreachable")),
      findPaginated: () => Effect.die(new Error("Sanity is unreachable")),
      findTags: () => Effect.die(new Error("Sanity is unreachable")),
      findRelated: () => Effect.die(new Error("Sanity is unreachable")),
      findByLinkedMatch: () => Effect.die(new Error("Sanity is unreachable")),
    }),
  };
});

// The article grid's own read goes through `fetchArticlesAction` (a separate
// #2863 site, fixed independently) — mocked out here so this suite's subject
// stays the tag-list read.
vi.mock("./actions", () => ({
  fetchArticlesAction: vi.fn(() =>
    Promise.resolve({ items: [], hasMore: false }),
  ),
}));

import NewsPage from "./page";

describe("/nieuws degrades on a failed tag-list read (#2863)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the page up with no category filters when the tags read fails", async () => {
    const element = await NewsPage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(screen.getByText("Nieuwsarchief")).toBeInTheDocument();
  });
});
