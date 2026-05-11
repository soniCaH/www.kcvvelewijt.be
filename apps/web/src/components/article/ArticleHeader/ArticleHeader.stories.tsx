/**
 * ArticleHeader Component Stories
 * Editorial design: full-bleed hero with gradient, category badge, and inline metadata
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleMetadata } from "../ArticleMetadata/ArticleMetadata";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Articles/ArticleHeader",
  component: ArticleHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Article header with full-bleed hero image, editorial gradient overlay, green accent line, category badge, and title matching homepage hero typography.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    imageUrl: { control: "text" },
    imageAlt: { control: "text" },
    category: { control: "text" },
    date: { control: "text" },
    author: { control: "text" },
  },
} satisfies Meta<typeof ArticleHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default article header with all metadata
 */
export const Default: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning tegen rivaal",
    imageUrl: fixtureImage("article-hero-matchverslag", 0),
    imageAlt: "Match photo",
    category: "Eerste ploeg",
    date: "15 maart 2026",
    author: "KCVV Elewijt",
  },
};

/**
 * Full page context — hero + metadata bar + body content
 */
export const WithContent: Story = {
  args: {
    title: "Nieuwe transfers aangekondigd voor komend seizoen",
    imageUrl: fixtureImage("article-hero-transfer", 0),
    imageAlt: "New players",
    category: "Transfers",
    date: "15 maart 2026",
    author: "KCVV Elewijt",
  },
  render: (args) => (
    <div className="min-h-screen bg-white">
      <ArticleHeader {...args} />
      <ArticleMetadata
        author="KCVV Elewijt"
        date="15 maart 2026"
        readingTime="3 min lezen"
        shareConfig={{
          url: "https://kcvvelewijt.be/nieuws/transfers",
        }}
      />
      <div className="max-w-inner-lg mx-auto px-6 py-8">
        <p className="mb-4 text-gray-700">
          KCVV Elewijt heeft deze week twee nieuwe spelers aangetrokken voor het
          komende seizoen. De club is verheugd om deze nieuwe talenten te
          verwelkomen.
        </p>
        <p className="text-gray-700">
          Trainer Berckmans was na afloop tevreden over de prestatie van zijn
          team. &quot;We hebben als collectief goed gespeeld en de drie punten
          verdiend.&quot;
        </p>
      </div>
    </div>
  ),
};

/**
 * Long title — shows wrapping behavior
 */
export const LongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt behaalt een fantastische overwinning in de belangrijke wedstrijd tegen de rivaal van de regio na een spannende pot voetbal",
    imageUrl: fixtureImage("article-hero-matchverslag", 1),
    imageAlt: "Team celebration",
    category: "Wedstrijdverslag",
    date: "15 maart 2026",
    author: "KCVV Elewijt",
  },
};

/**
 * Short title
 */
export const ShortTitle: Story = {
  args: {
    title: "Overwinning!",
    imageUrl: fixtureImage("article-hero-matchverslag", 2),
    imageAlt: "Victory",
    category: "Eerste ploeg",
    date: "15 maart 2026",
    author: "KCVV Elewijt",
  },
};

/**
 * No image — dark fallback background
 */
export const NoImage: Story = {
  args: {
    title: "Artikel zonder afbeelding",
    category: "Clubnieuws",
    date: "10 maart 2026",
    author: "KCVV Elewijt",
  },
};

/**
 * Minimal — title only, no metadata
 */
export const Minimal: Story = {
  args: {
    title: "Overwinning!",
    imageUrl: fixtureImage("article-hero-generic", 0),
    imageAlt: "Victory",
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  args: {
    title: "Jeugdwerking start nieuwe training",
    imageUrl: fixtureImage("article-hero-jeugd", 0),
    imageAlt: "Youth training",
    category: "Jeugd",
    date: "12 maart 2026",
    author: "KCVV Elewijt",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
