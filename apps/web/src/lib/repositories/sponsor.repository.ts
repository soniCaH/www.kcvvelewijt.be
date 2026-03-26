import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { sanityClient } from "../sanity/client";
import type { SPONSORS_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const SPONSORS_QUERY =
  defineQuery(`*[_type == "sponsor" && active == true] | order(name asc) {
  _id, name, url, type, tier, featured, "logoUrl": logo.asset->url + "?w=400&q=80&fm=webp&fit=max"
}`);

export interface SponsorVM {
  id: string;
  name: string;
  url?: string;
  type?: string;
  tier?: "hoofdsponsor" | "sponsor" | "sympathisant";
  featured: boolean;
  logoUrl?: string;
}

export function toSponsorVM(row: SPONSORS_QUERY_RESULT[number]): SponsorVM {
  return {
    id: row._id,
    name: row.name ?? "",
    url: row.url ?? undefined,
    type: row.type ?? undefined,
    tier: row.tier ?? undefined,
    featured: row.featured ?? false,
    logoUrl: row.logoUrl ?? undefined,
  };
}

export interface SponsorRepositoryInterface {
  readonly findAll: () => Effect.Effect<SponsorVM[]>;
}

export class SponsorRepository extends Context.Tag("SponsorRepository")<
  SponsorRepository,
  SponsorRepositoryInterface
>() {}

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);

export const SponsorRepositoryLive = Layer.succeed(SponsorRepository, {
  findAll: () =>
    fetchGroq<SPONSORS_QUERY_RESULT>(SPONSORS_QUERY).pipe(
      Effect.map((rows) => rows.map(toSponsorVM)),
    ),
});
