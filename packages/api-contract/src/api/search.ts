import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { SearchRequest, SearchResponse } from "../schemas/search";

export class SearchApi extends HttpApiGroup.make("search").add(
  HttpApiEndpoint.post("search", "/search")
    .setPayload(SearchRequest)
    .addSuccess(SearchResponse),
) {}
