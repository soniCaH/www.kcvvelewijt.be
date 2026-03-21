import { Data } from "effect";

export class UpstreamUnavailableError extends Data.TaggedError(
  "UpstreamUnavailable",
)<{
  readonly message: string;
  readonly status?: number;
  readonly cause?: unknown;
}> {}

export class UpstreamClientError extends Data.TaggedError("UpstreamClient")<{
  readonly message: string;
  readonly status: number;
  readonly url: string;
}> {}

export class UpstreamDecodeError extends Data.TaggedError("UpstreamDecode")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ResourceNotFoundError extends Data.TaggedError(
  "ResourceNotFound",
)<{
  readonly message: string;
  readonly resourceType: string;
  readonly resourceId: string | number;
}> {}

export type BffError =
  | UpstreamUnavailableError
  | UpstreamClientError
  | UpstreamDecodeError
  | ResourceNotFoundError;

/** Stale-serve predicate for TypedKvCache: serve stale on transient errors only */
export const shouldServeStale = (error: BffError): boolean =>
  error._tag === "UpstreamUnavailable";
