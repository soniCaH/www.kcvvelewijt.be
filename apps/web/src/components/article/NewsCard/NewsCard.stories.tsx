// apps/web/src/components/article/NewsCard/NewsCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsCard } from "./NewsCard";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Articles/NewsCard",
  component: NewsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Versatile news card with three variants: dark image-overlay (standard/featured) " +
          "for homepage use, and a light stacked layout (listing) for dense archive grids.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["standard", "featured", "listing"],
    },
    badge: { control: "text" },
    date: { control: "text" },
    imageUrl: { control: "text" },
  },
} satisfies Meta<typeof NewsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    href: "/nieuws/derby-overwinning",
    imageUrl: fixtureImage("article-hero-matchverslag", 0),
    imageAlt: "Derby match",
    badge: "Competitie",
    date: "15 januari 2025",
    variant: "standard",
  },
};

export const Featured: Story = {
  args: {
    title:
      "Spelersvoorstelling seizoen 2025-2026: versterkingen voor nationaal debuut",
    href: "/nieuws/spelersvoorstelling",
    imageUrl: fixtureImage("article-hero-generic", 0),
    imageAlt: "New players announcement",
    badge: "Selectie",
    date: "14 maart 2026",
    variant: "featured",
  },
};

export const Listing: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    href: "/nieuws/derby-overwinning",
    imageUrl: fixtureImage("article-hero-matchverslag", 1),
    imageAlt: "Derby match",
    badge: "Competitie",
    date: "15 januari 2025",
    variant: "listing",
  },
};

export const ListingWithoutImage: Story = {
  args: {
    title: "Nieuwe trainingsschema seizoen 2025-2026 bekendgemaakt",
    href: "/nieuws/trainingsschema",
    badge: "Club",
    date: "12 januari 2025",
    variant: "listing",
  },
};

export const ListingLongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/nieuws/titel",
    imageUrl: fixtureImage("article-hero-generic", 1),
    imageAlt: "Championship celebration",
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "listing",
  },
};

export const ListingGrid: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    href: "/nieuws/derby-overwinning",
    imageUrl: fixtureImage("article-hero-matchverslag", 2),
    imageAlt: "Derby match",
    badge: "Competitie",
    date: "15 januari 2025",
    variant: "listing",
  },
  decorators: [
    (Story) => (
      <div className="grid max-w-5xl grid-cols-3 gap-6">
        <Story />
        <NewsCard
          title="Spelersvoorstelling seizoen 2025-2026"
          href="/nieuws/spelersvoorstelling"
          imageUrl={fixtureImage("article-hero-jeugd", 0)}
          badge="Selectie"
          date="14 maart 2026"
          variant="listing"
        />
        <NewsCard
          title="Nieuwe trainingsschema bekendgemaakt"
          href="/nieuws/trainingsschema"
          badge="Club"
          date="12 januari 2025"
          variant="listing"
        />
      </div>
    ),
  ],
};

export const WithoutImage: Story = {
  args: {
    title: "Nieuwe trainingsschema seizoen 2025-2026 bekendgemaakt",
    href: "/nieuws/trainingsschema",
    badge: "Club",
    date: "12 januari 2025",
    variant: "standard",
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/nieuws/titel",
    imageUrl: fixtureImage("article-hero-generic", 2),
    imageAlt: "Championship celebration",
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "standard",
  },
};

export const FeaturedLongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/nieuws/titel",
    imageUrl: fixtureImage("article-hero-generic", 1),
    imageAlt: "Championship celebration",
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "featured",
  },
};

export const NoBadge: Story = {
  args: {
    title: "Clubbericht zonder categorie",
    href: "/nieuws/bericht",
    imageUrl: fixtureImage("article-hero-generic", 0),
    imageAlt: "Club news",
    date: "10 januari 2025",
    variant: "standard",
  },
};

export const FeaturedEvent: Story = {
  args: {
    variant: "featured",
    title: "Sponsorfeest KCVV Elewijt 2026",
    href: "https://facebook.com/event",
    badge: "EVENEMENT",
    eventDate: "26 apr",
    eventTime: "19:00",
    countdown: "over 33 dagen",
    isExternal: true,
    imageUrl: fixtureImage("event-cover", 0),
  },
};

export const FeaturedEventNoImage: Story = {
  args: {
    variant: "featured",
    title: "Sponsorfeest KCVV Elewijt 2026",
    badge: "EVENEMENT",
    eventDate: "26 apr",
    eventTime: "19:00",
    countdown: "over 33 dagen",
  },
};

export const MobileView: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: "mobile1" } },
};

// ===== Phase 4 / NewsGrid prop additions =====
//
// The four stories below exist to capture VR baselines for the new
// `aspectRatio` and `rotation` props introduced for `<NewsGrid>` (#1672).
// They are vr-tagged individually rather than via meta.tags so the existing
// 14 legacy NewsCard stories don't get baselined as a side effect.

// Local fixture URLs are deterministic across viewports and runs, so VR
// baselines are stable regardless of upstream width Next.js Image requests.
const phase4SharedArgs = {
  title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
  href: "/nieuws/derby-overwinning",
  imageUrl: fixtureImage("article-hero-matchverslag", 0),
  imageAlt: "Derby match",
  badge: "Competitie",
  date: "15 januari 2025",
  variant: "standard" as const,
};

export const Lead: Story = {
  args: {
    ...phase4SharedArgs,
    variant: "featured",
    title: "Spelersvoorstelling seizoen 2025-2026: versterkingen voor debuut",
    aspectRatio: "landscape-16-9",
    rotation: "a",
  },
  tags: ["vr"],
};

export const SquareAspect: Story = {
  args: { ...phase4SharedArgs, aspectRatio: "square" },
  tags: ["vr"],
};

export const PortraitAspect: Story = {
  args: { ...phase4SharedArgs, aspectRatio: "portrait-3-4" },
  tags: ["vr"],
};

// All four rotation slots in one story so VR captures the cycle as a unit.
// Matches the `[a, b, c, d]` pool consumed by `<NewsGrid>` (#1672) per the
// locked NewsGrid spec.
export const RotationCycle: Story = {
  args: phase4SharedArgs,
  tags: ["vr"],
  render: () => (
    <div className="grid max-w-5xl grid-cols-2 gap-12 p-12">
      {(["a", "b", "c", "d"] as const).map((r, i) => (
        <NewsCard
          key={r}
          {...phase4SharedArgs}
          rotation={r}
          aspectRatio="landscape-16-9"
          imageUrl={fixtureImage("article-hero-matchverslag", i)}
        />
      ))}
    </div>
  ),
};
