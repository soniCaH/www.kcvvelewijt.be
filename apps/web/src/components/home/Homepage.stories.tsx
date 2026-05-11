import type { Meta, StoryObj } from "@storybook/nextjs-vite";
// Phase 4.D.1 (#1680) — these imports reach into `./_legacy/` because the
// `Pages/Homepage` story still composes the pre-redesign layout. It is
// replaced wholesale in #1681 with the new section ordering; until then
// the legacy imports keep this fixture rendering.
import { FeaturedArticles } from "./_legacy/FeaturedArticles";
import { NewsGrid } from "./NewsGrid";
import { MatchWidget } from "./_legacy/MatchWidget";
import { BannerSlot } from "./BannerSlot";
import { MatchesSliderSection } from "./_legacy/MatchesSliderSection";
import { YouthSection, YouthBackdrop } from "./YouthSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Sponsors } from "@/components/sponsors/Sponsors";
import { mockSponsors } from "@/components/sponsors/Sponsors.mocks";
import { SectionStack, SectionHeader } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import { mockUpcomingMatch } from "./_legacy/MatchWidget/MatchWidget.mocks";
import { mockMatches } from "@/components/match/match.mocks";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Pages/Homepage",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFeaturedArticles = [
  {
    href: "/nieuws/2025-06-20-definitieve-reeksindeling-3e-nationale-bis",
    title: "Definitieve reeksindeling 3e Nationale BIS",
    description:
      "De reeksindeling voor het seizoen 2025-2026 in 3e Nationale BIS is bekend. KCVV Elewijt komt uit in reeks A.",
    imageUrl: fixtureImage("stadium-hero", 0),
    imageAlt: "Stadion KCVV Elewijt",
    date: "20 juni 2025",
    tags: [{ name: "Ploeg" }, { name: "Competitie" }],
  },
  {
    href: "/nieuws/2025-03-25-overlijden-jean-lepage",
    title: "Overlijden Jean Lepage",
    description:
      "Met diepe droefheid hebben we vernomen dat Jean Lepage op 82-jarige leeftijd is overleden. Jean was jarenlang een trouwe supporter en vrijwilliger van KCVV Elewijt.",
    imageUrl: fixtureImage("article-hero-generic", 0),
    imageAlt: "Jean Lepage tribute",
    date: "25 maart 2025",
    tags: [{ name: "In Memoriam" }],
  },
  {
    href: "/nieuws/2025-01-15-winterstage-spanje",
    title: "Winterstage in Spanje: voorbereiding op play-offs",
    description:
      "De A-ploeg vertrekt volgende week naar Spanje voor een intensieve winterstage. Coach Deferm wil zijn spelers optimaal voorbereiden op de cruciale play-off wedstrijden.",
    imageUrl: fixtureImage("training", 0),
    imageAlt: "Training KCVV Elewijt",
    date: "15 januari 2025",
    tags: [{ name: "Ploeg" }, { name: "Training" }, { name: "Stage" }],
  },
];

const mockLatestNews = [
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
    imageUrl: fixtureImage("article-hero-generic", 1),
    imageAlt: "Sponsorcontract ondertekening",
    date: "5 januari 2025",
    tags: [{ name: "Sponsoring" }],
  },
  {
    href: "/nieuws/2024-12-20-kersttoernooi",
    title: "Kersttoernooi groot succes",
    imageUrl: fixtureImage("article-hero-evenement", 0),
    imageAlt: "Kersttoernooi",
    date: "20 december 2024",
    tags: [{ name: "Evenement" }, { name: "Jeugd" }],
  },
  {
    href: "/nieuws/2024-12-15-algemene-vergadering",
    title: "Algemene vergadering uitnodiging",
    imageUrl: fixtureImage("article-hero-generic", 2),
    imageAlt: "Algemene vergadering",
    date: "15 december 2024",
    tags: [{ name: "Bestuur" }],
  },
  {
    href: "/nieuws/2024-12-10-spelersvoorstelling",
    title: "Spelersvoorstelling seizoen 2024-2025",
    imageUrl: fixtureImage("team-group", 0),
    imageAlt: "Spelersvoorstelling",
    date: "10 december 2024",
    tags: [{ name: "Ploeg" }, { name: "Evenement" }],
  },
  {
    href: "/nieuws/2024-12-05-clubkampioenschap",
    title: "Clubkampioenschap jeugd 2024",
    imageUrl: fixtureImage("article-hero-jeugd", 1),
    imageAlt: "Clubkampioenschap",
    date: "5 december 2024",
    tags: [{ name: "Jeugd" }, { name: "Kampioenschap" }],
  },
];

const mockSliderMatches = mockMatches.mixed.map((m, i) => ({
  ...m,
  teamLabel: i < 3 ? "A-Ploeg" : "U17",
}));

const mockBanner = {
  image: fixtureImage("sponsor-logo", 0),
  alt: "Mock banner",
  href: "https://example.com",
};

/** SponsorsSection is async — inline mock with same markup */
const SponsorsSectionContent = () => (
  <section className="py-6">
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <SectionHeader
        title="Onze sponsors"
        linkText="Alle partners"
        linkHref="/sponsors"
        variant="dark"
      />
      <Sponsors
        sponsors={mockSponsors}
        title=""
        description=""
        showViewAll={false}
        variant="dark"
        columns={5}
        className="py-0"
      />
    </div>
  </section>
);

function buildSections(autoRotate = true): SectionConfig[] {
  return [
    {
      key: "hero",
      bg: "kcvv-black",
      content: (
        <FeaturedArticles
          articles={mockFeaturedArticles}
          autoRotate={autoRotate}
          autoRotateInterval={5000}
        />
      ),
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: {
        type: "double-diagonal",
        direction: "right",
        via: "white",
        overlap: "half",
      },
    },
    {
      key: "match-widget",
      bg: "kcvv-green-dark",
      content: <MatchWidget match={mockUpcomingMatch} teamLabel="A-Ploeg" />,
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "banner-a",
      bg: "gray-100",
      content: <BannerSlot {...mockBanner} />,
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "latest-news",
      bg: "gray-100",
      content: (
        <NewsGrid
          articles={mockLatestNews}
          title="Laatste nieuws"
          showViewAll
          viewAllHref="/nieuws"
        />
      ),
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "banner-b",
      bg: "gray-100",
      content: <BannerSlot {...mockBanner} />,
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "matches-slider",
      bg: "kcvv-black",
      content: (
        <MatchesSliderSection
          matches={mockSliderMatches}
          highlightTeamId={1235}
        />
      ),
      transition: { type: "diagonal", direction: "right" },
    },
    {
      key: "youth",
      bg: "kcvv-green-dark",
      content: <YouthSection />,
      backdrop: <YouthBackdrop />,
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "banner-c",
      bg: "gray-100",
      content: <BannerSlot {...mockBanner} />,
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: { type: "diagonal", direction: "right" },
    },
    {
      key: "sponsors",
      bg: "kcvv-green-dark",
      content: <SponsorsSectionContent />,
      paddingTop: "pt-8",
      paddingBottom: "pb-8",
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "pre-footer",
      bg: "gray-100",
      content: <></>,
      paddingTop: "pt-12",
      paddingBottom: "pb-12",
    },
  ];
}

/**
 * Complete v3 homepage: hero → match widget → banner A → news → banner B →
 * match slider → youth section → banner C → sponsors → footer
 */
export const Default: Story = {
  render: () => (
    <>
      <SectionStack sections={buildSections()} />
      <SiteFooter />
    </>
  ),
};

/**
 * Mobile viewport — single-column layout
 */
export const MobileViewport: Story = {
  ...Default,
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};

/**
 * Homepage without auto-rotation
 */
export const NoAutoRotation: Story = {
  render: () => (
    <>
      <SectionStack sections={buildSections(false)} />
      <SiteFooter />
    </>
  ),
};
