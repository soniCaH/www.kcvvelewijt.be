import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RelatedContentCard } from "./RelatedContentCard";
import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

const articleItem: RelatedArticleItem = {
  type: "article",
  id: "art-1",
  title: "Interview met de kapitein over het seizoen",
  slug: "interview-kapitein",
  imageUrl: "https://picsum.photos/seed/article/512/288",
  date: "2026-03-20T10:00:00Z",
  excerpt: "Een exclusief interview met onze kapitein over de ambities.",
};

const pageItem: RelatedPageItem = {
  type: "page",
  id: "page-1",
  title: "Over de club",
  slug: "over-de-club",
  imageUrl: "https://picsum.photos/seed/page/512/288",
  excerpt: "Alles wat je moet weten over KCVV Elewijt.",
};

const playerItem: RelatedPlayerItem = {
  type: "player",
  id: "player-1",
  firstName: "Jan",
  lastName: "Janssens",
  position: "Aanvaller",
  imageUrl: "https://picsum.photos/seed/player/512/288",
  psdId: "12345",
};

const teamItem: RelatedTeamItem = {
  type: "team",
  id: "team-1",
  name: "A-ploeg",
  slug: "a-ploeg",
  imageUrl: "https://picsum.photos/seed/team/512/288",
  tagline: "Eerste ploeg van KCVV Elewijt",
};

const staffItem: RelatedStaffItem = {
  type: "staff",
  id: "staff-1",
  firstName: "Piet",
  lastName: "Pieters",
  role: "Hoofdtrainer",
  imageUrl: "https://picsum.photos/seed/staff/512/288",
};

const meta = {
  title: "Features/Related/RelatedContentCard",
  component: RelatedContentCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Unified card for rendering related content across all content types. " +
          "Five variants: article, page, player, team, staff — all with consistent dimensions.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RelatedContentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Article variant with image, title, date, and excerpt */
export const Article: Story = {
  args: { item: articleItem },
};

/** Page variant with title and excerpt */
export const Page: Story = {
  args: { item: pageItem },
};

/** Player variant with photo, name, and position */
export const Player: Story = {
  args: { item: playerItem },
};

/** Team variant with photo, name, and tagline */
export const Team: Story = {
  args: { item: teamItem },
};

/** Staff variant with photo, name, and role (no link) */
export const Staff: Story = {
  args: { item: staffItem },
};

/** All variants side-by-side to verify consistent dimensions */
export const AllVariants: Story = {
  args: { item: articleItem },
  decorators: [
    () => (
      <div className="flex gap-4 items-start">
        <RelatedContentCard item={articleItem} />
        <RelatedContentCard item={pageItem} />
        <RelatedContentCard item={playerItem} />
        <RelatedContentCard item={teamItem} />
        <RelatedContentCard item={staffItem} />
      </div>
    ),
  ],
};

/** Card without an image */
export const NoImage: Story = {
  args: {
    item: { ...articleItem, imageUrl: null },
  },
};
