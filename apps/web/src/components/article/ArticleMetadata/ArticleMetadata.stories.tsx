/**
 * ArticleMetadata Component Stories
 * Inline horizontal bar with breadcrumb, date, author, and share icons
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleMetadata } from "./ArticleMetadata";
import { ArticleHeader } from "../ArticleHeader";

const meta = {
  title: "Features/Articles/ArticleMetadata",
  component: ArticleMetadata,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Article metadata bar with breadcrumb navigation, date, author, and icon-only share buttons. Replaces the legacy sidebar layout.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    author: {
      control: "text",
      description: "Author name",
    },
    date: {
      control: "text",
      description: "Publication date (formatted string)",
    },
  },
} satisfies Meta<typeof ArticleMetadata>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default metadata bar with category and share buttons
 */
export const Default: Story = {
  args: {
    author: "KCVV Elewijt",
    date: "15/01/2025",
    category: { name: "Eerste ploeg", href: "/nieuws?categorie=eerste-ploeg" },
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/belangrijke-overwinning",
      title: "KCVV Elewijt behaalt belangrijke overwinning",
      hashtags: ["voetbal", "kcvv"],
    },
  },
};

/**
 * Without category — breadcrumb shows "News" only
 */
export const WithoutCategory: Story = {
  args: {
    author: "KCVV Elewijt",
    date: "12/01/2025",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/test",
      title: "Test Article",
    },
  },
};

/**
 * Without share buttons
 */
export const WithoutShare: Story = {
  args: {
    author: "KCVV Elewijt",
    date: "10/01/2025",
    category: { name: "Jeugd", href: "/nieuws?categorie=jeugd" },
  },
};

/**
 * Minimal — author and date only
 */
export const Minimal: Story = {
  args: {
    author: "KCVV Elewijt",
    date: "08/01/2025",
  },
};

/**
 * In context below hero header
 */
export const InContext: Story = {
  args: {
    author: "KCVV Elewijt",
    date: "18/01/2025",
    category: { name: "Transfer", href: "/nieuws?categorie=transfer" },
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/nieuwe-speler",
      title: "Nieuwe speler aangekondigd",
      hashtags: ["transfer", "kcvv"],
    },
  },
  render: (args) => (
    <div className="min-h-screen bg-white">
      <ArticleHeader
        title="Nieuwe speler aangekondigd"
        imageUrl="https://picsum.photos/1120/560?random=6"
        imageAlt="New player"
      />
      <ArticleMetadata {...args} />
      <main className="max-w-inner-lg mx-auto px-6 py-8">
        <p className="text-gray-700 mb-4">
          KCVV Elewijt heeft vandaag een nieuwe speler aangekondigd voor het
          komende seizoen. De transfer wordt gezien als een belangrijke
          versterking voor het team.
        </p>
        <p className="text-gray-700">
          De speler komt over van een andere club in de regio en heeft al
          ervaring in de competitie.
        </p>
      </main>
    </div>
  ),
};
