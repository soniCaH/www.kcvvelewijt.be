import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type {
  MATCHBAL_BY_MATCH_QUERY_RESULT,
  SPONSORS_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const SPONSORS_QUERY =
  defineQuery(`*[_type == "sponsor" && active == true] | order(name asc) {
  "id": _id, "name": coalesce(name, ""), url, type, tier, "featured": coalesce(featured, false), description,
  "logoUrl": logo.asset->url + "?w=400&q=80&fm=webp&fit=max"
}`);

/**
 * The matchday sponsor of one Match (#3917), when that Sponsor is active.
 * The Studio refuses a second `matchbal` per Match; should two slip through
 * (two saves at once, a script), the newest wins. `null` when there is none.
 */
export const MATCHBAL_BY_MATCH_QUERY =
  defineQuery(`*[_type == "matchbal" && matchId == $matchId && sponsor->active == true] | order(_updatedAt desc)[0].sponsor->{
  "id": _id, "name": coalesce(name, ""), url,
  "logoUrl": logo.asset->url + "?w=400&q=80&fm=webp&fit=max"
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

/** GROQ projection now returns the final shape — SponsorVM is a type alias.
 *  Omit + re-declare normalises the `coalesce()` unions typegen emits. */
export type SponsorVM = Omit<
  SPONSORS_QUERY_RESULT[number],
  "name" | "featured"
> & {
  name: string;
  featured: boolean;
};

/** The matchday sponsor's name, link and logo; `coalesce` keeps `name` a string. */
export type MatchbalSponsorVM = NonNullable<MATCHBAL_BY_MATCH_QUERY_RESULT>;

// ─── Service ─────────────────────────────────────────────────────────────────

export interface SponsorRepositoryInterface {
  readonly findAll: () => Effect.Effect<SponsorVM[], SanityReadError>;
  readonly findMatchbal: (
    matchId: string,
  ) => Effect.Effect<MatchbalSponsorVM | null, SanityReadError>;
}

export class SponsorRepository extends Context.Tag("SponsorRepository")<
  SponsorRepository,
  SponsorRepositoryInterface
>() {}

export const SponsorRepositoryLive = Layer.succeed(SponsorRepository, {
  findAll: () =>
    fetchGroq<SPONSORS_QUERY_RESULT>(SPONSORS_QUERY, undefined, {
      revalidate: SANITY_LIST_REVALIDATE,
      tags: [SANITY_TAGS.sponsors],
    }),
  // `matchbal`: a Matchbal save refreshes only these reads. `sponsors`: a
  // renamed or re-logoed Sponsor still reaches the card.
  findMatchbal: (matchId) =>
    fetchGroq<MATCHBAL_BY_MATCH_QUERY_RESULT>(
      MATCHBAL_BY_MATCH_QUERY,
      { matchId },
      {
        revalidate: SANITY_LIST_REVALIDATE,
        tags: [SANITY_TAGS.matchbal, SANITY_TAGS.sponsors],
      },
    ),
});
