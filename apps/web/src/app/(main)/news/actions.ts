"use server";

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  SanityService,
  type SanityArticle,
} from "@/lib/effect/services/SanityService";
import { paginateResults, type PaginatedArticles } from "./utils";

export async function fetchArticlesAction(params: {
  offset: number;
  limit: number;
  category?: string;
}): Promise<PaginatedArticles> {
  const { offset, limit, category } = params;

  const articles = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getArticlesPaginated({
        offset,
        limit: limit + 1,
        category,
      });
    }).pipe(Effect.catchAll(() => Effect.succeed([] as SanityArticle[]))),
  );

  return paginateResults(articles, limit);
}
