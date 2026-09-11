import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
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
// Item 2 (#2401) — the banner box is a responsive-ratio box, not a single
// fixed one: 6:1 from the `md` breakpoint up (the locked house ratio,
// 2026-07-13 / reaffirmed 2026-09-10), but at a ~358px mobile column that
// crop is a ~60px strip too short to hold any text baked into the artwork
// (`docs` in the #2401 triage comment measured it directly). `BannerSlot`
// therefore renders two `<Image>`s toggled by a Tailwind breakpoint, each
// fed its own server-side crop so the CSS box and the CDN transform always
// agree — a single URL can't do this, since the crop is baked into the
// query string server-side, not derived from the viewport. 3:1 is picked
// for mobile: at ~358px that resolves to ~119px tall, double the illegible
// 60px strip, while staying close enough to the house ratio that the same
// hotspot still frames sensibly at both sizes (a much taller crop would
// need its own hotspot to stay correct, which the schema doesn't collect).
export const HOMEPAGE_QUERY = defineQuery(`*[_type == "homePage"][0] {
    "bannerSlotA": bannerSlotA-> {
      "imageUrl": image.asset->url + "?w=1200&h=200&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(image.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(image.hotspot.y, 0.5)),
      "imageUrlMobile": image.asset->url + "?w=720&h=240&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(image.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(image.hotspot.y, 0.5)),
      alt,
      href
    },
    "bannerSlotB": bannerSlotB-> {
      "imageUrl": image.asset->url + "?w=1200&h=200&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(image.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(image.hotspot.y, 0.5)),
      "imageUrlMobile": image.asset->url + "?w=720&h=240&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(image.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(image.hotspot.y, 0.5)),
      alt,
      href
    },
    "bannerSlotC": bannerSlotC-> {
      "imageUrl": image.asset->url + "?w=1200&h=200&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(image.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(image.hotspot.y, 0.5)),
      "imageUrlMobile": image.asset->url + "?w=720&h=240&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(image.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(image.hotspot.y, 0.5)),
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
  /** Taller mobile-breakpoint crop of the same asset — see `<BannerSlot>`. */
  imageUrlMobile: string;
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
  if (!slot || !slot.imageUrl || !slot.imageUrlMobile || !slot.alt) {
    return null;
  }
  return {
    imageUrl: slot.imageUrl,
    imageUrlMobile: slot.imageUrlMobile,
    alt: slot.alt,
    href: slot.href ?? undefined,
  };
}

export function toBannersVM(data: HOMEPAGE_QUERY_RESULT): HomepageBannersVM {
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
  readonly getHomepage: () => Effect.Effect<HomepageVM>;
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
