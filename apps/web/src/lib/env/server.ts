import { Either, ParseResult, Schema as S } from "effect";

/**
 * The only place the server reads `process.env` (#3879); ESLint bans it in the
 * rest of `src`. Never import this from a `'use client'` file. Importing it
 * decodes nothing, so `next build`, Storybook, VR and Vitest load modules that
 * use it without the server secrets; a read decodes, and the caller decides
 * what a missing var means (`BffService` throws, the proxies answer 503). The
 * one read at load is `lib/sanity/client.ts`, which builds its client at module
 * scope and needs the project id to do so (`@sanity/client` threw there too).
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

const decodeBffEnv = S.decodeUnknownEither(BffEnv);
const bffSlot: {
  url?: string;
  secret?: string;
  result?: ReturnType<typeof decodeBffEnv>;
} = {};

/**
 * The BFF's URL and shared secret (#3485): both required, or a `Left`. Decodes
 * once per distinct pair of values, so a repeat read is two string compares and
 * a test that stubs a var gets a fresh decode without a reset hook.
 */
export const readBffEnv = () => {
  const url = process.env.KCVV_API_URL;
  const secret = process.env.BFF_SHARED_SECRET;
  if (
    bffSlot.result === undefined ||
    bffSlot.url !== url ||
    bffSlot.secret !== secret
  ) {
    bffSlot.url = url;
    bffSlot.secret = secret;
    bffSlot.result = decodeBffEnv({
      KCVV_API_URL: url,
      BFF_SHARED_SECRET: secret,
    });
  }
  return bffSlot.result;
};

const decodeOptionalEnv = S.decodeUnknownSync(OptionalEnv);

/** The optional server vars: GA4, search debug, the read token, the build phase. */
export const readOptionalServerEnv = () => decodeOptionalEnv(process.env);

const decodeSanityEnv = S.decodeUnknownEither(SanityEnv);

/**
 * The Sanity project id (required) and dataset. Next inlines a `NEXT_PUBLIC_*`
 * var only when it is written out literally, so both are literal reads here
 * (#3879), never a lookup by key.
 */
const readSanityEnv = () =>
  decodeSanityEnv({
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  });

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
