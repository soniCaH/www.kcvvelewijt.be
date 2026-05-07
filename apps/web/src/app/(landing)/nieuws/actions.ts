"use server";

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  ArticleRepository,
  type ArticleVM,
} from "@/lib/repositories/article.repository";
import { paginateResults, type PaginatedArticles } from "./utils";

export async function fetchArticlesAction(params: {
  offset: number;
  limit: number;
  category?: string;
}): Promise<PaginatedArticles> {
  const { offset, limit, category } = params;

  const articles = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findPaginated({
        offset,
        limit: limit + 1,
        category,
      });
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[fetchArticlesAction] Failed to fetch articles:", error);
        return Effect.succeed([] as ArticleVM[]);
      }),
    ),
  );

  return paginateResults(articles, limit);
}
