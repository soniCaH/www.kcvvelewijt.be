import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, HttpServiceUnavailable } from "@kcvv/api-contract";

export const RelatedApiLive = HttpApiBuilder.group(
  PsdApi,
  "related",
  (handlers) =>
    handlers.handle("getRelated", () =>
      Effect.fail(
        new HttpServiceUnavailable({
          error: "Related content endpoint not yet implemented (see #928)",
        }),
      ),
    ),
);
