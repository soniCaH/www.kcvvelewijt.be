/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 *
 * Spine order (#2387): hero → Dit weekend → Uitgelicht → …, so a supporter
 * reaches the first-team result inside the second screen on a phone instead
 * of the fourth.
 *
 * Phase 4.5.C.1 (#1754) — R4.B spine reorder + R1.B static-hero
 * retirement of `<HomepageHeroCarousel>`. The hero is now a single
 * static `<EditorialHero placement="homepage">` rendering the top
 * featured article; positions 2..4 of the featured-ordered query fill
 * the new `<FeaturedUitgelichtRow>`; `<ClubshopBanner>` slides to the
 * bottom of the spine (after `<SponsorsSection>`), with `<BannerSlot c>`
 * promoted to sit between Youth and Sponsors.
 *
 * Per-section components own their own backgrounds and editorial
 * chrome, so every `<SectionStack>` entry uses `bg: "transparent"` and
 * the page cream shows through. The news grid and the three banner
 * strips used to sit on `gray-100`, the one cool grey left over from
 * before the redesign; #2342 retired it in favour of no distinct
 * surface at all, so the whole spine now reads as one sheet of paper
 * with the jersey-deep youth band as its only interruption.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import {
  ArticleRepository,
  type ArticleVM,
  toHomepageArticles,
} from "@/lib/repositories/article.repository";
import { formatArticleDate } from "@/lib/utils/dates";
import {
  HomepageRepository,
  type BannerSlotVM,
} from "@/lib/repositories/homepage.repository";
import { TrackInView } from "@/components/analytics";
import { EventRepository } from "@/lib/repositories/event.repository";
import { BffService } from "@/lib/effect/services/BffService";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import {
  BannerSlot,
  HomepageAnalytics,
  FeaturedEventBand,
  toFeaturedEventBandEvent,
  FeaturedUitgelichtRow,
  type UitgelichtArticle,
  type ArticleType as UitgelichtArticleType,
  NewsGrid,
  SponsorsSection,
  UpcomingMatches,
  FirstTeamsBlock,
  deriveFirstTeamVM,
  firstTeamsHeading,
  selectSeniorTeams,
  ClubshopBanner,
  YouthBackdrop,
  YouthSection,
} from "@/components/home";
import {
  EditorialHero,
  toEditorialHeroProps,
} from "@/components/article/EditorialHero";
import { PageContainer, SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import { getTeamMatches } from "@/lib/server/match-data";
import { DEFAULT_OG_IMAGE, SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildSportsClubJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Er is maar één plezante compagnie";
  const description = "Startpagina van stamnummer 00055: KCVV Elewijt.";
  return {
    title,
    description,
    keywords:
      "KCVV, Voetbal, Elewijt, Crossing, KCVVE, Zemst, 00055, 55, 1982, 1980",
    alternates: { canonical: SITE_CONFIG.siteUrl },
    openGraph: {
      title,
      description,
      url: SITE_CONFIG.siteUrl,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Narrow the `ArticleVM.articleType` union (which includes `null` for
 * legacy untyped rows) down to the literal union
 * `<FeaturedUitgelichtRow>` expects. Exhaustive switch — when Sanity
 * widens the `articleType` enum (e.g. `matchPreview` / `matchRecap`
 * from #1470) the `never` assertion surfaces the missing case at
 * compile time. `<FeaturedUitgelichtRow>` already accepts those wider
 * literals, so the new branches just return the same value through.
 */
function toUitgelichtArticleType(
  type: ArticleVM["articleType"],
): UitgelichtArticleType | null {
  if (type === null || type === undefined) return null;
  switch (type) {
    case "transfer":
    case "interview":
    case "announcement":
    case "event":
    case "matchPreview":
    case "matchRecap":
      return type;
    default: {
      const _exhaustive: never = type;
      throw new Error(
        `Unhandled articleType in toUitgelichtArticleType: ${String(_exhaustive)}`,
      );
    }
  }
}

function toUitgelichtArticle(article: ArticleVM): UitgelichtArticle {
  return {
    href: `/nieuws/${article.slug}`,
    title: article.title,
    imageUrl: article.coverImageUrl ?? undefined,
    imageLqip: article.coverImageLqip ?? undefined,
    date: article.publishedAt ? formatArticleDate(article.publishedAt) : "",
    articleType: toUitgelichtArticleType(article.articleType),
    badge: article.tags[0],
  };
}

export default async function HomePage() {
  const [
    articlesResult,
    matchesResult,
    homepageResult,
    featuredEventResult,
    teamsResult,
  ] = await Promise.all([
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          const all = yield* repo.findAll();
          // Slice [0..10] per the R1.B + R2.B + R1.6 spine:
          //   • position 1 (index 0) feeds the static <EditorialHero>.
          //   • positions 2..4 (index 1..3) fill <FeaturedUitgelichtRow>.
          //   • positions 5..10 (index 4..9) fill the 3×2 <NewsGrid>.
          return all.slice(0, 10);
        }),
        [] as ArticleVM[],
        "[HomePage] articles read failed; falling back to an empty list.",
      ),
    ),
    runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getNextMatches();
      }).pipe(
        Effect.catchAll((error) => {
          console.error("[HomePage] Failed to fetch matches:", error);
          // `null`, not `[]` — see `firstTeamsReadFailed` & `upcomingMatchesReadFailed` below (#2399).
          return Effect.succeed(null);
        }),
      ),
    ),
    runPromise(
      // Banners + the off-season placeholder share one `homePage` document
      // read (#2858 — folded from two independent round-trips). `degradeSection`,
      // not `Effect.catchAll` — every Sanity read ends in `Effect.orDie`
      // (`fetch-groq.ts`), so a repository method's error channel is `never`
      // and a `catchAll` on one type-checks but never runs (review finding 1
      // on #2505/PR #2852). A failed read now degrades both halves together,
      // where before either could survive the other's failure (two separate
      // fetches, two separate Data Cache entries) — a real trade-off, not a
      // no-op: they read the same document, so a failure that loses one would
      // almost always lose the other anyway.
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* HomepageRepository;
          return yield* repo.getHomepage();
        }),
        {
          banners: { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null },
          placeholder: null,
          youthStats: null,
        },
        "[HomePage] homepage (banners + placeholder + youth stats) read failed; falling back to empty slots, no placeholder, and no youth stats.",
      ),
    ),
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findNextFeatured();
        }),
        null,
        "[HomePage] featured-event read failed; falling back to null.",
      ),
    ),
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAll();
        }),
        [] as TeamNavVM[],
        "[HomePage] teams read failed; falling back to an empty list.",
      ),
    ),
  ]);

  const articles = articlesResult;
  const matches = matchesResult ?? [];
  const banners = homepageResult.banners;
  const placeholder = homepageResult.placeholder;
  const youthStats = homepageResult.youthStats;
  const featuredEvent = featuredEventResult;

  // Senior teams (A/B) — drive the "Eerste ploegen" block and are de-duplicated
  // out of the generic "Komende wedstrijden" agenda below (#2211). The senior
  // nav set = non-youth teams (age not "U*"); a psdId is required to fetch their
  // matches feed. Sorted by slug so a-ploeg renders before b-ploeg.
  const seniorTeams = selectSeniorTeams(teamsResult);

  // Deduped against this route group's layout `<MatchStripSlot>`, which wants
  // the same A-side psdId — see `getTeamMatches` (#2441).
  const firstTeamsMatches = await Promise.all(
    seniorTeams.map((team) =>
      getTeamMatches(Number(team.psdId)).catch(() => null),
    ),
  );

  const now = new Date();
  const firstTeamVMs = seniorTeams.map((team, i) => {
    const division = team.divisionFull ?? team.division ?? undefined;
    return deriveFirstTeamVM(
      {
        label: team.displayName,
        slug: team.slug,
        ...(division ? { division } : {}),
      },
      firstTeamsMatches[i] ?? [],
      now,
    );
  });
  const seniorPsdIds = new Set(seniorTeams.map((t) => Number(t.psdId)));
  // #2399: "no matches" has two causes — a failed read and a genuinely empty
  // feed — and the page used to render both by dropping the match sections and
  // looking finished. Both BFF reads therefore fall back to `null` rather than
  // `[]`, so the bands below can name which one happened. `<MatchStrip>` still
  // drops silently; it takes neither signal. Two bands, two signals, named
  // for what each one actually reads (review finding 3 on #2505/PR #2852 —
  // a shared `matchReadFailed` let a senior team's own 502 make the agenda
  // falsely claim an outage on a read that had actually succeeded).
  const firstTeamsReadFailed =
    matchesResult === null || firstTeamsMatches.some((m) => m === null);
  const upcomingMatchesReadFailed = matchesResult === null;

  const heroArticle = articles[0];
  const heroProps = heroArticle ? toEditorialHeroProps(heroArticle) : null;
  const uitgelichtArticles = articles.slice(1, 4).map(toUitgelichtArticle);
  const newsGridArticles = toHomepageArticles(articles.slice(4, 10));
  // A/B now live in the "Eerste ploegen" block, so the agenda becomes the
  // other-teams agenda (#2211). Matches with no team id stay (can't classify).
  const upcomingMatches = mapMatchesToUpcomingMatches(
    matches.filter(
      (m) => m.kcvv_team_id == null || !seniorPsdIds.has(m.kcvv_team_id),
    ),
  );
  const featuredEventBandEvent = toFeaturedEventBandEvent(featuredEvent);

  if (articles.length === 0 && matches.length === 0) {
    return (
      <PageContainer width="index" className="py-16 text-center">
        <h1 className="text-jersey-deep mb-4 text-3xl font-bold lg:text-4xl">
          Welkom bij KCVV Elewijt
        </h1>
        <p className="text-ink-muted text-lg">
          Inhoud kan momenteel niet worden geladen. Probeer het later opnieuw.
        </p>
      </PageContainer>
    );
  }

  // For self-contained sections (their own <section className="bg-..."> + py-*)
  // we set pt-0/pb-0 on the SectionStack wrapper so its default pt-20/pb-20
  // doesn't paint a transparent strip (= body bg = white) above and below
  // the component's own coloured surface.
  const heroSection: SectionConfig | null = heroProps
    ? {
        key: "hero",
        bg: "transparent",
        // HP-3: no outer container — <EditorialHero>'s shell now owns the
        // index-width container (px-4 md:px-8) so the hero aligns flush with the
        // Uitgelicht grid below. The wrapper keeps only the vertical rhythm.
        content: (
          <div className="pt-10 pb-4 md:pt-14 md:pb-6">
            <EditorialHero {...heroProps} />
          </div>
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
      }
    : null;

  // Uitgelicht sits on `bg-cream-soft` so the warm paper backdrop carries
  // the retro-terrace-fanzine register into the featured-row band; the
  // cards' own cream bg reads as raised on the slightly darker soft-cream
  // surface. The wrapper handles its own top/bottom padding so the
  // SectionStack `pt-0 pb-0` keeps the band flush with the hero above.
  const uitgelichtSection: SectionConfig | null =
    uitgelichtArticles.length > 0
      ? {
          key: "uitgelicht",
          bg: "transparent",
          content: (
            <div className="bg-cream-soft py-12 md:py-16">
              <FeaturedUitgelichtRow articles={uitgelichtArticles} />
            </div>
          ),
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
        }
      : null;

  // "Eerste ploegen" — A/B last result + next fixture, carrying the
  // result→next-fixture transition. Self-contained dark band (own StripedSeam
  // top/bottom + padding), so the SectionStack wrapper stays flush (#2211).
  // HP-4: `firstTeamsHeading` owns when the block may claim "Dit weekend."
  // #2399: unconditional. The band holds its shape open and names the reason
  // when there is nothing to show — dropping it shortened the spine to 7
  // bands and read as "the club never posted the result". A band that
  // acknowledges a remote match feed holds its shape and names the reason on
  // a failed read; `<UpcomingMatches>` below follows the same rule
  // (#2505/#2844) — this band is no longer the only one that does.
  const heading = firstTeamsHeading(firstTeamVMs, now);
  const firstTeamsSection: SectionConfig = {
    key: "first-teams",
    bg: "transparent",
    content: (
      <FirstTeamsBlock
        teams={firstTeamVMs}
        heading={heading}
        unavailable={firstTeamsReadFailed}
        placeholder={placeholder}
        now={now}
      />
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  const featuredEventSection: SectionConfig | null = featuredEventBandEvent
    ? {
        key: "featured-event",
        bg: "transparent",
        content: <FeaturedEventBand event={featuredEventBandEvent} />,
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
      }
    : null;

  const bannerSlotASection = toBannerSection("a", banners.bannerSlotA);

  const latestNewsSection: SectionConfig | null =
    newsGridArticles.length > 0
      ? {
          key: "latest-news",
          bg: "transparent",
          content: (
            <NewsGrid
              articles={newsGridArticles}
              title="Laatste nieuws"
              emphasis={{ text: "nieuws" }}
              showViewAll
              viewAllHref="/nieuws"
            />
          ),
        }
      : null;

  // Unconditional (#2505/#2844) — unlike `featuredEventSection` above, this
  // band holds its shape on a failed read: `<UpcomingMatches>` itself decides
  // null-vs-notice from `matches.length` + `unavailable`, so the section
  // config here never nulls out. One rule, one guard.
  const upcomingMatchesSection: SectionConfig = {
    key: "upcoming-matches",
    bg: "transparent",
    content: (
      <UpcomingMatches
        matches={upcomingMatches}
        unavailable={upcomingMatchesReadFailed}
      />
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  const bannerSlotBSection = toBannerSection("b", banners.bannerSlotB);

  const youthSection: SectionConfig = {
    key: "youth",
    bg: "jersey-deep",
    content: <YouthSection stats={youthStats} />,
    backdrop: <YouthBackdrop />,
    // R5.B `<StripedSeam>` lock — the seam is the first child of
    // `<YouthSection>` and is meant to sit AT the section's top edge,
    // butting against the previous section directly. With the default
    // `pt-20` wrapper, 80px of jersey-deep paints above the seam and
    // it reads as "sandwiched" (visible green band → seam → content).
    // `pt-0` lets the seam land flush; the section's pb-20 stays so
    // the dual-CTA row keeps its bottom breathing room.
    paddingTop: "pt-0",
  };

  const bannerSlotCSection = toBannerSection("c", banners.bannerSlotC);

  const sponsorsSection: SectionConfig = {
    key: "sponsors",
    bg: "transparent",
    content: (
      // The block sits near the bottom of the spine, so a mount-time event
      // would count every homepage load as a sponsor impression (#2400).
      <TrackInView
        eventName="sponsor_impression"
        params={{ source: "homepage" }}
      >
        <SponsorsSection />
      </TrackInView>
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  const clubshopSection: SectionConfig = {
    key: "clubshop",
    bg: "transparent",
    content: <ClubshopBanner />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  return (
    <>
      {/* The static `<EditorialHero>` renders the page-level <h1> for the
          featured article when present. Only emit the sr-only "KCVV
          Elewijt" fallback when no hero is rendered (zero featured
          articles), so the document always has exactly one <h1>. */}
      {heroSection ? null : <h1 className="sr-only">KCVV Elewijt</h1>}
      <JsonLd data={buildSportsClubJsonLd()} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
        ])}
      />
      <HomepageAnalytics>
        <SectionStack
          sections={[
            heroSection,
            // #2387: "Dit weekend." sits directly under the hero, ahead of the
            // editorial rows. The result used to land ~2,200px down on a phone,
            // behind the hero and three Uitgelicht cards, which contradicted
            // product principle 1 ("the result is the headline").
            firstTeamsSection,
            uitgelichtSection,
            featuredEventSection,
            bannerSlotASection,
            latestNewsSection,
            upcomingMatchesSection,
            bannerSlotBSection,
            youthSection,
            bannerSlotCSection,
            sponsorsSection,
            clubshopSection,
          ]}
        />
      </HomepageAnalytics>
    </>
  );
}

/**
 * One homepage banner slot, instrumented (#2400). The three slots differ only
 * in their content and scroll depth, so they share a builder rather than three
 * near-identical literals — `position` is what tells them apart in GA4.
 */
function toBannerSection(
  slot: "a" | "b" | "c",
  banner: BannerSlotVM | null,
): SectionConfig | null {
  if (!banner) return null;
  return {
    key: `banner-${slot}`,
    bg: "transparent",
    content: (
      // `destination` matches what `banner_click` sends, so impressions and
      // clicks join on it. The slot alone can't identify the creative — the
      // three slots are fixed but their campaigns rotate.
      <TrackInView
        eventName="banner_impression"
        params={{ position: slot, destination: banner.href ?? "" }}
      >
        <BannerSlot
          image={banner.imageUrl}
          mobileImage={banner.imageUrlMobile}
          alt={banner.alt}
          href={banner.href}
          slot={slot}
        />
      </TrackInView>
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };
}

/**
 * Enable ISR with 15 minute revalidation — the homepage renders live PSD
 * match data (next match), so its cache is aligned to the BFF freshness window.
 */
export const revalidate = 900;
