// apps/web/src/components/home/LatestNews/NewsCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsCard } from "./NewsCard";

const meta = {
  title: "Features/News/NewsCard",
  component: NewsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Full-bleed image-overlay card for news articles and future events. " +
          "Reusable across any content type — passes title, href, badge, date as generic props.",
      },
    },
  },
  argTypes: {
    variant: { control: "radio", options: ["standard", "featured"] },
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
    href: "/news/derby-overwinning",
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
    href: "/news/spelersvoorstelling",
    imageUrl: "https://picsum.photos/1200/500?random=2",
    imageAlt: "New players announcement",
    badge: "Selectie",
    date: "14 maart 2026",
    variant: "featured",
  },
};

export const WithoutImage: Story = {
  args: {
    title: "Nieuwe trainingsschema seizoen 2025-2026 bekendgemaakt",
    href: "/news/trainingsschema",
    badge: "Club",
    date: "12 januari 2025",
    variant: "standard",
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/news/titel",
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
    href: "/news/titel",
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
    href: "/news/bericht",
    imageUrl: "https://picsum.photos/800/500?random=5",
    imageAlt: "Club news",
    date: "10 januari 2025",
    variant: "standard",
  },
};

export const MobileView: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: "mobile1" } },
};
