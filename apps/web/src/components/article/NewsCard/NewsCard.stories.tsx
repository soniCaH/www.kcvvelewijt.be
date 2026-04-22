// apps/web/src/components/article/NewsCard/NewsCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsCard } from "./NewsCard";

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
    imageUrl: "https://picsum.photos/800/500?random=1",
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
    imageUrl: "https://picsum.photos/1200/500?random=2",
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
    imageUrl: "https://picsum.photos/800/500?random=7",
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
    imageUrl: "https://picsum.photos/800/500?random=8",
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
    imageUrl: "https://picsum.photos/800/500?random=9",
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
          imageUrl="https://picsum.photos/800/500?random=10"
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
    imageUrl: "https://picsum.photos/800/500?random=3",
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
    imageUrl: "https://picsum.photos/1200/500?random=4",
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
    imageUrl: "https://picsum.photos/800/500?random=5",
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
    imageUrl: "https://picsum.photos/1200/500?random=6",
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
