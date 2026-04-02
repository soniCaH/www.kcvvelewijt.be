/**
 * Effect Error Types
 * Tagged errors for type-safe error handling
 */

import { Schema as S } from "effect";

/**
 * Resource not found error
 */
export class NotFoundError extends S.TaggedError<NotFoundError>()(
  "NotFoundError",
  {
    resource: S.String,
    identifier: S.String,
    message: S.optional(S.String),
  },
) {}

/**
 * PSD API errors
 */
export class PsdApiError extends S.TaggedError<PsdApiError>()("PsdApiError", {
  message: S.String,
  status: S.optional(S.Number),
  cause: S.optional(S.Unknown),
}) {}

/**
 * Validation error (schema decode failure)
 */
export class ValidationError extends S.TaggedError<ValidationError>()(
  "ValidationError",
  {
    message: S.String,
    errors: S.optional(S.Unknown),
  },
) {}

/**
 * Network/HTTP errors
 */
export class NetworkError extends S.TaggedError<NetworkError>()(
  "NetworkError",
  {
    message: S.String,
    url: S.optional(S.String),
    cause: S.optional(S.Unknown),
  },
) {}

/**
 * Timeout error
 */
export class TimeoutError extends S.TaggedError<TimeoutError>()(
  "TimeoutError",
  {
    message: S.String,
    duration: S.optional(S.Number),
  },
) {}

/**
 * Union of all possible errors
 */
export type AppError =
  | NotFoundError
  | PsdApiError
  | ValidationError
  | NetworkError
  | TimeoutError;
