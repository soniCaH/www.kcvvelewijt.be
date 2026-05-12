import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  BannerSlot,
  FeaturedEventBand,
  type FeaturedEventBandEvent,
  HomepageHeroCarousel,
  NewsGrid,
  UpcomingMatches,
  WebshopBanner,
  YouthBackdrop,
  YouthSection,
} from ".";
import type { NewsGridArticle } from "./NewsGrid";
import { mockArticles as mockHeroArticles } from "./HomepageHeroCarousel/HomepageHeroCarousel.mocks";
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

// Phase 4.D.2 (#1681) — replaces the legacy `Pages/Homepage` story with
// the new section composition shipped in #1680. Per Phase 0.5 the story
// is intentionally NOT vr-tagged: visual regression coverage is at the
// component level, not the assembled page. This story exists so editors
// + designers can preview the homepage in Storybook with mock data
// covering full + sparse states.

const meta = {
  title: "Pages/Homepage",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

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
    imageUrl: fixtureImage("article-hero-generic", 0),
    imageAlt: "Reeksindeling 3e nationale",
    date: "20 juni 2025",
    tags: [{ name: "A-Ploeg" }],
  },
  {
    href: "/nieuws/2025-03-25-overlijden-jean-lepage",
    title: "Overlijden Jean Lepage",
    imageUrl: fixtureImage("article-hero-generic", 1),
    imageAlt: "Jean Lepage tribute",
    date: "25 maart 2025",
    tags: [{ name: "Clubinfo" }],
  },
  {
    href: "/nieuws/2025-01-15-winterstage-spanje",
    title: "Winterstage in Spanje: voorbereiding op play-offs",
    imageUrl: fixtureImage("article-hero-generic", 2),
    imageAlt: "Winterstage",
    date: "15 januari 2025",
    tags: [{ name: "A-Ploeg" }, { name: "Training" }],
  },
  {
    href: "/nieuws/2025-01-10-jeugdwerking-uitbreiding",
    title: "Jeugdwerking breidt uit met nieuwe trainers",
    imageUrl: fixtureImage("article-hero-jeugd", 0),
    imageAlt: "Jeugdtraining",
    date: "10 januari 2025",
    tags: [{ name: "Jeugd" }],
  },
  {
    href: "/nieuws/2025-01-05-nieuwe-sponsor",
    title: "Nieuwe hoofdsponsor voor seizoen 2025-2026",
    imageUrl: fixtureImage("article-hero-generic", 3),
    imageAlt: "Sponsorcontract",
    date: "5 januari 2025",
    tags: [{ name: "Sponsoring" }],
  },
];

interface HomepageMockProps {
  heroArticles?: typeof mockHeroArticles;
  featuredEvent?: FeaturedEventBandEvent | null;
  newsArticles?: NewsGridArticle[];
  upcomingMatches?: typeof mockUpcomingTwelve;
  sponsors?: Sponsor[];
}

const Homepage = ({
  heroArticles = mockHeroArticles,
  featuredEvent = mockFeaturedEvent,
  newsArticles = mockNewsGridArticles,
  upcomingMatches = mockUpcomingTwelve,
  sponsors = mockSponsorsMixed,
}: HomepageMockProps) => {
  const heroSection: SectionConfig | null =
    heroArticles.length > 0
      ? {
          key: "hero",
          bg: "transparent",
          content: <HomepageHeroCarousel articles={heroArticles} />,
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
    bg: "kcvv-green-dark",
    content: <YouthSection />,
    backdrop: <YouthBackdrop />,
  };

  const webshopSection: SectionConfig = {
    key: "webshop",
    bg: "transparent",
    content: <WebshopBanner />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
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

  return (
    <SectionStack
      reserveFooterSafeArea={false}
      sections={[
        heroSection,
        featuredEventSection,
        bannerSlotASection,
        latestNewsSection,
        upcomingMatchesSection,
        bannerSlotBSection,
        youthSection,
        webshopSection,
        bannerSlotCSection,
        sponsorsSection,
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
          "Full data — 3 hero articles, featured event, 5 news cards, 12 upcoming matches, 3 hoofdsponsors + 10 sponsors. Banner slots A/B/C all populated.",
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
          "Only 2 articles available for the news grid — verifies the 1+4 grid degrades gracefully when sparse.",
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
          "No upcoming event flagged — the `<FeaturedEventBand>` slot drops and the carousel sits directly above bannerSlotA.",
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
          "Empty sponsor list — `<SponsorsBlock>` returns null and the page ends on `<BannerSlot c>`.",
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
