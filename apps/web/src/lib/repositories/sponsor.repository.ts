import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { SPONSORS_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const SPONSORS_QUERY =
  defineQuery(`*[_type == "sponsor" && active == true] | order(name asc) {
  _id, name, url, type, tier, featured, description, "logoUrl": logo.asset->url + "?w=400&q=80&fm=webp&fit=max"
}`);

export interface SponsorVM {
  id: string;
  name: string;
  url?: string;
  type?: string;
  tier?: "hoofdsponsor" | "sponsor" | "sympathisant";
  featured: boolean;
  description?: string;
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
    description: row.description ?? undefined,
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

export const SponsorRepositoryLive = Layer.succeed(SponsorRepository, {
  findAll: () =>
    fetchGroq<SPONSORS_QUERY_RESULT>(SPONSORS_QUERY).pipe(
      Effect.map((rows) => rows.map(toSponsorVM)),
    ),
});
