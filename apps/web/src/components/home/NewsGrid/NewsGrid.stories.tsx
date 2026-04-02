// apps/web/src/components/home/NewsGrid/NewsGrid.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsGrid } from "./NewsGrid";

const meta = {
  title: "Features/Homepage/NewsGrid",
  component: NewsGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage news section: 1 featured card (col-span-2) + 2 standard cards. " +
          "Featured slot can hold an article or an upcoming event (#802). " +
          "Data selection logic lives in the homepage — see #818.",
      },
    },
  },
} satisfies Meta<typeof NewsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockArticles = [
  {
    href: "/nieuws/2025-05-05-kampioen",
    title: "Kampioen! 58 punten en titel in eerste provinciale",
    imageUrl: "https://picsum.photos/900/500?random=10",
    imageAlt: "Championship celebration",
    date: "5 mei 2025",
    tags: [{ name: "Clubnieuws" }],
  },
  {
    href: "/nieuws/2026-03-14-spelersvoorstelling",
    title:
      "Spelersvoorstelling seizoen 2025-2026: versterkingen voor nationaal debuut",
    imageUrl: "https://picsum.photos/600/400?random=11",
    imageAlt: "New players",
    date: "14 maart 2026",
    tags: [{ name: "Selectie" }],
  },
  {
    href: "/nieuws/2026-03-10-jeugdtoernooi",
    title: "Jeugdtoernooi 2026: inschrijvingen open voor U9 t/m U15",
    imageUrl: "https://picsum.photos/600/400?random=12",
    imageAlt: "Youth tournament",
    date: "10 maart 2026",
    tags: [{ name: "Jeugd" }],
  },
];

/** Default: 3 articles, first is featured */
export const Default: Story = {
  args: {
    articles: mockArticles,
    title: "Nieuws",
    showViewAll: true,
    viewAllHref: "/nieuws",
  },
};

/** Two articles: featured + 1 standard */
export const TwoArticles: Story = {
  args: {
    articles: mockArticles.slice(0, 2),
    title: "Nieuws",
    showViewAll: true,
  },
};

/** One article: only featured slot rendered */
export const SingleArticle: Story = {
  args: {
    articles: mockArticles.slice(0, 1),
    title: "Nieuws",
    showViewAll: true,
  },
};

/** Featured event fills the wide slot; articles fill the 2 standard slots.
 *  This is the #802 hook — FeaturedEventStub is typed but not yet wired. */
export const WithFeaturedEventStub: Story = {
  args: {
    articles: mockArticles.slice(0, 2),
    featuredEvent: {
      title: "Jeugdtoernooi 2026 — schrijf je nu in!",
      href: "/evenementen/jeugdtoernooi-2026",
      imageUrl: "https://picsum.photos/900/500?random=20",
      imageAlt: "Youth tournament 2026",
      badge: "Evenement",
      date: "18 april 2026",
    },
    title: "Nieuws & evenementen",
    showViewAll: true,
  },
};

/** Cards without cover images — fallback background */
export const WithoutImages: Story = {
  args: {
    articles: mockArticles.map((a) => ({ ...a, imageUrl: null })),
    title: "Nieuws",
    showViewAll: true,
  },
};

/** No "Alle berichten" link */
export const WithoutViewAll: Story = {
  args: {
    articles: mockArticles,
    title: "Nieuws",
    showViewAll: false,
  },
};

/** Mobile viewport */
export const MobileView: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: "mobile1" } },
};
