/**
 * A failed articles read must reject, not silently degrade (#2863 review
 * round 2, finding 1).
 *
 * `NewsListingClient` is this action's only caller — its "load more" footer
 * and its category-chip switch, both in `NewsListingClient.tsx` — and both
 * call sites already `try/catch` a rejection into a real "Artikelen laden
 * mislukt." notice with a working retry. A `degradeSection`-style guard here
 * would resolve to an empty success instead of rejecting, making both
 * catches unreachable: the load-more footer would read "no more articles"
 * and a category switch would read "empty category" on what is actually a
 * Sanity blip — and the category switch would still write the now-wrong
 * category into the URL/history, because that write is gated on the fetch
 * resolving, not on the fetch being *correct*. So unlike the other four
 * #2863 sites, this read is deliberately left bare.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

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

describe("fetchArticlesAction leaves a failed read live for its caller (#2863)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects instead of resolving to an empty page when the articles read fails", async () => {
    await expect(
      fetchArticlesAction({ offset: 0, limit: 12 }),
    ).rejects.toThrow();
  });
});
