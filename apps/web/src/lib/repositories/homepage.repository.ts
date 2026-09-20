import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type { HOMEPAGE_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Query ──────────────────────────────────────────────────────────────

/**
 * Banners + the off-season placeholder, in one read of the `homePage`
 * singleton (#2858). Both used to be their own `*[_type == "homePage"][0]`
 * query — two Sanity round-trips per render/revalidation of the same
 * document. Folded into one projection here; `toBannersVM`/`toPlaceholderVM`
 * below still parse their own half of the result independently, so neither
 * mapper needed to change shape.
 */
// The banner slot has NO house ratio (#2928, owner decision 2026-09-20). It
// renders the asset at its own shape, identically at every breakpoint, so
// this projection asks the CDN to *fit* the image rather than crop it:
// `fit=max` scales down to the width cap and never crops or upscales — the
// same convention `article.repository.ts` already uses for body images.
//
// It used to build TWO `fit=crop&crop=focalpoint` URLs per slot, 6:1 for
// `md`-and-up and 3:1 below, fed to a `<picture>`. That carved two different
// shapes out of one file, and for any banner with text baked into the
// artwork neither shape could hold it: the live 1920×427 asset lost a third
// of its width on mobile at EVERY hotspot value, cutting the first line of
// its quote. Raising the source to a true 6:1 — which the schema's own
// aspect warning asks for — would have doubled that loss to half the width.
// The two rules fought each other, so both are gone: no crop, no hotspot,
// no second URL. See #2928 for the measured before/after.
//
// `w=1200` is deliberate and measured (2026-09-20, the live asset): it is
// byte-identical to the desktop crop it replaces (23.4 KB → 25.2 KB) and
// costs a phone +11.7 KB over the old 720px crop, on an image that is
// `loading="lazy"` and below the fold. A `srcSet` would shave that back, but
// no repository in this app builds one, and 11.7 KB does not buy a new
// pattern. `metadata{dimensions}` rides along so the `<img>` can carry
// intrinsic `width`/`height` and reserve its own box before the bytes land —
// the layout-shift guard the fixed `aspect-[]` box used to provide for free.
export const HOMEPAGE_QUERY = defineQuery(`*[_type == "homePage"][0] {
    "bannerSlotA": bannerSlotA-> {
      "imageUrl": image.asset->url + "?w=1200&q=80&fm=webp&fit=max",
      "imageDimensions": image.asset->metadata.dimensions{width, height},
      alt,
      href
    },
    "bannerSlotB": bannerSlotB-> {
      "imageUrl": image.asset->url + "?w=1200&q=80&fm=webp&fit=max",
      "imageDimensions": image.asset->metadata.dimensions{width, height},
      alt,
      href
    },
    "bannerSlotC": bannerSlotC-> {
      "imageUrl": image.asset->url + "?w=1200&q=80&fm=webp&fit=max",
      "imageDimensions": image.asset->metadata.dimensions{width, height},
      alt,
      href
    },
    "matchesSliderPlaceholder": matchesSliderPlaceholder {
      nextSeasonKickoff,
      announcementText,
      announcementHref,
      "highlightImage": highlightImage {
        alt,
        "asset": asset->{
          "url": url + "?w=1344&h=320&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(^.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(^.hotspot.y, 0.5)),
          "lqip": metadata.lqip
        }
      }
    },
    "youthPlayerCount": youthPlayerCount,
    "youthTeamCount": youthTeamCount
  }`);

export interface BannerSlotVM {
  imageUrl: string;
  /**
   * The asset's own pixel size, passed straight to the `<img>`'s `width`/
   * `height` so the browser reserves the right box before the image loads.
   * The slot has no fixed ratio to reserve it any other way (#2928).
   */
  imageWidth: number;
  imageHeight: number;
  alt: string;
  href?: string;
}

export interface HomepageBannersVM {
  bannerSlotA: BannerSlotVM | null;
  bannerSlotB: BannerSlotVM | null;
  bannerSlotC: BannerSlotVM | null;
}

type RawSlot = NonNullable<HOMEPAGE_QUERY_RESULT>["bannerSlotA"];

function toBannerSlotVM(slot: RawSlot): BannerSlotVM | null {
  // Dimensions are as load-bearing as the URL now: without them the `<img>`
  // has no intrinsic size, and a slot with no fixed ratio would reflow the
  // page when the bytes land. A banner missing them is dropped rather than
  // shipped as a layout shift — the slot is optional by design, so rendering
  // nothing is a supported state (#2928).
  const dimensions = slot?.imageDimensions;
  if (
    !slot ||
    !slot.imageUrl ||
    !slot.alt ||
    !dimensions?.width ||
    !dimensions.height
  ) {
    return null;
  }
  return {
    imageUrl: slot.imageUrl,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
    alt: slot.alt,
    href: slot.href ?? undefined,
  };
}

function toBannersVM(data: HOMEPAGE_QUERY_RESULT): HomepageBannersVM {
  if (!data) {
    return { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null };
  }
  return {
    bannerSlotA: toBannerSlotVM(data.bannerSlotA),
    bannerSlotB: toBannerSlotVM(data.bannerSlotB),
    bannerSlotC: toBannerSlotVM(data.bannerSlotC),
  };
}

export interface MatchesSliderPlaceholderVM {
  nextSeasonKickoff?: Date;
  announcementText?: string;
  announcementHref?: string;
  highlightImage?: {
    alt: string;
    url: string;
    lqip?: string;
  };
}

export function toPlaceholderVM(
  data: HOMEPAGE_QUERY_RESULT,
): MatchesSliderPlaceholderVM | null {
  const placeholder = data?.matchesSliderPlaceholder;
  if (!placeholder) return null;

  const image = placeholder.highlightImage;
  const hasImage = image?.alt && image.asset?.url;

  return {
    nextSeasonKickoff: placeholder.nextSeasonKickoff
      ? new Date(placeholder.nextSeasonKickoff)
      : undefined,
    announcementText: placeholder.announcementText ?? undefined,
    announcementHref: placeholder.announcementHref ?? undefined,
    highlightImage: hasImage
      ? {
          alt: image.alt!,
          url: image.asset!.url!,
          lqip: image.asset!.lqip ?? undefined,
        }
      : undefined,
  };
}

/** The jeugd-band stat line's two CMS-owned numbers (#2401 item 4). */
export interface YouthStatsVM {
  playerCount: string;
  teamCount: string;
}

/**
 * Both fields are required together — a stat line reading "220+ spelers"
 * with no team count (or the reverse) is a half-finished claim, exactly what
 * the Writer Rule's "never show a half-claim" guidance warns against. Either
 * value empty ⇒ `<YouthSection>` omits the whole line rather than rendering
 * one number next to a stray separator.
 *
 * Trimmed before the check: both fields are free-text `string`s in the
 * schema with no validation, so a stray space is a reachable editor value
 * and `" "` is truthy. Untrimmed, it would hand `<YouthSection>` a stat line
 * reading " spelers ·  ploegen" — the blank-claim this guard exists to stop.
 */
export function toYouthStatsVM(
  data: HOMEPAGE_QUERY_RESULT,
): YouthStatsVM | null {
  const playerCount = data?.youthPlayerCount?.trim();
  const teamCount = data?.youthTeamCount?.trim();
  if (!playerCount || !teamCount) return null;
  return { playerCount, teamCount };
}

export interface HomepageVM {
  banners: HomepageBannersVM;
  placeholder: MatchesSliderPlaceholderVM | null;
  youthStats: YouthStatsVM | null;
}

export interface HomepageRepositoryInterface {
  readonly getHomepage: () => Effect.Effect<HomepageVM, SanityReadError>;
}

export class HomepageRepository extends Context.Tag("HomepageRepository")<
  HomepageRepository,
  HomepageRepositoryInterface
>() {}

export const HomepageRepositoryLive = Layer.succeed(HomepageRepository, {
  // One read of the `homePage` singleton for both halves (#2858). Tagged with
  // `SANITY_TAGS.banners` — the tag `getBanners` already carried, and the one
  // `getPlaceholder` was given in #2505 round-3 review finding S4 for the
  // same reason: `/api/revalidate`'s `case "homePage"` already busts this tag
  // + path `/` on every publish of this document, so both halves were already
  // covered by the same webhook before this merge. Folding the queries
  // doesn't change what gets revalidated or when — only the round-trip count.
  getHomepage: () =>
    fetchGroq<HOMEPAGE_QUERY_RESULT>(HOMEPAGE_QUERY, undefined, {
      revalidate: SANITY_LIST_REVALIDATE,
      tags: [SANITY_TAGS.banners],
    }).pipe(
      Effect.map((data) => ({
        banners: toBannersVM(data),
        placeholder: toPlaceholderVM(data),
        youthStats: toYouthStatsVM(data),
      })),
    ),
});
