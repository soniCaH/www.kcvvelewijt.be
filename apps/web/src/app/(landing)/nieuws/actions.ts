"use server";

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
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

  // `ArticleRepository.findPaginated` is a Sanity read (`E = never`, #2863's
  // original bug class), but this read is left bare on purpose rather than
  // wrapped in `degradeSection`: `NewsListingClient` is this action's only
  // caller (its "load more" footer and its category-chip switch, both in
  // `NewsListingClient.tsx`) and both call sites already `try/catch` a
  // rejection into a real "Artikelen laden mislukt." notice with a working
  // retry. Degrading here to an empty success would make both catches
  // unreachable — the load-more footer would read "no more articles" and a
  // category switch would read "empty category" on what is actually a
  // Sanity blip, and (category switch only) would still write the now-wrong
  // category into the URL/history because that write is gated on the fetch
  // resolving, not on the fetch being *correct* (#2863 review round 2,
  // finding 1). The page-level caller in `page.tsx` is unaffected: it wraps
  // this same call in its own `.catch()`, a real Promise-level handler, not
  // the dead-guard bug this ticket fixes elsewhere.
  const articles = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findPaginated({
        offset,
        limit: limit + 1,
        category: params.category,
      });
    }),
  );

  return paginateResults(articles, limit);
}
