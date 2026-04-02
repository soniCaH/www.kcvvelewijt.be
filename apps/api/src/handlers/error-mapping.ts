import { Effect } from "effect";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
} from "@kcvv/api-contract";
import type { BffError } from "../psd/errors";

type HttpApiError = HttpServiceUnavailable | HttpBadGateway | HttpNotFound;

export function mapBffErrorToHttpError(error: BffError): HttpApiError {
  switch (error._tag) {
    case "UpstreamUnavailable":
      return new HttpServiceUnavailable({
        error: "Service temporarily unavailable",
      });
    case "UpstreamClient":
      return new HttpBadGateway({ error: "Bad gateway" });
    case "UpstreamDecode":
      return new HttpBadGateway({ error: "Bad gateway" });
    case "ResourceNotFound":
      return new HttpNotFound({ error: "Not found" });
  }
}

export const withErrorMapping = <A, R>(
  effect: Effect.Effect<A, BffError, R>,
): Effect.Effect<A, HttpApiError, R> =>
  effect.pipe(Effect.mapError(mapBffErrorToHttpError));
