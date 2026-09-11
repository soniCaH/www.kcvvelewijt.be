/**
 * A failed articles read must degrade to an empty page, not throw (#2863).
 *
 * `ArticleRepository.findPaginated` is a Sanity read — every Sanity read ends
 * in `Effect.orDie` (`lib/sanity/fetch-groq.ts`), so the effect is typed
 * `Effect<A>` with `E = never` and its failures arrive as *defects*. An
 * `Effect.catchAll` on it type-checks but never runs; only a cause-aware
 * guard (`degradeSection`) can see the failure. `fetchArticlesAction` is a
 * server action called directly from `NewsListingClient`'s client-side
 * "load more" flow with no surrounding `.catch()` — a dead guard here leaves
 * that click unhandled.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

import { fetchArticlesAction } from "./actions";

describe("fetchArticlesAction degrades on a failed read (#2863)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves to an empty page instead of rejecting when the articles read fails", async () => {
    await expect(
      fetchArticlesAction({ offset: 0, limit: 12 }),
    ).resolves.toEqual({ items: [], hasMore: false });
  });
});
