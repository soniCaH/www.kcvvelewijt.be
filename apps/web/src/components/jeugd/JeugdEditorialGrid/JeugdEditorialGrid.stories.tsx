import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JeugdEditorialGrid } from "./JeugdEditorialGrid";
import type { ArticleVM } from "@/lib/repositories/article.repository";

// Local committed asset served by Storybook `staticDirs` (deterministic VR).
const COVER = "/images/youth-trainers.jpg";

function makeArticle(
  overrides: Partial<ArticleVM> & { id: string },
): ArticleVM {
  return {
    title: `Jeugd artikel ${overrides.id}`,
    slug: `jeugd-artikel-${overrides.id}`,
    publishedAt: "2026-03-20",
    featured: false,
    coverImageUrl: COVER,
    tags: ["Jeugd"],
    articleType: null,
    subjects: null,
    firstTransferFact: null,
    firstEventFact: null,
    ...overrides,
  };
}

const threeArticles: ArticleVM[] = [
  makeArticle({
    id: "1",
    title: "U15 wint in stijl tegen Wolvertem",
    tags: ["Bovenbouw", "Jeugd"],
  }),
  makeArticle({ id: "2", title: "Nieuwe keeperstrainer voor de jeugd" }),
  makeArticle({ id: "3", title: "Inschrijvingen zomerstage geopend" }),
];

const meta = {
  title: "Features/Jeugd/JeugdEditorialGrid",
  component: JeugdEditorialGrid,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The /jeugd nav hub (7j3): a uniform grid of 16:9 image-top `<EditorialHubCard>`s. News slots bubble the latest Jeugd articles (newsprint-colour photo, jersey-deep tag); six nav cards stay pinned (jersey-deep glyph panel, cream tag). With no articles the hub collapses to the pinned nav cards.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JeugdEditorialGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full hub: 3 news cards bubbled between the pinned nav cards. */
export const WithArticles: Story = {
  args: {
    articles: threeArticles,
  },
};

/** No Jeugd articles — the hub collapses to the six pinned nav cards. */
export const NoArticles: Story = {
  args: {
    articles: [],
  },
};

/** Only 1 article — one news slot filled, the rest of the slots bubble up. */
export const OneArticle: Story = {
  args: {
    articles: [threeArticles[0]],
  },
};

/** 2 articles — two news slots filled, third omitted. */
export const TwoArticles: Story = {
  args: {
    articles: threeArticles.slice(0, 2),
  },
};
