import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JeugdEditorialGrid } from "./JeugdEditorialGrid";
import type { ArticleVM } from "@/lib/repositories/article.repository";

function makeArticle(
  overrides: Partial<ArticleVM> & { id: string },
): ArticleVM {
  return {
    title: `Jeugd artikel ${overrides.id}`,
    slug: `jeugd-artikel-${overrides.id}`,
    publishedAt: "2026-03-20",
    featured: false,
    coverImageUrl: null,
    tags: ["Jeugd"],
    ...overrides,
  };
}

const threeArticles: ArticleVM[] = [
  makeArticle({
    id: "1",
    title: "U15 wint in stijl tegen Wolvertem",
    tags: ["Jeugd", "Bovenbouw"],
  }),
  makeArticle({ id: "2", title: "Nieuwe keeperstrainer voor de jeugd" }),
  makeArticle({ id: "3", title: "Inschrijvingen zomerstage geopend" }),
];

const meta = {
  title: "Features/Jeugd/JeugdEditorialGrid",
  component: JeugdEditorialGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "9-item editorial grid for the /jeugd landing page. Interleaves up to 3 dynamic article cards with 6 hardcoded navigation cards in an asymmetric 12-column layout.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-gray-100 py-20">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JeugdEditorialGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full grid with 3 articles interleaved between navigation cards.
 */
export const WithArticles: Story = {
  args: {
    articles: threeArticles,
  },
};

/**
 * Fallback layout when no jeugd articles are available — shows a 3x2 nav card grid.
 */
export const NoArticles: Story = {
  args: {
    articles: [],
  },
};

/**
 * Partial layout with only 1 article — featured slot filled, other article slots omitted.
 */
export const OneArticle: Story = {
  args: {
    articles: [threeArticles[0]],
  },
};

/**
 * Partial layout with 2 articles — featured + second slot filled, third omitted.
 */
export const TwoArticles: Story = {
  args: {
    articles: threeArticles.slice(0, 2),
  },
};
