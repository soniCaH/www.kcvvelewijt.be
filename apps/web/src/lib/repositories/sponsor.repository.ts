import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { SPONSORS_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const SPONSORS_QUERY =
  defineQuery(`*[_type == "sponsor" && active == true] | order(name asc) {
  "id": _id, "name": coalesce(name, ""), url, type, tier, "featured": coalesce(featured, false), description,
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

// ─── Service ─────────────────────────────────────────────────────────────────

export interface SponsorRepositoryInterface {
  readonly findAll: () => Effect.Effect<SponsorVM[]>;
}

export class SponsorRepository extends Context.Tag("SponsorRepository")<
  SponsorRepository,
  SponsorRepositoryInterface
>() {}

export const SponsorRepositoryLive = Layer.succeed(SponsorRepository, {
  findAll: () => fetchGroq<SPONSORS_QUERY_RESULT>(SPONSORS_QUERY),
});
