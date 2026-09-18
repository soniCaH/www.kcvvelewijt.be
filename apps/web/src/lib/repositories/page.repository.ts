import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import type {
  PAGES_QUERY_RESULT,
  PAGE_BY_SLUG_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

/**
 * Every editorial club page, for the contents page at `/inhoud` (#2622).
 *
 * `page` carries no visibility flag, no ordering field and no publish date —
 * the schema is title + slug + body — so every document is live the moment it
 * exists and `title asc` is the only stable order available. `_updatedAt` is
 * the one date a page has, and it is what `/inhoud` prints beside each row.
 *
 * Deliberately untagged: `SANITY_TAGS` has no `pages` key and the
 * `/api/revalidate` webhook would have to grow one to match, so the read
 * inherits the consuming route's `revalidate` instead — the same shape
 * `TeamRepository.findAllForLanding` and the event lists use.
 */
export const PAGES_QUERY =
  defineQuery(`*[_type == "page" && defined(slug.current)] | order(title asc) {
  "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""),
  "updatedAt": _updatedAt
}`);

export const PAGE_BY_SLUG_QUERY =
  defineQuery(`*[_type == "page" && slug.current == $slug][0] {
  "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""),
  "heroImageUrl": heroImage.asset->url + "?w=1600&q=80&fm=webp&fit=max",
  metaDescription,
  "ogImageUrl": ogImage.asset->url + "?w=1200&h=630&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(ogImage.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(ogImage.hotspot.y, 0.5)),
  body[]{ ..., "fileUrl": file.asset->url, "fileSize": file.asset->size, "fileMimeType": file.asset->mimeType, "fileOriginalFilename": file.asset->originalFilename, "asset": select(_type == "image" => asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max", title, description, creditLine, metadata{dimensions, lqip} }, _type == "articleImage" => image.asset->{ "url": url + "?w=800&q=80&fm=webp&fit=max", title, description, creditLine, metadata{dimensions, lqip} }) }
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

type PAGE_DETAIL = NonNullable<PAGE_BY_SLUG_QUERY_RESULT>;

/** GROQ projection now returns the final shape — PageVM is a type alias.
 *  Omit + re-declare normalises the `coalesce()` unions typegen emits. */
export type PageVM = Omit<PAGE_DETAIL, "title" | "slug"> & {
  title: string;
  slug: string;
};

/** One row of {@link PAGES_QUERY} — title, slug and when it last changed. */
export type PageListItemVM = Omit<
  PAGES_QUERY_RESULT[number],
  "title" | "slug"
> & {
  title: string;
  slug: string;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export interface PageRepositoryInterface {
  readonly findAll: () => Effect.Effect<PageListItemVM[], SanityReadError>;
  readonly findBySlug: (
    slug: string,
  ) => Effect.Effect<PageVM | null, SanityReadError>;
}

export class PageRepository extends Context.Tag("PageRepository")<
  PageRepository,
  PageRepositoryInterface
>() {}

export const PageRepositoryLive = Layer.succeed(PageRepository, {
  findAll: () => fetchGroq<PAGES_QUERY_RESULT>(PAGES_QUERY),
  findBySlug: (slug) =>
    fetchGroq<PAGE_BY_SLUG_QUERY_RESULT>(PAGE_BY_SLUG_QUERY, { slug }).pipe(
      Effect.map((row) => row ?? null),
    ),
});
