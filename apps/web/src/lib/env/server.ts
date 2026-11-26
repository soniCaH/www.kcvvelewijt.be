import { Either, ParseResult, Schema as S } from "effect";

/**
 * The only place the server reads `process.env` (#3879); ESLint bans it in the
 * rest of `src`. Never import this from a `'use client'` file. Nothing decodes
 * at import: `next build`, Storybook, VR and Vitest import modules that use
 * this without the server secrets, and a caller decides what a missing one
 * means for it (`BffService` throws, the proxies answer 503).
 */

/** A string that is present and not blank; the decoded value is trimmed. */
const Required = S.Trim.pipe(S.nonEmptyString());

const BffEnv = S.Struct({
  KCVV_API_URL: Required,
  BFF_SHARED_SECRET: Required,
});

const SanityEnv = S.Struct({
  NEXT_PUBLIC_SANITY_PROJECT_ID: Required,
  NEXT_PUBLIC_SANITY_DATASET: S.optional(S.String),
});

/** Never fails to decode: every field is optional and a blank stays a blank. */
const OptionalEnv = S.Struct({
  SANITY_API_READ_TOKEN: S.optional(S.String),
  SANITY_REVALIDATE_SECRET: S.optional(S.String),
  GA4_MEASUREMENT_ID: S.optional(S.String),
  GA4_API_SECRET: S.optional(S.String),
  DEBUG_SEARCH: S.optional(S.String),
  VERCEL_ENV: S.optional(S.String),
  NEXT_PHASE: S.optional(S.String),
});

/**
 * Decodes once per distinct set of values: a repeat read with the same env
 * hands back the same result, and a changed env (a test stubbing a var)
 * decodes again, so no reset hook is needed.
 */
const memoByEnv = <R>(
  keys: readonly string[],
  decode: (input: unknown) => R,
): (() => R) => {
  const slot: { key?: string; result?: R } = {};
  return () => {
    const input = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    const key = JSON.stringify(input);
    if (slot.key !== key || slot.result === undefined) {
      slot.key = key;
      slot.result = decode(input);
    }
    return slot.result;
  };
};

/** The BFF's URL and shared secret (#3485): both required, or a `Left`. */
export const readBffEnv = memoByEnv(
  Object.keys(BffEnv.fields),
  S.decodeUnknownEither(BffEnv),
);

/** The optional server vars: GA4, search debug, the read token, the build phase. */
export const readOptionalServerEnv = memoByEnv(
  Object.keys(OptionalEnv.fields),
  S.decodeUnknownSync(OptionalEnv),
);

/** The Sanity project id (required) and dataset (#3879), or a `Left`. */
export const readSanityEnv = memoByEnv(
  Object.keys(SanityEnv.fields),
  S.decodeUnknownEither(SanityEnv),
);

/** The decoded group, or a throw that names the first missing or blank var. */
const orThrow = <A>(result: Either.Either<A, ParseResult.ParseError>): A =>
  Either.getOrThrowWith(result, (error) => {
    const name = ParseResult.ArrayFormatter.formatErrorSync(error)[0]?.path[0];
    return new Error(
      `${String(name)} is not set — add it to .env.local before starting the app`,
    );
  });

export const readBffEnvOrThrow = () => orThrow(readBffEnv());

export const readSanityEnvOrThrow = () => orThrow(readSanityEnv());
