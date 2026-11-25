/**
 * `"use server"` exports are public POST endpoints that take any JSON, so
 * `fetchArticlesAction` decodes its argument before it reaches the read (#3875).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const findPaginated = vi.hoisted(() => vi.fn());

vi.mock("@/lib/repositories/article.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/article.repository")
    >();
  const { Effect, Layer } = await import("effect");
  return {
    ...mod,
    ArticleRepositoryLive: Layer.succeed(mod.ArticleRepository, {
      findForShare: () => Effect.die("not used by this suite"),
      findAll: () => Effect.die("not used by this suite"),
      findBySlug: () => Effect.die("not used by this suite"),
      findPaginated: (...args: unknown[]) => {
        findPaginated(...args);
        return Effect.succeed([]);
      },
      findTags: () => Effect.die("not used by this suite"),
      findRelated: () => Effect.die("not used by this suite"),
      findRelatedByPerson: () => Effect.die("not used by this suite"),
      findByLinkedMatch: () => Effect.die("not used by this suite"),
    }),
  };
});

import { fetchArticlesAction } from "./actions";

describe("fetchArticlesAction decodes its public input (#3875)", () => {
  beforeEach(() => {
    findPaginated.mockClear();
  });

  it.each([
    ["an object", {}],
    ["an array", ["a"]],
    ["a number", 1],
  ])("rejects a category that is %s, and never reads", async (_, category) => {
    await expect(
      fetchArticlesAction({
        offset: 0,
        limit: 12,
        category,
      } as unknown as Parameters<typeof fetchArticlesAction>[0]),
    ).rejects.toThrow();
    expect(findPaginated).not.toHaveBeenCalled();
  });

  it("passes a string category through to the read", async () => {
    await fetchArticlesAction({ offset: 0, limit: 12, category: "a" });
    expect(findPaginated).toHaveBeenCalledWith({
      offset: 0,
      limit: 13,
      category: "a",
    });
  });
});
