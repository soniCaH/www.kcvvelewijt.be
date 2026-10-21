import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type { SHORT_LINKS_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

/** Every short link, in one read: the catch-all never queries per request. */
export const SHORT_LINKS_QUERY =
  defineQuery(`*[_type == "shortLink" && defined(name) && defined(target)] | order(name asc) {
  "name": coalesce(name, ""), "target": coalesce(target, "")
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

/** GROQ projection is the final shape; `coalesce` keeps both fields `string`. */
export type ShortLinkVM = SHORT_LINKS_QUERY_RESULT[number];

// ─── Service ─────────────────────────────────────────────────────────────────

export interface ShortLinkRepositoryInterface {
  readonly findAll: () => Effect.Effect<ShortLinkVM[], SanityReadError>;
}

export class ShortLinkRepository extends Context.Tag("ShortLinkRepository")<
  ShortLinkRepository,
  ShortLinkRepositoryInterface
>() {}

export const ShortLinkRepositoryLive = Layer.succeed(ShortLinkRepository, {
  findAll: () =>
    fetchGroq<SHORT_LINKS_QUERY_RESULT>(SHORT_LINKS_QUERY, undefined, {
      revalidate: SANITY_LIST_REVALIDATE,
      tags: [SANITY_TAGS.shortLinks],
    }),
});
