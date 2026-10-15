import { HttpApi } from "@effect/platform";
import { MatchesApi } from "./matches";
import { OpponentApi } from "./opponent";
import { RankingApi } from "./ranking";
import { RelatedApi } from "./related";
import { SearchApi } from "./search";
import { FormsApi } from "./forms";

/**
 * Request header that carries the BFF shared secret (`BFF_SHARED_SECRET`)
 * from the website's Next server to the worker. The worker refuses every
 * request without it except the Sanity webhook (#3485).
 */
export const BFF_KEY_HEADER = "x-kcvv-bff-key";

export { MatchesApi, OpponentApi, RankingApi, RelatedApi, SearchApi, FormsApi };

/** Root API definition — implemented by apps/api (Cloudflare Worker), consumed by apps/web */
export class PsdApi extends HttpApi.make("psd")
  .add(MatchesApi)
  .add(OpponentApi)
  .add(RankingApi)
  .add(RelatedApi)
  .add(SearchApi)
  .add(FormsApi) {}
