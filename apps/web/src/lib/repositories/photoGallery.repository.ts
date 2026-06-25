import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type {
  GALLERIES_QUERY_RESULT,
  GALLERY_BY_SLUG_QUERY_RESULT,
  GALLERY_SLUGS_QUERY_RESULT,
  GALLERIES_BY_MATCH_QUERY_RESULT,
  GALLERIES_BY_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

// Card projection (list + detail-page insertions). `images[0]` is the canonical
// cover (no separate `coverImage` field). `coverAlt` falls back to the first
// caption, then the title. The projection is inlined per-query rather than
// interpolated so `sanity typegen` can statically resolve each result type.
export const GALLERIES_QUERY =
  defineQuery(`*[_type == "photoGallery" && defined(slug.current)] | order(publishedAt desc) {
  "id": _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "imageCount": coalesce(count(images), 0),
  "coverUrl": images[0].image.asset->url,
  "coverLqip": images[0].image.asset->metadata.lqip,
  "coverAlt": coalesce(images[0].caption, title, "")
}`);

/**
 * Detail-page payload for `/galerij/[slug]`. `descriptionText` is the
 * flattened plain-text intro (used for the OG/meta description), while
 * `descriptionRich` keeps the raw Portable Text so the page renders its
 * formatting via <PortableText> (STUDIO-3). Each image resolves its credit at
 * query time — per-image `credit` overrides the gallery `defaultCredit` (`^`
 * is the parent doc). `lqip` feeds the `next/image` `placeholder="blur"`.
 */
export const GALLERY_BY_SLUG_QUERY =
  defineQuery(`*[_type == "photoGallery" && slug.current == $slug][0] {
  "id": _id,
  "updatedAt": _updatedAt,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "descriptionText": pt::text(description),
  "descriptionRich": description,
  "images": images[]{
    "url": image.asset->url,
    "lqip": image.asset->metadata.lqip,
    "alt": coalesce(alt, caption, ""),
    "caption": coalesce(caption, ""),
    "credit": coalesce(credit, ^.defaultCredit, "")
  }
}`);

/** Slug-only query for `generateStaticParams`. */
export const GALLERY_SLUGS_QUERY = defineQuery(
  `*[_type == "photoGallery" && defined(slug.current)] { "slug": coalesce(slug.current, ""), "updatedAt": _updatedAt }`,
);

// Galleries linked to a PSD match, oldest-first (chronological per spec: a match
// can have warmup / match / viering galleries). Same card shape as GALLERIES_QUERY.
export const GALLERIES_BY_MATCH_QUERY =
  defineQuery(`*[_type == "photoGallery" && linkedMatch == $matchId && defined(slug.current)] | order(publishedAt asc) {
  "id": _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "imageCount": coalesce(count(images), 0),
  "coverUrl": images[0].image.asset->url,
  "coverLqip": images[0].image.asset->metadata.lqip,
  "coverAlt": coalesce(images[0].caption, title, "")
}`);

// Galleries linked to an event document, oldest-first. Same card shape.
export const GALLERIES_BY_EVENT_QUERY =
  defineQuery(`*[_type == "photoGallery" && linkedEvent._ref == $eventId && defined(slug.current)] | order(publishedAt asc) {
  "id": _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "imageCount": coalesce(count(images), 0),
  "coverUrl": images[0].image.asset->url,
  "coverLqip": images[0].image.asset->metadata.lqip,
  "coverAlt": coalesce(images[0].caption, title, "")
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

/** One gallery as rendered on a card (list + match/event insertions). */
export type GalleryCardVM = GALLERIES_QUERY_RESULT[number];

/** Full gallery payload for the detail page. */
export type GalleryDetailVM = NonNullable<GALLERY_BY_SLUG_QUERY_RESULT>;

/** One image within a gallery, with credit already resolved. */
export type GalleryImageVM = NonNullable<GalleryDetailVM["images"]>[number];

// ─── Service ─────────────────────────────────────────────────────────────────

export interface PhotoGalleryRepositoryInterface {
  readonly findAll: () => Effect.Effect<GalleryCardVM[]>;
  readonly findBySlug: (slug: string) => Effect.Effect<GalleryDetailVM | null>;
  readonly findAllSlugs: () => Effect.Effect<GALLERY_SLUGS_QUERY_RESULT>;
  readonly findByLinkedMatch: (
    matchId: string,
  ) => Effect.Effect<GalleryCardVM[]>;
  readonly findByLinkedEvent: (
    eventId: string,
  ) => Effect.Effect<GalleryCardVM[]>;
}

export class PhotoGalleryRepository extends Context.Tag(
  "PhotoGalleryRepository",
)<PhotoGalleryRepository, PhotoGalleryRepositoryInterface>() {}

export const PhotoGalleryRepositoryLive = Layer.succeed(
  PhotoGalleryRepository,
  {
    findAll: () =>
      fetchGroq<GALLERIES_QUERY_RESULT>(GALLERIES_QUERY, undefined, {
        revalidate: SANITY_LIST_REVALIDATE,
        tags: [SANITY_TAGS.galleries],
      }),
    findBySlug: (slug) =>
      fetchGroq<GALLERY_BY_SLUG_QUERY_RESULT>(GALLERY_BY_SLUG_QUERY, {
        slug,
      }).pipe(Effect.map((row) => row ?? null)),
    findAllSlugs: () =>
      fetchGroq<GALLERY_SLUGS_QUERY_RESULT>(GALLERY_SLUGS_QUERY),
    findByLinkedMatch: (matchId) =>
      fetchGroq<GALLERIES_BY_MATCH_QUERY_RESULT>(
        GALLERIES_BY_MATCH_QUERY,
        { matchId },
        { revalidate: SANITY_LIST_REVALIDATE, tags: [SANITY_TAGS.galleries] },
      ),
    findByLinkedEvent: (eventId) =>
      fetchGroq<GALLERIES_BY_EVENT_QUERY_RESULT>(
        GALLERIES_BY_EVENT_QUERY,
        { eventId },
        { revalidate: SANITY_LIST_REVALIDATE, tags: [SANITY_TAGS.galleries] },
      ),
  },
);
