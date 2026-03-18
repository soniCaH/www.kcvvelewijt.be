import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeaturedArticles } from "./FeaturedArticles";
import { LatestNews } from "./LatestNews";
import { MatchWidget } from "./MatchWidget";
import { BannerSlot } from "./BannerSlot";
import { MatchesSliderSection } from "./MatchesSliderSection";
import { YouthSection } from "./YouthSection";
import { PageFooter } from "@/components/layout/PageFooter";
import { Sponsors } from "@/components/sponsors/Sponsors";
import { mockSponsors } from "@/components/sponsors/Sponsors.mocks";
import { SectionHeader } from "@/components/design-system";
import { mockUpcomingMatch } from "./MatchWidget/MatchWidget.mocks";
import { mockMatches } from "./UpcomingMatches/UpcomingMatches.mocks";

const meta: Meta = {
  title: "Pages/Homepage",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockFeaturedArticles = [
  {
    href: "/news/2025-06-20-definitieve-reeksindeling-3e-nationale-bis",
    title: "Definitieve reeksindeling 3e Nationale BIS",
    description:
      "De reeksindeling voor het seizoen 2025-2026 in 3e Nationale BIS is bekend. KCVV Elewijt komt uit in reeks A.",
    imageUrl: "https://placehold.co/800x600/4acf52/fff?text=Stadion",
    imageAlt: "Stadion KCVV Elewijt",
    date: "20 juni 2025",
    tags: [{ name: "Ploeg" }, { name: "Competitie" }],
  },
  {
    href: "/news/2025-03-25-overlijden-jean-lepage",
    title: "Overlijden Jean Lepage",
    description:
      "Met diepe droefheid hebben we vernomen dat Jean Lepage op 82-jarige leeftijd is overleden. Jean was jarenlang een trouwe supporter en vrijwilliger van KCVV Elewijt.",
    imageUrl: "https://placehold.co/800x600/1e2024/fff?text=In+Memoriam",
    imageAlt: "Jean Lepage tribute",
    date: "25 maart 2025",
    tags: [{ name: "In Memoriam" }],
  },
  {
    href: "/news/2025-01-15-winterstage-spanje",
    title: "Winterstage in Spanje: voorbereiding op play-offs",
    description:
      "De A-ploeg vertrekt volgende week naar Spanje voor een intensieve winterstage. Coach Deferm wil zijn spelers optimaal voorbereiden op de cruciale play-off wedstrijden.",
    imageUrl: "https://placehold.co/800x600/4acf52/fff?text=Training",
    imageAlt: "Training KCVV Elewijt",
    date: "15 januari 2025",
    tags: [{ name: "Ploeg" }, { name: "Training" }, { name: "Stage" }],
  },
];

const mockLatestNews = [
  {
    href: "/news/2025-01-10-jeugdwerking-uitbreiding",
    title: "Jeugdwerking breidt uit met nieuwe trainers",
    imageUrl: "https://placehold.co/600x400/ffd700/000?text=Jeugd",
    imageAlt: "Jeugdtraining",
    date: "10 januari 2025",
    tags: [{ name: "Jeugd" }],
  },
  {
    href: "/news/2025-01-05-nieuwe-sponsor",
    title: "Nieuwe hoofdsponsor voor seizoen 2025-2026",
    imageUrl: "https://placehold.co/600x400/4acf52/fff?text=Sponsor",
    imageAlt: "Sponsorcontract ondertekening",
    date: "5 januari 2025",
    tags: [{ name: "Sponsoring" }],
  },
  {
    href: "/news/2024-12-20-kersttoernooi",
    title: "Kersttoernooi groot succes",
    imageUrl: "https://placehold.co/600x400/ff0000/fff?text=Kerst",
    imageAlt: "Kersttoernooi",
    date: "20 december 2024",
    tags: [{ name: "Evenement" }, { name: "Jeugd" }],
  },
  {
    href: "/news/2024-12-15-algemene-vergadering",
    title: "Algemene vergadering uitnodiging",
    imageUrl: "https://placehold.co/600x400/4acf52/fff?text=Vergadering",
    imageAlt: "Algemene vergadering",
    date: "15 december 2024",
    tags: [{ name: "Bestuur" }],
  },
  {
    href: "/news/2024-12-10-spelersvoorstelling",
    title: "Spelersvoorstelling seizoen 2024-2025",
    imageUrl: "https://placehold.co/600x400/4acf52/fff?text=Spelers",
    imageAlt: "Spelersvoorstelling",
    date: "10 december 2024",
    tags: [{ name: "Ploeg" }, { name: "Evenement" }],
  },
  {
    href: "/news/2024-12-05-clubkampioenschap",
    title: "Clubkampioenschap jeugd 2024",
    imageUrl: "https://placehold.co/600x400/ffd700/000?text=Kampioen",
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
  image: "https://placehold.co/1280x213/1e2024/4acf52?text=Banner+Slot",
  alt: "Mock banner",
  href: "https://example.com",
};

/** SponsorsSection is an async server component — inline here with mock data */
const SponsorsSectionMock = () => (
  <section className="-mt-0.5 bg-gray-100 py-20">
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeader
        title="Sponsors"
        linkText="Word sponsor"
        linkHref="/sponsors"
      />
      <Sponsors
        sponsors={mockSponsors}
        title=""
        description=""
        showViewAll={false}
        variant="light"
        columns={5}
        className="py-0"
      />
    </div>
  </section>
);

/**
 * Complete v3 homepage: hero → match widget → banner A → news → banner B →
 * match slider → youth section → banner C → sponsors → footer
 */
export const Default: Story = {
  render: () => (
    <>
      <FeaturedArticles
        articles={mockFeaturedArticles}
        autoRotate={true}
        autoRotateInterval={5000}
      />
      <MatchWidget match={mockUpcomingMatch} teamLabel="A-Ploeg" />
      <BannerSlot {...mockBanner} />
      <LatestNews
        articles={mockLatestNews}
        title="Laatste nieuws"
        showViewAll={true}
        viewAllHref="/news"
      />
      <BannerSlot {...mockBanner} />
      <MatchesSliderSection
        matches={mockSliderMatches}
        highlightTeamId={1235}
      />
      <YouthSection />
      <BannerSlot {...mockBanner} />
      <SponsorsSectionMock />
      <PageFooter />
    </>
  ),
};

/**
 * v3 homepage with featured event in the news section
 */
export const WithFeaturedEvent: Story = {
  render: () => (
    <>
      <FeaturedArticles
        articles={mockFeaturedArticles}
        autoRotate={true}
        autoRotateInterval={5000}
      />
      <MatchWidget match={mockUpcomingMatch} teamLabel="A-Ploeg" />
      <BannerSlot {...mockBanner} />
      <LatestNews
        articles={mockLatestNews.slice(0, 2)}
        featuredEvent={{
          title: "Jeugdtoernooi 2026 — schrijf je nu in!",
          imageUrl: "https://placehold.co/800x600/008755/fff?text=Toernooi",
          imageAlt: "Jeugdtoernooi KCVV",
          badge: "EVENEMENT",
          date: "26 apr",
          time: "10:00–17:00",
          countdown: "over 40 dagen",
          isExternal: false,
        }}
        title="Laatste nieuws"
        showViewAll={true}
        viewAllHref="/news"
      />
      <BannerSlot {...mockBanner} />
      <MatchesSliderSection
        matches={mockSliderMatches}
        highlightTeamId={1235}
      />
      <YouthSection />
      <BannerSlot {...mockBanner} />
      <SponsorsSectionMock />
      <PageFooter />
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
      <FeaturedArticles articles={mockFeaturedArticles} autoRotate={false} />
      <MatchWidget match={mockUpcomingMatch} teamLabel="A-Ploeg" />
      <BannerSlot {...mockBanner} />
      <LatestNews
        articles={mockLatestNews}
        title="Laatste nieuws"
        showViewAll={true}
        viewAllHref="/news"
      />
      <BannerSlot {...mockBanner} />
      <MatchesSliderSection
        matches={mockSliderMatches}
        highlightTeamId={1235}
      />
      <YouthSection />
      <BannerSlot {...mockBanner} />
      <SponsorsSectionMock />
      <PageFooter />
    </>
  ),
};
