import { Effect } from "effect";
import { sanityClient } from "./client";

/** Next.js Data Cache directives forwarded to `@sanity/client`'s 3rd arg. */
export interface GroqCacheOptions {
  /** Seconds the result is served before the cache revalidates. */
  revalidate?: number;
  /** Cache tags for on-demand `revalidateTag` invalidation (Scope E). */
  tags?: string[];
}

export const fetchGroq = <T>(
  query: string,
  params?: Record<string, unknown>,
  options?: GroqCacheOptions,
) =>
  Effect.tryPromise({
    // Only pass the 3rd arg when caching is requested, so untagged callers keep
    // inheriting the route segment's `revalidate` (current behaviour).
    try: () =>
      options
        ? sanityClient.fetch<T>(query, params ?? {}, {
            next: { revalidate: options.revalidate, tags: options.tags },
          })
        : sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);
