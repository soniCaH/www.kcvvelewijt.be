import { Data, Effect } from "effect";
import { sanityClient } from "./client";

/** Next.js Data Cache directives forwarded to `@sanity/client`'s 3rd arg. */
export interface GroqCacheOptions {
  /** Seconds the result is served before the cache revalidates. */
  revalidate?: number;
  /** Cache tags for on-demand `revalidateTag` invalidation (Scope E). */
  tags?: string[];
}

/**
 * A Sanity read's typed failure. Every call site must resolve it
 * deliberately — `degradeSection` (`lib/effect/degrade.ts`) for a **section**
 * read, or a call-site `Effect.orDie` with a one-line reason for a
 * **subject** read (#2433 rule 2/3) — because `runPromise` (`lib/effect/
 * runtime.ts`) refuses to accept an effect whose error channel isn't `never`.
 */
export class SanityReadError extends Data.TaggedError("SanityReadError")<{
  readonly cause: unknown;
}> {
  override get message() {
    return `Sanity fetch failed: ${String(this.cause)}`;
  }
}

/**
 * Every Sanity read in the app goes through here. Its error channel is
 * `SanityReadError` — see that class for how a call site must resolve it.
 */
export const fetchGroq = <T>(
  query: string,
  params?: Record<string, unknown>,
  options?: GroqCacheOptions,
): Effect.Effect<T, SanityReadError> =>
  Effect.tryPromise({
    // Only pass the 3rd arg when caching is requested, so untagged callers keep
    // inheriting the route segment's `revalidate` (current behaviour).
    try: () =>
      options
        ? sanityClient.fetch<T>(query, params ?? {}, {
            next: { revalidate: options.revalidate, tags: options.tags },
          })
        : sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new SanityReadError({ cause }),
  });
