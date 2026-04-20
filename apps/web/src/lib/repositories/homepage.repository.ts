import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  HOMEPAGE_BANNERS_QUERY_RESULT,
  HOMEPAGE_PLACEHOLDER_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const HOMEPAGE_BANNERS_QUERY = defineQuery(`*[_type == "homePage"][0] {
    "bannerSlotA": bannerSlotA-> {
      "imageUrl": image.asset->url + "?w=1200&q=80&fm=webp&fit=max",
      alt,
      href
    },
    "bannerSlotB": bannerSlotB-> {
      "imageUrl": image.asset->url + "?w=1200&q=80&fm=webp&fit=max",
      alt,
      href
    },
    "bannerSlotC": bannerSlotC-> {
      "imageUrl": image.asset->url + "?w=1200&q=80&fm=webp&fit=max",
      alt,
      href
    }
  }`);

export const HOMEPAGE_PLACEHOLDER_QUERY =
  defineQuery(`*[_type == "homePage"][0] {
    "matchesSliderPlaceholder": matchesSliderPlaceholder {
      nextSeasonKickoff,
      announcementText,
      announcementHref,
      "highlightImage": highlightImage {
        alt,
        "asset": asset->{
          _id,
          url,
          "lqip": metadata.lqip,
          "dimensions": metadata.dimensions
        }
      }
    }
  }`);

export interface BannerSlotVM {
  imageUrl: string;
  alt: string;
  href?: string;
}

export interface HomepageBannersVM {
  bannerSlotA: BannerSlotVM | null;
  bannerSlotB: BannerSlotVM | null;
  bannerSlotC: BannerSlotVM | null;
}

type RawSlot = NonNullable<HOMEPAGE_BANNERS_QUERY_RESULT>["bannerSlotA"];

function toBannerSlotVM(slot: RawSlot): BannerSlotVM | null {
  if (!slot || !slot.imageUrl || !slot.alt) return null;
  return {
    imageUrl: slot.imageUrl,
    alt: slot.alt,
    href: slot.href ?? undefined,
  };
}

export function toBannersVM(
  data: HOMEPAGE_BANNERS_QUERY_RESULT,
): HomepageBannersVM {
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
    width?: number;
    height?: number;
  };
}

export function toPlaceholderVM(
  data: HOMEPAGE_PLACEHOLDER_QUERY_RESULT,
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
          width: image.asset!.dimensions?.width ?? undefined,
          height: image.asset!.dimensions?.height ?? undefined,
        }
      : undefined,
  };
}

export interface HomepageRepositoryInterface {
  readonly getBanners: () => Effect.Effect<HomepageBannersVM>;
  readonly getPlaceholder: () => Effect.Effect<MatchesSliderPlaceholderVM | null>;
}

export class HomepageRepository extends Context.Tag("HomepageRepository")<
  HomepageRepository,
  HomepageRepositoryInterface
>() {}

export const HomepageRepositoryLive = Layer.succeed(HomepageRepository, {
  getBanners: () =>
    fetchGroq<HOMEPAGE_BANNERS_QUERY_RESULT>(HOMEPAGE_BANNERS_QUERY).pipe(
      Effect.map(toBannersVM),
    ),
  getPlaceholder: () =>
    fetchGroq<HOMEPAGE_PLACEHOLDER_QUERY_RESULT>(
      HOMEPAGE_PLACEHOLDER_QUERY,
    ).pipe(Effect.map(toPlaceholderVM)),
});
