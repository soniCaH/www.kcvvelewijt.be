import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RelatedContentSection } from "./RelatedContentSection";
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
    source: "editorial",
    id: "art-1",
    title:
      "Wedstrijdverslag: KCVV pakt drie punten in derby tegen Boortmeerbeek",
    slug: "verslag-derby",
    imageUrl: "https://picsum.photos/seed/derby/1200/800",
    date: "2026-04-12T15:00:00Z",
    excerpt:
      "Een doelpuntenrijke namiddag in Elewijt levert KCVV de derde overwinning op rij op. De jonge spits scoorde twee keer en bezorgde het thuispubliek een onvergetelijke middag.",
  },
  {
    type: "article",
    source: "editorial",
    id: "art-2",
    title: "Interview met de kapitein voor de bekerfinale",
    slug: "interview-kapitein",
    imageUrl: "https://picsum.photos/seed/captain/1200/800",
    date: "2026-04-08T09:00:00Z",
    excerpt:
      "De kapitein blikt vooruit op de belangrijkste match van het seizoen.",
  },
  {
    type: "article",
    source: "ai",
    id: "art-3",
    title: "Herfststage 2026: inschrijvingen open",
    slug: "herfststage-2026",
    imageUrl: "https://picsum.photos/seed/stage/1200/800",
    date: "2026-04-01T10:00:00Z",
    excerpt: null,
  },
  {
    type: "article",
    source: "ai",
    id: "art-4",
    title: "Word trainer bij de plezantste compagnie",
    slug: "word-trainer",
    imageUrl: "https://picsum.photos/seed/coach/1200/800",
    date: "2026-03-28T10:00:00Z",
    excerpt: null,
  },
  {
    type: "article",
    source: "ai",
    id: "art-5",
    title: "Nieuwe kantineopening na de zomervakantie",
    slug: "kantine-opening",
    imageUrl: "https://picsum.photos/seed/canteen/1200/800",
    date: "2026-03-22T10:00:00Z",
    excerpt: null,
  },
];

const pages: RelatedPageItem[] = [
  {
    type: "page",
    source: "ai",
    id: "page-1",
    title: "Praktische informatie voor nieuwe spelers",
    slug: "aansluiten",
    imageUrl: "https://picsum.photos/seed/info/1200/800",
    excerpt: "Alles over inschrijven, lidgeld en uitrusting.",
  },
];

const players: RelatedPlayerItem[] = [
  {
    type: "player",
    source: "reference",
    id: "p-1",
    firstName: "Lirian",
    lastName: "Zumberaj",
    position: "Aanvaller",
    imageUrl: "https://picsum.photos/seed/lirian/200/200",
    psdId: "12345",
  },
  {
    type: "player",
    source: "reference",
    id: "p-2",
    firstName: "Jan",
    lastName: "Janssens",
    position: "Middenvelder",
    imageUrl: "https://picsum.photos/seed/jan/200/200",
    psdId: "23456",
  },
  {
    type: "player",
    source: "reference",
    id: "p-3",
    firstName: "Pieter",
    lastName: "De Smet",
    position: "Verdediger",
    imageUrl: null,
    psdId: "34567",
  },
];

const team: RelatedTeamItem = {
  type: "team",
  source: "reference",
  id: "t-1",
  name: "Eerste Elftal A",
  slug: "eerste-elftal-a",
  imageUrl: "https://picsum.photos/seed/team-a/300/200",
  tagline: "3e Nationale A",
};

const staff: RelatedStaffItem = {
  type: "staff",
  source: "reference",
  id: "s-1",
  firstName: "Marc",
  lastName: "Vermeulen",
  role: "Hoofdtrainer",
  imageUrl: "https://picsum.photos/seed/marc/200/200",
};

const meta = {
  title: "Features/Related/RelatedContentSection",
  component: RelatedContentSection,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Composite section rendered under article body. Two visually distinct sub-sections: " +
          '"In dit artikel" (entity strip — players/teams/staff) above, ' +
          '"Gerelateerd" (2:1 magazine grid + optional overflow row — articles/pages/events) below. ' +
          "Each sub-section hides itself when empty. Both share the article container width (max-w-inner-lg).",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    pageType: "article",
    pageSlug: "verslag-derby",
  },
  decorators: [
    (Story) => (
      <div className="bg-kcvv-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RelatedContentSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const allItems: RelatedContentItem[] = [
  ...articles,
  ...pages,
  ...players,
  team,
  staff,
];

export const FullMix: Story = {
  args: {
    items: allItems,
  },
};

export const ContentOnly: Story = {
  args: {
    items: [...articles, ...pages],
  },
};

export const EntitiesOnly: Story = {
  args: {
    items: [...players, team, staff],
  },
};

export const ThreeArticlesNoOverflow: Story = {
  args: {
    items: articles.slice(0, 3),
  },
};

export const SingleArticle: Story = {
  args: {
    items: [articles[0]!],
  },
};

export const TypicalArticleFooter: Story = {
  args: {
    items: [
      articles[0]!,
      articles[1]!,
      articles[2]!,
      pages[0]!,
      players[0]!,
      players[1]!,
      team,
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Typical real-world mix: 3 related articles, 1 related page, 2 mentioned players, 1 mentioned team. " +
          "Entity strip on top, magazine grid below with no overflow row needed.",
      },
    },
  },
};

export const Empty: Story = {
  args: { items: [] },
};
