import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  HOMEPAGE_BANNERS_QUERY_RESULT,
  HOMEPAGE_PLACEHOLDER_QUERY_RESULT,
} from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  HOMEPAGE_BANNERS_QUERY,
  HomepageRepository,
  HomepageRepositoryLive,
  toPlaceholderVM,
  type HomepageBannersVM,
  type BannerSlotVM,
  type MatchesSliderPlaceholderVM,
} from "./homepage.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, HomepageRepository>) {
  return Effect.runPromise(Effect.provide(effect, HomepageRepositoryLive));
}

function makeBannersResult(
  overrides: Partial<NonNullable<HOMEPAGE_BANNERS_QUERY_RESULT>> = {},
): HOMEPAGE_BANNERS_QUERY_RESULT {
  return {
    bannerSlotA: {
      imageUrl: "https://cdn.sanity.io/banner-a.webp",
      alt: "Banner A alt",
      href: "https://example.com/a",
    },
    bannerSlotB: {
      imageUrl: "https://cdn.sanity.io/banner-b.webp",
      alt: "Banner B alt",
      href: null,
    },
    bannerSlotC: {
      imageUrl: "https://cdn.sanity.io/banner-c.webp",
      alt: "Banner C alt",
      href: "https://example.com/c",
    },
    ...overrides,
  };
}

describe("HOMEPAGE_BANNERS_QUERY", () => {
  it("includes CDN optimization params for all three banner slots", () => {
    const query = HOMEPAGE_BANNERS_QUERY as unknown as string;
    const cdnParams = `"?w=1200&q=80&fm=webp&fit=max"`;
    const matches = query.match(
      /image\.asset->url \+ "\?w=1200&q=80&fm=webp&fit=max"/g,
    );
    expect(matches).toHaveLength(3);
    expect(query).toContain(`"imageUrl": image.asset->url + ${cdnParams}`);
  });
});

describe("HomepageRepository", () => {
  describe("getBanners", () => {
    it("maps all three banner slots correctly from GROQ result", async () => {
      mockFetch.mockResolvedValueOnce(makeBannersResult());

      const banners = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getBanners();
        }),
      );

      expect(banners.bannerSlotA).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-a.webp",
        alt: "Banner A alt",
        href: "https://example.com/a",
      });

      expect(banners.bannerSlotB).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-b.webp",
        alt: "Banner B alt",
        href: undefined,
      });

      expect(banners.bannerSlotC).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-c.webp",
        alt: "Banner C alt",
        href: "https://example.com/c",
      });
    });

    it("returns all-null fallback when homepage document is missing", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const banners = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getBanners();
        }),
      );

      expect(banners).toEqual<HomepageBannersVM>({
        bannerSlotA: null,
        bannerSlotB: null,
        bannerSlotC: null,
      });
    });

    it("returns null for individual missing banner slots", async () => {
      mockFetch.mockResolvedValueOnce(
        makeBannersResult({ bannerSlotA: null, bannerSlotC: null }),
      );

      const banners = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getBanners();
        }),
      );

      expect(banners.bannerSlotA).toBeNull();
      expect(banners.bannerSlotB).not.toBeNull();
      expect(banners.bannerSlotC).toBeNull();
    });

    it("null imageUrl or alt in a slot produces null for that slot", async () => {
      mockFetch.mockResolvedValueOnce(
        makeBannersResult({
          bannerSlotA: {
            imageUrl: null,
            alt: "Banner A alt",
            href: null,
          },
        }),
      );

      const banners = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getBanners();
        }),
      );

      expect(banners.bannerSlotA).toBeNull();
    });
  });

  describe("getPlaceholder", () => {
    it("returns null when homepage document is missing", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const placeholder = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getPlaceholder();
        }),
      );

      expect(placeholder).toBeNull();
    });

    it("returns null when matchesSliderPlaceholder is not set", async () => {
      mockFetch.mockResolvedValueOnce({ matchesSliderPlaceholder: null });

      const placeholder = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getPlaceholder();
        }),
      );

      expect(placeholder).toBeNull();
    });

    it("maps all fields correctly when fully populated", async () => {
      mockFetch.mockResolvedValueOnce({
        matchesSliderPlaceholder: {
          nextSeasonKickoff: "2026-08-10",
          announcementText: "Kalender 25-26 volgende week online",
          announcementHref: "https://example.com/kalender",
          highlightImage: {
            alt: "Supporters op de Driesstraat",
            asset: {
              _id: "image-abc",
              url: "https://cdn.sanity.io/images/abc.jpg",
              lqip: "data:image/jpeg;base64,/9j...",
              dimensions: { width: 1920, height: 1080 },
            },
          },
        },
      });

      const placeholder = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getPlaceholder();
        }),
      );

      expect(placeholder).toEqual<MatchesSliderPlaceholderVM>({
        nextSeasonKickoff: new Date("2026-08-10"),
        announcementText: "Kalender 25-26 volgende week online",
        announcementHref: "https://example.com/kalender",
        highlightImage: {
          alt: "Supporters op de Driesstraat",
          url: "https://cdn.sanity.io/images/abc.jpg",
          lqip: "data:image/jpeg;base64,/9j...",
          width: 1920,
          height: 1080,
        },
      });
    });

    it("omits highlightImage when alt is missing", () => {
      const result = toPlaceholderVM({
        matchesSliderPlaceholder: {
          nextSeasonKickoff: null,
          announcementText: null,
          announcementHref: null,
          highlightImage: {
            alt: null,
            asset: {
              _id: "image-x",
              url: "https://cdn.sanity.io/images/x.jpg",
              lqip: null,
              dimensions: null,
            },
          },
        },
      } as HOMEPAGE_PLACEHOLDER_QUERY_RESULT);

      expect(result?.highlightImage).toBeUndefined();
    });

    it("omits nextSeasonKickoff when not set", () => {
      const result = toPlaceholderVM({
        matchesSliderPlaceholder: {
          nextSeasonKickoff: null,
          announcementText: "Later meer info",
          announcementHref: null,
          highlightImage: null,
        },
      } as HOMEPAGE_PLACEHOLDER_QUERY_RESULT);

      expect(result?.nextSeasonKickoff).toBeUndefined();
      expect(result?.announcementText).toBe("Later meer info");
    });

    it("accepts past kickoff dates (business logic filters, not the decoder)", () => {
      const result = toPlaceholderVM({
        matchesSliderPlaceholder: {
          nextSeasonKickoff: "2024-08-10",
          announcementText: null,
          announcementHref: null,
          highlightImage: null,
        },
      } as HOMEPAGE_PLACEHOLDER_QUERY_RESULT);

      expect(result?.nextSeasonKickoff).toEqual(new Date("2024-08-10"));
    });
  });
});
