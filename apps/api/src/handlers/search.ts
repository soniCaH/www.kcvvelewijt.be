import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, HttpServiceUnavailable } from "@kcvv/api-contract";
import { handleSearch } from "../search/search-handler";

export const SearchApiLive = HttpApiBuilder.group(
  PsdApi,
  "search",
  (handlers) =>
    handlers.handle("search", ({ payload }) =>
      handleSearch(payload).pipe(
        Effect.mapError(
          (error) =>
            new HttpServiceUnavailable({
              error: `Search service unavailable: ${error.message}`,
            }),
        ),
      ),
    ),
);
