import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { SearchRequest, SearchResponse } from "../schemas/search";
import { HttpServiceUnavailable } from "../schemas/http-errors";

export class SearchApi extends HttpApiGroup.make("search").add(
  HttpApiEndpoint.post("search", "/search")
    .setPayload(SearchRequest)
    .addSuccess(SearchResponse)
    .addError(HttpServiceUnavailable),
) {}
