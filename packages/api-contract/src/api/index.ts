import { HttpApi } from "@effect/platform";
import { MatchesApi } from "./matches";
import { OpponentApi } from "./opponent";
import { RankingApi } from "./ranking";
import { RelatedApi } from "./related";
import { SearchApi } from "./search";

export { MatchesApi, OpponentApi, RankingApi, RelatedApi, SearchApi };

/** Root API definition — implemented by apps/api (Cloudflare Worker), consumed by apps/web */
export class PsdApi extends HttpApi.make("psd")
  .add(MatchesApi)
  .add(OpponentApi)
  .add(RankingApi)
  .add(RelatedApi)
  .add(SearchApi) {}
