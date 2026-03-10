import { HttpApi } from "@effect/platform";
import { MatchesApi } from "./matches";
import { RankingApi } from "./ranking";
import { StatsApi } from "./stats";
import { SearchApi } from "./search";

export { MatchesApi, RankingApi, StatsApi, SearchApi };

/** Root API definition — implemented by apps/api (Cloudflare Worker), consumed by apps/web */
export class PsdApi extends HttpApi.make("psd")
  .add(MatchesApi)
  .add(RankingApi)
  .add(StatsApi)
  .add(SearchApi) {}
