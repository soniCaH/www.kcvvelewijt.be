/**
 * ArticleFooter Component Stories
 * Shows related content section with green background
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleFooter } from "./ArticleFooter";
import type { RelatedContent } from "./ArticleFooter";

const meta = {
  title: "Features/Articles/ArticleFooter",
  component: ArticleFooter,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Article footer with related content. Features bright green background, white text, and grid layout on desktop.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ArticleFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleRelatedContent: RelatedContent[] = [
  {
    title: "A-Ploeg behaalt belangrijke overwinning",
    href: "/nieuws/overwinning",
    type: "article",
  },
  {
    title: "Jan Janssens - Speler Profiel",
    href: "/player/jan-janssens",
    type: "player",
  },
  {
    title: "A-Ploeg Informatie",
    href: "/team/a-ploeg",
    type: "team",
  },
];

/**
 * Default footer with multiple related items
 * Shows 3-column grid on desktop
 */
export const Default: Story = {
  args: {
    relatedContent: sampleRelatedContent,
  },
};

/**
 * With many items
 * Shows grid with 6 items
 */
export const ManyItems: Story = {
  args: {
    relatedContent: [
      {
        title: "Nieuw seizoen begint met overwinning",
        href: "/nieuws/seizoen-start",
        type: "article",
      },
      {
        title: "Piet Pieters verlengt contract",
        href: "/nieuws/contract",
        type: "article",
      },
      {
        title: "Jan Janssens - Topscorer",
        href: "/player/jan-janssens",
        type: "player",
      },
      {
        title: "Tom Tomassen - Nieuwe aanwinst",
        href: "/player/tom-tomassen",
        type: "player",
      },
      {
        title: "Hoofdcoach John Doe",
        href: "/staff/john-doe",
        type: "staff",
      },
      {
        title: "B-Ploeg Informatie",
        href: "/team/b-ploeg",
        type: "team",
      },
    ],
  },
};

/**
 * Single related item
 * Spans full width on desktop
 */
export const SingleItem: Story = {
  args: {
    relatedContent: [
      {
        title: "Lees meer over onze A-Ploeg",
        href: "/team/a-ploeg",
        type: "team",
      },
    ],
  },
};

/**
 * Different content types
 * Shows icons for article, player, staff, and team
 */
export const AllContentTypes: Story = {
  args: {
    relatedContent: [
      {
        title: "Nieuws artikel over de wedstrijd",
        href: "/nieuws/wedstrijd",
        type: "article",
      },
      {
        title: "Speler profiel: Jan Janssens",
        href: "/player/jan-janssens",
        type: "player",
      },
      {
        title: "Staff profiel: Coach John Doe",
        href: "/staff/john-doe",
        type: "staff",
      },
      {
        title: "Team pagina: A-Ploeg",
        href: "/team/a-ploeg",
        type: "team",
      },
    ],
  },
};

/**
 * Empty state
 * Footer does not render when no related content
 */
export const Empty: Story = {
  args: {
    relatedContent: [],
  },
};

/**
 * In article context
 * Shows footer at bottom of article with white content above
 */
export const InContext: Story = {
  args: {
    relatedContent: sampleRelatedContent,
  },
  render: (args) => (
    <div className="min-h-screen bg-white">
      {/* Article content */}
      <div className="max-w-inner-lg mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-4">Article Title</h2>
        <p className="text-gray-700 mb-4">
          Dit is het einde van het artikel. Hieronder volgt de sectie met
          gerelateerde inhoud.
        </p>
      </div>

      {/* Article footer */}
      <ArticleFooter {...args} />

      {/* Next section */}
      <div className="bg-gray-100 pt-12 pb-16">
        <div className="max-w-inner-lg mx-auto px-6">
          <p className="text-gray-600">
            Volgende sectie op de pagina (let op de spacing na de groene footer)
          </p>
        </div>
      </div>
    </div>
  ),
};
