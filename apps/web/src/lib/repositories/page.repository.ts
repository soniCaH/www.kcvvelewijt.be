import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { PAGE_BY_SLUG_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const PAGE_BY_SLUG_QUERY =
  defineQuery(`*[_type == "page" && slug.current == $slug][0] {
  "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""),
  "heroImageUrl": heroImage.asset->url + "?w=1600&q=80&fm=webp&fit=max",
  metaDescription,
  "ogImageUrl": ogImage.asset->url + "?w=1200&h=630&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(ogImage.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(ogImage.hotspot.y, 0.5)),
  body[]{ ..., "fileUrl": file.asset->url, "fileSize": file.asset->size, "fileMimeType": file.asset->mimeType, "fileOriginalFilename": file.asset->originalFilename, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max" }) }
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

type PAGE_DETAIL = NonNullable<PAGE_BY_SLUG_QUERY_RESULT>;

/** GROQ projection now returns the final shape — PageVM is a type alias.
 *  Omit + re-declare normalises the `coalesce()` unions typegen emits. */
export type PageVM = Omit<PAGE_DETAIL, "title" | "slug"> & {
  title: string;
  slug: string;
};

// ─── Service ─────────────────────────────────────────────────────────────────

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
      Effect.map((row) => row ?? null),
    ),
});
