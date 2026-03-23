import { HttpApi } from "@effect/platform";
import { MatchesApi } from "./matches";
import { RankingApi } from "./ranking";
import { RelatedApi } from "./related";
import { StatsApi } from "./stats";
import { SearchApi } from "./search";

export { MatchesApi, RankingApi, RelatedApi, StatsApi, SearchApi };

/** Root API definition — implemented by apps/api (Cloudflare Worker), consumed by apps/web */
export class PsdApi extends HttpApi.make("psd")
  .add(MatchesApi)
  .add(RankingApi)
  .add(RelatedApi)
  .add(StatsApi)
  .add(SearchApi) {}
