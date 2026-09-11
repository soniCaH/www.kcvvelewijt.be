"use server";

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import {
  ArticleRepository,
  type ArticleVM,
} from "@/lib/repositories/article.repository";
import {
  clampListingWindow,
  paginateResults,
  type Paginated,
} from "@/lib/utils/pagination";

export async function fetchArticlesAction(params: {
  offset: number;
  limit: number;
  category?: string;
}): Promise<Paginated<ArticleVM>> {
  // `"use server"` makes this a public endpoint — clamp before GROQ.
  const { offset, limit } = clampListingWindow(params);

  // `ArticleRepository.findPaginated` is a Sanity read (`E = never`, #2863),
  // so the guard must be `degradeSection` — a plain `Effect.catchAll`
  // type-checks but never runs against it. `NewsListingClient`'s "load more"
  // flow calls this action directly, with no surrounding `.catch()`, so a
  // dead guard here would leave that click unhandled.
  const articles = await runPromise(
    degradeSection(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        return yield* repo.findPaginated({
          offset,
          limit: limit + 1,
          category: params.category,
        });
      }),
      [] as ArticleVM[],
      "[fetchArticlesAction] articles read failed; falling back to an empty page.",
    ),
  );

  return paginateResults(articles, limit);
}
