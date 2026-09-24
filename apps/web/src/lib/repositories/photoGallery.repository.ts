import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type {
  GALLERIES_QUERY_RESULT,
  GALLERY_BY_SLUG_QUERY_RESULT,
  GALLERIES_BY_MATCH_QUERY_RESULT,
  GALLERIES_BY_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

// Card projection (list + detail-page insertions). `images[0]` is the canonical
// cover (no separate `coverImage` field). The projection is inlined per-query
// rather than interpolated so `sanity typegen` can statically resolve each
// result type.
//
// No `coverAlt`: the card's own title names the cover in the same section, so
// the cover is decorative and takes `alt=""` (#2559 / #2548 rule 1). The
// caption-then-title fallback this projection used to carry had exactly one
// consumer, and that consumer now passes nothing.
// Sliced: galleries never drop off the list, so `/galerij` is the one other
// listing whose payload grows without a bound and it takes the same
// 24 + 12 load-more contract as `/nieuws` (#2569 / decision #2431).
const GALLERIES_QUERY =
  defineQuery(`*[_type == "photoGallery" && defined(slug.current)] | order(publishedAt desc) [$offset...$end] {
  "id": _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "imageCount": coalesce(count(images), 0),
  "coverUrl": images[0].asset->url,
  "coverLqip": images[0].asset->metadata.lqip
}`);

/**
 * Detail-page payload for `/galerij/[slug]`. `descriptionText` is the
 * flattened plain-text intro (used for the OG/meta description), while
 * `descriptionRich` keeps the raw Portable Text so the page renders its
 * formatting via <PortableText> (STUDIO-3). Each image resolves its credit at
 * query time — per-image `credit` overrides the gallery `defaultCredit` (`^`
 * is the parent doc). `lqip` feeds the `next/image` `placeholder="blur"`.
 *
 * `linkedEvent` is the gallery's own domain relation for `<RelatedRow>`
 * (#2443/#2581) — bounded (a gallery links at most one event) and defining
 * (the event this gallery documents). `linkedMatch` (a bare, unpicked
 * string — see `GALLERIES_BY_MATCH_QUERY`) deliberately has no equivalent
 * projection here: a match is not a Sanity document, so it never becomes a
 * card from this side either ("Gallery in, match out", #2443 resolution).
 */
const GALLERY_BY_SLUG_QUERY =
  defineQuery(`*[_type == "photoGallery" && slug.current == $slug][0] {
  "id": _id,
  "updatedAt": _updatedAt,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "descriptionText": pt::text(description),
  "descriptionRich": description,
  "images": images[]{
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "alt": coalesce(alt, ""),
    "caption": coalesce(caption, ""),
    "credit": coalesce(credit, ^.defaultCredit, "")
  },
  "linkedEvent": linkedEvent-> {
    "id": _id,
    "title": coalesce(pt::text(title), title, ""),
    "slug": coalesce(slug.current, ""),
    "dateStart": coalesce(dateStart, ""),
    dateEnd,
    "coverImageUrl": coverImage.asset->url + "?w=800&h=450&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(coverImage.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(coverImage.hotspot.y, 0.5))
  }
}`);

// Galleries linked to a PSD match, oldest-first (chronological per spec: a match
// can have warmup / match / viering galleries). Same card shape as GALLERIES_QUERY.
const GALLERIES_BY_MATCH_QUERY =
  defineQuery(`*[_type == "photoGallery" && linkedMatch == $matchId && defined(slug.current)] | order(publishedAt asc) {
  "id": _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "imageCount": coalesce(count(images), 0),
  "coverUrl": images[0].asset->url,
  "coverLqip": images[0].asset->metadata.lqip
}`);

// Galleries linked to an event document, oldest-first. Same card shape.
const GALLERIES_BY_EVENT_QUERY =
  defineQuery(`*[_type == "photoGallery" && linkedEvent._ref == $eventId && defined(slug.current)] | order(publishedAt asc) {
  "id": _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "publishedAt": coalesce(publishedAt, ""),
  "imageCount": coalesce(count(images), 0),
  "coverUrl": images[0].asset->url,
  "coverLqip": images[0].asset->metadata.lqip
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
  readonly findPaginated: (params: {
    offset: number;
    limit: number;
  }) => Effect.Effect<GalleryCardVM[], SanityReadError>;
  readonly findBySlug: (
    slug: string,
  ) => Effect.Effect<GalleryDetailVM | null, SanityReadError>;
  readonly findByLinkedMatch: (
    matchId: string,
  ) => Effect.Effect<GalleryCardVM[], SanityReadError>;
  readonly findByLinkedEvent: (
    eventId: string,
  ) => Effect.Effect<GalleryCardVM[], SanityReadError>;
}

export class PhotoGalleryRepository extends Context.Tag(
  "PhotoGalleryRepository",
)<PhotoGalleryRepository, PhotoGalleryRepositoryInterface>() {}

export const PhotoGalleryRepositoryLive = Layer.succeed(
  PhotoGalleryRepository,
  {
    findPaginated: ({ offset, limit }) =>
      fetchGroq<GALLERIES_QUERY_RESULT>(
        GALLERIES_QUERY,
        { offset, end: offset + limit },
        {
          revalidate: SANITY_LIST_REVALIDATE,
          tags: [SANITY_TAGS.galleries],
        },
      ),
    findBySlug: (slug) =>
      fetchGroq<GALLERY_BY_SLUG_QUERY_RESULT>(GALLERY_BY_SLUG_QUERY, {
        slug,
      }).pipe(Effect.map((row) => row ?? null)),
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
