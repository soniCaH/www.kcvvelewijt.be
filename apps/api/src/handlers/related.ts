import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi } from "@kcvv/api-contract";
import { handleRelated } from "../search/related-handler";

const DEFAULT_LIMIT = 3;

export const RelatedApiLive = HttpApiBuilder.group(
  PsdApi,
  "related",
  (handlers) =>
    handlers.handle("getRelated", ({ urlParams }) =>
      handleRelated({
        id: urlParams.id,
        limit: urlParams.limit ?? DEFAULT_LIMIT,
      }).pipe(Effect.orDie),
    ),
);
