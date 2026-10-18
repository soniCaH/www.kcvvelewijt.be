import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  SearchRequest,
  SearchResponse,
  TeamGuessRequest,
  TeamGuessResponse,
} from "../schemas/search";
import {
  HttpServiceUnavailable,
  HttpTooManyRequests,
} from "../schemas/http-errors";

export class SearchApi extends HttpApiGroup.make("search")
  .add(
    HttpApiEndpoint.post("search", "/search")
      .setPayload(SearchRequest)
      .addSuccess(SearchResponse)
      .addError(HttpServiceUnavailable)
      .addError(HttpTooManyRequests),
  )
  // The team card's AI fallback (#3559): an AI failure or the daily cap is a
  // `null` age, never an error — only the shared rate limits refuse.
  .add(
    HttpApiEndpoint.post("teamGuess", "/search/team-guess")
      .setPayload(TeamGuessRequest)
      .addSuccess(TeamGuessResponse)
      .addError(HttpTooManyRequests),
  ) {}
