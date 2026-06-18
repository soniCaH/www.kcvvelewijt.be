import type { Meta, StoryObj } from "@storybook/nextjs-vite";
// Import each component directly rather than from the `.` barrel: the
// barrel re-exports `SponsorsSection`, a server component whose
// transitive Sanity client (`createClient` at module load via
// `runtime.ts`) crashes the Storybook chunk with `Configuration must
// contain projectId`. Same workaround as `SponsorsPage`.
import { BannerSlot } from "./BannerSlot";
import { ClubshopBanner } from "./ClubshopBanner";
import {
  FeaturedEventBand,
  type FeaturedEventBandEvent,
} from "./FeaturedEventBand";
import {
  FeaturedUitgelichtRow,
  type UitgelichtArticle,
} from "./FeaturedUitgelichtRow";
import { NewsGrid, type NewsGridArticle } from "./NewsGrid";
import { UpcomingMatches } from "./UpcomingMatches";
import { YouthSection, YouthBackdrop } from "./YouthSection";
import {
  EditorialHero,
  type EditorialHeroProps,
} from "@/components/article/EditorialHero";
import { mockUpcomingTwelve } from "./UpcomingMatches/UpcomingMatches.mocks";
import { SponsorsBlock } from "@/components/sponsors/SponsorsBlock";
import type { Sponsor } from "@/components/sponsors";
import {
  mockHoofdsponsors,
  mockSponsorsMixed,
} from "@/components/sponsors/SponsorsBlock/SponsorsBlock.mocks";
import { SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import { fixtureImage } from "@test-fixtures/images";

// Phase 4.5.C.1 (#1754) — rebuilds the `Pages/Homepage` story for the
// new R4.B spine + R1.B hero. The carousel is retired; the hero is now
// a static `<EditorialHero placement="homepage">`; positions 2..4 of
// the featured-ordered query fill `<FeaturedUitgelichtRow>`;
// `<ClubshopBanner>` is the closing dark band after `<SponsorsSection>`.
// Per Phase 0.5 the story is intentionally NOT vr-tagged: visual
// regression coverage is at the component level, not the assembled
// page (Playwright e2e covers the integration smoke).

const meta = {
  title: "Pages/Homepage",
  // Keep the `vr` tag so discovery picks the story up; the
  // `parameters.vr.disable = true` below suppresses screenshot
  // capture per the "Defer consumer baselines via vr.disable" rule
  // in `apps/web/CLAUDE.md`. Pages/* stories assemble many
  // already-baselined components; baselining the whole composition
  // doubles the matrix without adding regression signal beyond what
  // the component-level baselines + Playwright `/` smoke already cover.
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    // vr.disable: Page-level composition story. Component-level VR
    // baselines plus the Playwright `/` integration spec cover
    // regression at finer granularity; capturing a full-page
    // composite here would re-baseline the entire matrix on every
    // section tweak, slowing PRs without catching anything the
    // component baselines miss.
    // Repro: discovery picks the story up via the `vr` tag, but
    // postVisit skips capture because of this flag.
    // Approved by: @climacon / https://github.com/soniCaH/www.kcvvelewijt.be/issues/1754
    // Re-evaluate: 2026-08-01 (Phase 9 cleanup window)
    vr: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockHeroProps: EditorialHeroProps = {
  variant: "announcement",
  placement: "homepage",
  hoverStyle: "tilt-photo",
  slug: "kampioen-58-punten",
  title: "Kampioen! 58 punten en titel in eerste provinciale.",
  lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks. Zaterdag wordt gevierd op het sportpark.",
  author: "Redactie",
  category: "Clubnieuws",
  date: "3 mei 2026",
  coverImage: {
    url: fixtureImage("article-hero-generic", 0),
    alt: "Spelers vieren de titel",
  },
};

const mockUitgelichtArticles: UitgelichtArticle[] = [
  {
    href: "/nieuws/voorbeschouwing-seizoen-26-27",
    title: "Voorbeschouwing op de competitiestart van seizoen 26-27",
    imageUrl: fixtureImage("article-hero-generic", 1),
    imageAlt: "Trainingssessie",
    date: "14 mei 2026",
    articleType: "interview",
    badge: "Interview",
  },
  {
    href: "/nieuws/welkom-aaron-daniels",
    title: "Welkom Aaron Daniels: 26-jarige spits versterkt de aanval",
    imageUrl: fixtureImage("article-hero-generic", 2),
    imageAlt: "Aaron Daniels",
    date: "15 mei 2026",
    articleType: "transfer",
    badge: "Transfer",
  },
  {
    href: "/nieuws/spelerstornooi-u13",
    title: "Spelerstornooi U13 zaterdag 15 juni — kom supporteren!",
    imageUrl: fixtureImage("article-hero-jeugd", 0),
    imageAlt: "U13 toernooi",
    date: "16 mei 2026",
    articleType: "event",
    badge: "Evenement",
  },
];

const mockFeaturedEvent: FeaturedEventBandEvent = {
  title: "Sponsoravond 2026",
  slug: "sponsoravond-2026",
  dateStart: "2099-06-15T19:00:00.000Z",
  dateEnd: null,
  coverImage: {
    url: fixtureImage("event-cover", 0),
    alt: "Sponsoravond cover",
  },
  externalLink: { url: "/evenementen/sponsoravond-2026", label: null },
};

const mockNewsGridArticles: NewsGridArticle[] = [
  {
    href: "/nieuws/2025-06-20-definitieve-reeksindeling-3e-nationale-bis",
    title: "Definitieve reeksindeling 3e Nationale BIS",
    imageUrl: fixtureImage("article-hero-generic", 3),
    imageAlt: "Reeksindeling 3e nationale",
    date: "20 juni 2025",
    tags: [{ name: "A-Ploeg" }],
  },
  {
    href: "/nieuws/2025-03-25-overlijden-jean-lepage",
    title: "Overlijden Jean Lepage",
    imageUrl: fixtureImage("article-hero-generic", 4),
    imageAlt: "Jean Lepage tribute",
    date: "25 maart 2025",
    tags: [{ name: "Clubinfo" }],
  },
  {
    href: "/nieuws/2025-01-15-winterstage-spanje",
    title: "Winterstage in Spanje: voorbereiding op play-offs",
    imageUrl: fixtureImage("article-hero-generic", 5),
    imageAlt: "Winterstage",
    date: "15 januari 2025",
    tags: [{ name: "A-Ploeg" }, { name: "Training" }],
  },
  {
    href: "/nieuws/2025-01-10-jeugdwerking-uitbreiding",
    title: "Jeugdwerking breidt uit met nieuwe trainers",
    imageUrl: fixtureImage("article-hero-jeugd", 1),
    imageAlt: "Jeugdtraining",
    date: "10 januari 2025",
    tags: [{ name: "Jeugd" }],
  },
  {
    href: "/nieuws/2025-01-05-nieuwe-sponsor",
    title: "Nieuwe hoofdsponsor voor seizoen 2025-2026",
    imageUrl: fixtureImage("article-hero-generic", 6),
    imageAlt: "Sponsorcontract",
    date: "5 januari 2025",
    tags: [{ name: "Sponsoring" }],
  },
  {
    href: "/nieuws/2024-12-15-jaaroverzicht",
    title: "Jaaroverzicht 2024: hoogtepunten van de A-ploeg",
    imageUrl: fixtureImage("article-hero-generic", 7),
    imageAlt: "Jaaroverzicht 2024",
    date: "15 december 2024",
    tags: [{ name: "A-Ploeg" }],
  },
];

interface HomepageMockProps {
  heroProps?: EditorialHeroProps | null;
  uitgelichtArticles?: UitgelichtArticle[];
  featuredEvent?: FeaturedEventBandEvent | null;
  newsArticles?: NewsGridArticle[];
  upcomingMatches?: typeof mockUpcomingTwelve;
  sponsors?: Sponsor[];
}

const Homepage = ({
  heroProps = mockHeroProps,
  uitgelichtArticles = mockUitgelichtArticles,
  featuredEvent = mockFeaturedEvent,
  newsArticles = mockNewsGridArticles,
  upcomingMatches = mockUpcomingTwelve,
  sponsors = mockSponsorsMixed,
}: HomepageMockProps) => {
  const heroSection: SectionConfig | null = heroProps
    ? {
        key: "hero",
        bg: "transparent",
        content: (
          <div className="mx-auto max-w-[var(--container-index)] px-4 pt-10 pb-4 md:px-8 md:pt-14 md:pb-6">
            <EditorialHero {...heroProps} />
          </div>
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
      }
    : null;

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

  const featuredEventSection: SectionConfig | null = featuredEvent
    ? {
        key: "featured-event",
        bg: "transparent",
        content: <FeaturedEventBand event={featuredEvent} />,
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
      }
    : null;

  const bannerSlotASection: SectionConfig = {
    key: "banner-a",
    bg: "gray-100",
    content: (
      <BannerSlot
        image={fixtureImage("stadium-hero", 0)}
        alt="Banner A"
        href="/sponsors"
      />
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  const latestNewsSection: SectionConfig | null =
    newsArticles.length > 0
      ? {
          key: "latest-news",
          bg: "gray-100",
          content: (
            <NewsGrid
              articles={newsArticles}
              title="Laatste nieuws"
              showViewAll
              viewAllHref="/nieuws"
            />
          ),
        }
      : null;

  const upcomingMatchesSection: SectionConfig | null =
    upcomingMatches.length > 0
      ? {
          key: "upcoming-matches",
          bg: "transparent",
          content: <UpcomingMatches matches={upcomingMatches} />,
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
        }
      : null;

  const bannerSlotBSection: SectionConfig = {
    key: "banner-b",
    bg: "gray-100",
    content: (
      <BannerSlot
        image={fixtureImage("stadium-hero", 1)}
        alt="Banner B"
        href="/sponsors"
      />
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  const youthSection: SectionConfig = {
    key: "youth",
    bg: "jersey-deep",
    content: <YouthSection />,
    backdrop: <YouthBackdrop />,
    // Match the page composition: StripedSeam sits flush at the top.
    paddingTop: "pt-0",
  };

  const bannerSlotCSection: SectionConfig = {
    key: "banner-c",
    bg: "gray-100",
    content: (
      <BannerSlot
        image={fixtureImage("crowd-atmosphere", 0)}
        alt="Banner C"
        href="/sponsors"
      />
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  const sponsorsSection: SectionConfig | null =
    sponsors.length > 0
      ? {
          key: "sponsors",
          bg: "transparent",
          content: <SponsorsBlock sponsors={sponsors} />,
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
        }
      : null;

  const clubshopSection: SectionConfig = {
    key: "clubshop",
    bg: "transparent",
    content: <ClubshopBanner />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  return (
    <SectionStack
      sections={[
        heroSection,
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
  );
};

export const Default: Story = {
  render: () => <Homepage />,
  parameters: {
    docs: {
      description: {
        story:
          "Full data — static hero, 3 Uitgelicht cards, featured event, 6 news cards (3×2 grid), 12 upcoming matches, mixed sponsors. Banner slots A/B/C all populated. R4.B spine: clubshop closes the page after sponsors.",
      },
    },
  },
};

export const NoUitgelicht: Story = {
  render: () => <Homepage uitgelichtArticles={[]} />,
  parameters: {
    docs: {
      description: {
        story:
          "Featured-pool size 1 — `<FeaturedUitgelichtRow>` drops entirely; the hero sits directly above the featured-event band.",
      },
    },
  },
};

export const SparseUitgelicht: Story = {
  render: () => (
    <Homepage uitgelichtArticles={mockUitgelichtArticles.slice(0, 2)} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Featured-pool size 3 — Uitgelicht renders 2 cards (positions 2..3); the row keeps its section header without padding from the non-featured pool.",
      },
    },
  },
};

export const NoFeaturedEvent: Story = {
  render: () => <Homepage featuredEvent={null} />,
  parameters: {
    docs: {
      description: {
        story:
          "No upcoming event flagged — the `<FeaturedEventBand>` slot drops and the Uitgelicht row sits directly above `<BannerSlot a>`.",
      },
    },
  },
};

export const SparseNews: Story = {
  render: () => <Homepage newsArticles={mockNewsGridArticles.slice(0, 2)} />,
  parameters: {
    docs: {
      description: {
        story:
          "Only 2 articles available for the news grid — verifies the 3×2 grid degrades gracefully when sparse.",
      },
    },
  },
};

export const NoUpcomingMatches: Story = {
  render: () => <Homepage upcomingMatches={[]} />,
  parameters: {
    docs: {
      description: {
        story:
          "End-of-season state — `<UpcomingMatches>` returns null and the section is dropped from the stack.",
      },
    },
  },
};

export const NoSponsors: Story = {
  render: () => <Homepage sponsors={[]} />,
  parameters: {
    docs: {
      description: {
        story:
          "Empty sponsor list — `<SponsorsBlock>` returns null and the page closes on `<ClubshopBanner>` directly after `<BannerSlot c>`.",
      },
    },
  },
};

export const HoofdsponsorsOnly: Story = {
  render: () => <Homepage sponsors={mockHoofdsponsors} />,
  parameters: {
    docs: {
      description: {
        story:
          "Only the three hoofdsponsors exist — the equal-size grid still uses 5 columns on desktop, leaving two empty cells at the end of the row.",
      },
    },
  },
};
