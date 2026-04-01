import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { PAGE_BY_SLUG_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const PAGE_BY_SLUG_QUERY =
  defineQuery(`*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  "heroImageUrl": heroImage.asset->url + "?w=1600&q=80&fm=webp&fit=max",
  body[]{ ..., "fileUrl": file.asset->url, "fileSize": file.asset->size, "fileMimeType": file.asset->mimeType, "fileOriginalFilename": file.asset->originalFilename, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }) }
}`);

export interface PageVM {
  id: string;
  title: string;
  slug: string;
  heroImageUrl: string | null;
  body: NonNullable<NonNullable<PAGE_BY_SLUG_QUERY_RESULT>["body"]>;
}

export function toPageVM(row: NonNullable<PAGE_BY_SLUG_QUERY_RESULT>): PageVM {
  return {
    id: row._id,
    title: row.title ?? "",
    slug: row.slug?.current ?? "",
    heroImageUrl:
      ((row as Record<string, unknown>).heroImageUrl as string | null) ?? null,
    body: row.body ?? [],
  };
}

export interface PageRepositoryInterface {
  readonly findBySlug: (slug: string) => Effect.Effect<PageVM | null>;
}

export class PageRepository extends Context.Tag("PageRepository")<
  PageRepository,
  PageRepositoryInterface
>() {}

export const PageRepositoryLive = Layer.succeed(PageRepository, {
  findBySlug: (slug) =>
    fetchGroq<PAGE_BY_SLUG_QUERY_RESULT>(PAGE_BY_SLUG_QUERY, { slug }).pipe(
      Effect.map((row) => (row ? toPageVM(row) : null)),
    ),
});
