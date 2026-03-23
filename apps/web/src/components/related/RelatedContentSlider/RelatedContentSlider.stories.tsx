import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RelatedContentSlider } from "./RelatedContentSlider";
import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
  RelatedContentItem,
} from "../types";

const articles: RelatedArticleItem[] = [
  {
    type: "article",
    id: "art-1",
    title: "Interview met de kapitein",
    slug: "interview-kapitein",
    imageUrl: "https://picsum.photos/seed/art1/512/288",
    date: "2026-03-20T10:00:00Z",
    excerpt: "Een exclusief interview.",
  },
  {
    type: "article",
    id: "art-2",
    title: "Wedstrijdverslag: overwinning in de derby",
    slug: "wedstrijdverslag-derby",
    imageUrl: "https://picsum.photos/seed/art2/512/288",
    date: "2026-03-18T10:00:00Z",
    excerpt: "Het verslag van de gewonnen derby.",
  },
];

const page: RelatedPageItem = {
  type: "page",
  id: "page-1",
  title: "Over de club",
  slug: "over-de-club",
  imageUrl: "https://picsum.photos/seed/page1/512/288",
  excerpt: "Alles over KCVV Elewijt.",
};

const players: RelatedPlayerItem[] = [
  {
    type: "player",
    id: "player-1",
    firstName: "Jan",
    lastName: "Janssens",
    position: "Aanvaller",
    imageUrl: "https://picsum.photos/seed/player1/512/288",
    psdId: "12345",
  },
  {
    type: "player",
    id: "player-2",
    firstName: "Pieter",
    lastName: "De Smet",
    position: "Middenvelder",
    imageUrl: "https://picsum.photos/seed/player2/512/288",
    psdId: "67890",
  },
];

const team: RelatedTeamItem = {
  type: "team",
  id: "team-1",
  name: "A-ploeg",
  slug: "a-ploeg",
  imageUrl: "https://picsum.photos/seed/team1/512/288",
  tagline: "Eerste ploeg van KCVV Elewijt",
};

const staff: RelatedStaffItem = {
  type: "staff",
  id: "staff-1",
  firstName: "Piet",
  lastName: "Pieters",
  role: "Hoofdtrainer",
  imageUrl: "https://picsum.photos/seed/staff1/512/288",
};

const mixedItems: RelatedContentItem[] = [
  ...articles,
  page,
  ...players,
  team,
  staff,
];

const meta = {
  title: "Features/Related/RelatedContentSlider",
  component: RelatedContentSlider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Horizontal slider for related content. Composes HorizontalSlider + RelatedContentCard. " +
          'Renders a "Gerelateerd" section heading. Automatically sorts items by type: ' +
          "articles/pages → players → staff → teams.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RelatedContentSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mixed content from multiple types, automatically sorted */
export const MixedContent: Story = {
  args: { items: mixedItems },
};

/** Single type — articles only */
export const ArticlesOnly: Story = {
  args: { items: articles },
};

/** Single type — players only */
export const PlayersOnly: Story = {
  args: { items: players },
};

/** Empty state — renders nothing */
export const Empty: Story = {
  args: { items: [] },
};
