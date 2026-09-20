import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { SanityReadError } from "../sanity/fetch-groq";
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

function runWithRepo<A>(
  effect: Effect.Effect<A, SanityReadError, HomepageRepository>,
) {
  return Effect.runPromise(Effect.provide(effect, HomepageRepositoryLive));
}

function makeHomepageResult(
  overrides: Partial<NonNullable<HOMEPAGE_QUERY_RESULT>> = {},
): HOMEPAGE_QUERY_RESULT {
  return {
    bannerSlotA: {
      imageUrl: "https://cdn.sanity.io/banner-a.webp",
      imageDimensions: { width: 1920, height: 427 },
      alt: "Banner A alt",
      href: "https://example.com/a",
    },
    bannerSlotB: {
      imageUrl: "https://cdn.sanity.io/banner-b.webp",
      imageDimensions: { width: 1920, height: 427 },
      alt: "Banner B alt",
      href: null,
    },
    bannerSlotC: {
      imageUrl: "https://cdn.sanity.io/banner-c.webp",
      imageDimensions: { width: 1920, height: 427 },
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
  it("fits rather than crops every banner slot, and carries the asset's own dimensions (#2928)", () => {
    const query = HOMEPAGE_QUERY as unknown as string;
    // The slot has no house ratio: a banner renders at the asset's own shape,
    // identically at every breakpoint. `fit=max` scales down to the width cap
    // and never crops or upscales — so there is exactly ONE url per slot, and
    // it must carry no crop, no focalpoint and no height.
    const fitParams = `"?w=1200&q=80&fm=webp&fit=max"`;
    const matches = query.match(
      /image\.asset->url \+ "\?w=1200&q=80&fm=webp&fit=max"/g,
    );
    expect(matches).toHaveLength(3);
    expect(query).toContain(`"imageUrl": image.asset->url + ${fitParams}`);

    // The regression guards, scoped to the three banner projections — NOT to
    // the whole query, which still legitimately crops
    // `matchesSliderPlaceholder.highlightImage` to a 1344x320 hero. That is a
    // different image with a different job; only the banner slots lost their
    // crop in #2928.
    //
    // Each string below was in the banner projections before #2928, and each
    // on its own reintroduces a crop: the first line of the live banner's
    // quote was cut off on every phone precisely because the mobile url
    // carved a second, narrower shape out of the same file.
    const bannerProjections =
      query.match(/"bannerSlot[ABC]": bannerSlot[ABC]->\s*\{[^}]*\}/g) ?? [];
    expect(bannerProjections).toHaveLength(3);
    for (const projection of bannerProjections) {
      expect(projection).not.toContain("fit=crop");
      expect(projection).not.toContain("crop=focalpoint");
      expect(projection).not.toContain("imageUrlMobile");
      expect(projection).not.toContain("hotspot");
    }

    // Dimensions are not decoration — they become the <img>'s intrinsic
    // width/height, which is the only thing reserving the box before the
    // bytes land now that no `aspect-[]` ratio does it.
    const dimensionMatches = query.match(
      /"imageDimensions": image\.asset->metadata\.dimensions\{width, height\}/g,
    );
    expect(dimensionMatches).toHaveLength(3);
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
        imageWidth: 1920,
        imageHeight: 427,
        alt: "Banner A alt",
        href: "https://example.com/a",
      });

      expect(banners.bannerSlotB).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-b.webp",
        imageWidth: 1920,
        imageHeight: 427,
        alt: "Banner B alt",
        href: undefined,
      });

      expect(banners.bannerSlotC).toEqual<BannerSlotVM>({
        imageUrl: "https://cdn.sanity.io/banner-c.webp",
        imageWidth: 1920,
        imageHeight: 427,
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
            imageDimensions: { width: 1920, height: 427 },
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

    it("a slot with no asset dimensions produces null for that slot (#2928 — no intrinsic size, no box to reserve)", async () => {
      mockFetch.mockResolvedValueOnce(
        makeHomepageResult({
          bannerSlotA: {
            imageUrl: "https://cdn.sanity.io/banner-a.webp",
            imageDimensions: null,
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

      // Rendering it anyway would put an <img> with no width/height on the
      // page, and with no fixed ratio on the slot the whole homepage below
      // the banner would jump when the image finally decoded. Dropping the
      // slot is the supported state; a layout shift is not.
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

    // Both fields are free-text `string`s with no schema validation, so a
    // stray space is a reachable editor value — and `" "` is truthy. Without
    // the trim the line would render " spelers ·  ploegen".
    it("returns null when a count is whitespace only", () => {
      expect(
        toYouthStatsVM({
          youthPlayerCount: "   ",
          youthTeamCount: "16",
        } as HOMEPAGE_QUERY_RESULT),
      ).toBeNull();

      expect(
        toYouthStatsVM({
          youthPlayerCount: "220+",
          youthTeamCount: "\t\n ",
        } as HOMEPAGE_QUERY_RESULT),
      ).toBeNull();
    });

    it("strips surrounding whitespace from counts it keeps", () => {
      const result = toYouthStatsVM({
        youthPlayerCount: " 220+ ",
        youthTeamCount: " 16 ",
      } as HOMEPAGE_QUERY_RESULT);

      expect(result).toEqual<YouthStatsVM>({
        playerCount: "220+",
        teamCount: "16",
      });
    });
  });
});
