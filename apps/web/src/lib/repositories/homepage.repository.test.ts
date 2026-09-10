import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { HOMEPAGE_QUERY_RESULT } from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  HOMEPAGE_QUERY,
  HomepageRepository,
  HomepageRepositoryLive,
  toPlaceholderVM,
  toYouthStatsVM,
  type HomepageBannersVM,
  type BannerSlotVM,
  type MatchesSliderPlaceholderVM,
  type YouthStatsVM,
} from "./homepage.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, HomepageRepository>) {
  return Effect.runPromise(Effect.provide(effect, HomepageRepositoryLive));
}

function makeHomepageResult(
  overrides: Partial<NonNullable<HOMEPAGE_QUERY_RESULT>> = {},
): HOMEPAGE_QUERY_RESULT {
  return {
    bannerSlotA: {
      imageUrl: "https://cdn.sanity.io/banner-a.webp",
      imageUrlMobile: "https://cdn.sanity.io/banner-a-mobile.webp",
      alt: "Banner A alt",
      href: "https://example.com/a",
    },
    bannerSlotB: {
      imageUrl: "https://cdn.sanity.io/banner-b.webp",
      imageUrlMobile: "https://cdn.sanity.io/banner-b-mobile.webp",
      alt: "Banner B alt",
      href: null,
    },
    bannerSlotC: {
      imageUrl: "https://cdn.sanity.io/banner-c.webp",
      imageUrlMobile: "https://cdn.sanity.io/banner-c-mobile.webp",
      alt: "Banner C alt",
      href: "https://example.com/c",
    },
    matchesSliderPlaceholder: null,
    youthPlayerCount: "220+",
    youthTeamCount: "16",
    ...overrides,
  };
}

describe("HOMEPAGE_QUERY", () => {
  it("includes hotspot-aware CDN crop params for all three banner slots", () => {
    const query = HOMEPAGE_QUERY as unknown as string;
    // Banners render in a fixed 6:1 `object-cover` frame (<BannerSlot>) from
    // the `md` breakpoint up, so the URL bakes a 6:1 focalpoint crop —
    // otherwise the browser center-crops and ignores the editorial hotspot
    // (same bug fixed on article cover images).
    const cropParams = `"?w=1200&h=200&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x="`;
    const matches = query.match(
      /image\.asset->url \+ "\?w=1200&h=200&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x="/g,
    );
    expect(matches).toHaveLength(3);
    expect(query).toContain(`"imageUrl": image.asset->url + ${cropParams}`);
  });

  it("includes a taller 3:1 mobile crop per slot (#2401 item 2)", () => {
    const query = HOMEPAGE_QUERY as unknown as string;
    const mobileCropParams = `"?w=720&h=240&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x="`;
    const matches = query.match(
      /image\.asset->url \+ "\?w=720&h=240&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x="/g,
    );
    expect(matches).toHaveLength(3);
    expect(query).toContain(
      `"imageUrlMobile": image.asset->url + ${mobileCropParams}`,
    );
  });

  it("also projects the matchesSliderPlaceholder fields (#2858 — folded into the same round-trip)", () => {
    const query = HOMEPAGE_QUERY as unknown as string;
    expect(query).toContain(
      `"matchesSliderPlaceholder": matchesSliderPlaceholder`,
    );
    expect(query).toContain("nextSeasonKickoff");
    expect(query).toContain("announcementText");
    expect(query).toContain("announcementHref");
    expect(query).toContain("highlightImage");
  });

  it('reads the homePage document exactly once (no second `[_type == "homePage"][0]` projection)', () => {
    const query = HOMEPAGE_QUERY as unknown as string;
    const documentReads = query.match(/\[_type == "homePage"\]\[0\]/g);
    expect(documentReads).toHaveLength(1);
  });
});

describe("HomepageRepository", () => {
  describe("getHomepage", () => {
    it("issues exactly one sanityClient.fetch call for both banners and the placeholder (#2858)", async () => {
      mockFetch.mockResolvedValueOnce(makeHomepageResult());

      await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("carries getBanners's cache tag/revalidate treatment (already covered by /api/revalidate's homePage case)", async () => {
      mockFetch.mockResolvedValueOnce(makeHomepageResult());

      await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        {},
        {
          next: { revalidate: 60 * 60 * 24, tags: ["banners"] },
        },
      );
    });

    it("maps all three banner slots correctly from the merged GROQ result", async () => {
      mockFetch.mockResolvedValueOnce(makeHomepageResult());

      const { banners } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(banners.bannerSlotA).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-a.webp",
        imageUrlMobile: "https://cdn.sanity.io/banner-a-mobile.webp",
        alt: "Banner A alt",
        href: "https://example.com/a",
      });

      expect(banners.bannerSlotB).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-b.webp",
        imageUrlMobile: "https://cdn.sanity.io/banner-b-mobile.webp",
        alt: "Banner B alt",
        href: undefined,
      });

      expect(banners.bannerSlotC).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-c.webp",
        imageUrlMobile: "https://cdn.sanity.io/banner-c-mobile.webp",
        alt: "Banner C alt",
        href: "https://example.com/c",
      });
    });

    it("returns all-null banner fallback and a null placeholder when the homepage document is missing", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const { banners, placeholder } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(banners).toEqual<HomepageBannersVM>({
        bannerSlotA: null,
        bannerSlotB: null,
        bannerSlotC: null,
      });
      expect(placeholder).toBeNull();
    });

    it("returns null for individual missing banner slots", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({ bannerSlotA: null, bannerSlotC: null }),
      );

      const { banners } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(banners.bannerSlotA).toBeNull();
      expect(banners.bannerSlotB).not.toBeNull();
      expect(banners.bannerSlotC).toBeNull();
    });

    it("null imageUrl or alt in a slot produces null for that slot", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({
          bannerSlotA: {
            imageUrl: null,
            imageUrlMobile: "https://cdn.sanity.io/banner-a-mobile.webp",
            alt: "Banner A alt",
            href: null,
          },
        }),
      );

      const { banners } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(banners.bannerSlotA).toBeNull();
    });

    it("null imageUrlMobile in a slot produces null for that slot too (#2401 item 2 — CSS box and CDN crop must agree)", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({
          bannerSlotA: {
            imageUrl: "https://cdn.sanity.io/banner-a.webp",
            imageUrlMobile: null,
            alt: "Banner A alt",
            href: null,
          },
        }),
      );

      const { banners } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(banners.bannerSlotA).toBeNull();
    });

    it("returns null placeholder when matchesSliderPlaceholder is not set", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({ matchesSliderPlaceholder: null }),
      );

      const { placeholder } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(placeholder).toBeNull();
    });

    it("maps all placeholder fields correctly when fully populated, alongside the banners", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({
          matchesSliderPlaceholder: {
            nextSeasonKickoff: "2026-08-10",
            announcementText: "Kalender 25-26 volgende week online",
            announcementHref: "https://example.com/kalender",
            highlightImage: {
              alt: "Supporters op de Driesstraat",
              asset: {
                url: "https://cdn.sanity.io/images/abc.jpg",
                lqip: "data:image/jpeg;base64,/9j...",
              },
            },
          },
        }),
      );

      const { banners, placeholder } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
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
        },
      });
      // The merge is real, not incidental — the banners half of the same
      // fetch is still correctly mapped in the same call.
      expect(banners.bannerSlotA).not.toBeNull();
    });

    it("maps the youth stats fields alongside the banners and placeholder (#2401 item 4)", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({
          youthPlayerCount: "230+",
          youthTeamCount: "17",
        }),
      );

      const { youthStats } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(youthStats).toEqual<YouthStatsVM>({
        playerCount: "230+",
        teamCount: "17",
      });
    });

    it("returns a null youthStats when the homepage document is missing", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const { youthStats } = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
      );

      expect(youthStats).toBeNull();
    });
  });

  describe("toPlaceholderVM", () => {
    it("omits highlightImage when alt is missing", () => {
      const result = toPlaceholderVM({
        matchesSliderPlaceholder: {
          nextSeasonKickoff: null,
          announcementText: null,
          announcementHref: null,
          highlightImage: {
            alt: null,
            asset: {
              url: "https://cdn.sanity.io/images/x.jpg",
              lqip: null,
            },
          },
        },
      } as HOMEPAGE_QUERY_RESULT);

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
      } as HOMEPAGE_QUERY_RESULT);

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
      } as HOMEPAGE_QUERY_RESULT);

      expect(result?.nextSeasonKickoff).toEqual(new Date("2024-08-10"));
    });
  });

  // #2401 item 4 — the jeugd-band stat line moved from a hardcoded literal
  // to two `homePage` fields. Both must be set or the line degrades to
  // nothing rather than showing half a claim (Writer Rule).
  describe("toYouthStatsVM", () => {
    it("maps both fields when set", () => {
      const result = toYouthStatsVM({
        youthPlayerCount: "220+",
        youthTeamCount: "16",
      } as HOMEPAGE_QUERY_RESULT);

      expect(result).toEqual<YouthStatsVM>({
        playerCount: "220+",
        teamCount: "16",
      });
    });

    it("returns null when the player count is missing", () => {
      const result = toYouthStatsVM({
        youthPlayerCount: null,
        youthTeamCount: "16",
      } as HOMEPAGE_QUERY_RESULT);

      expect(result).toBeNull();
    });

    it("returns null when the team count is missing", () => {
      const result = toYouthStatsVM({
        youthPlayerCount: "220+",
        youthTeamCount: null,
      } as HOMEPAGE_QUERY_RESULT);

      expect(result).toBeNull();
    });

    it("returns null when the homepage document itself is missing", () => {
      expect(toYouthStatsVM(null)).toBeNull();
    });
  });
});
