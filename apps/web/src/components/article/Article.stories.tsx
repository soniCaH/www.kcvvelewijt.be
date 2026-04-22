/**
 * Article Page Stories
 * Complete article page combining all article components
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleHeader, ArticleMetadata, ArticleFooter } from "./index";
import { SanityArticleBody } from "./SanityArticleBody/SanityArticleBody";
import type { PortableTextBlock } from "@portabletext/react";

const meta = {
  title: "Pages/Article",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Complete article page combining ArticleHeader, ArticleMetadata, ArticleBody, and ArticleFooter components. This demonstrates the full article layout as it appears on the website.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleArticleContent: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "1",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "1a",
        text: "KCVV Elewijt heeft afgelopen weekend een indrukwekkende overwinning behaald tegen hun rivalen met een score van 3-1. Het team toonde uitstekende teamwork en determinatie gedurende de hele wedstrijd.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "2",
    style: "h2",
    children: [
      { _type: "span", _key: "2a", text: "Eerste Helft Dominantie", marks: [] },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "3",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "3a",
        text: "Vanaf het eerste fluitsignaal nam KCVV Elewijt de controle over de wedstrijd. In de 23e minuut opende Jan Janssens de score met een prachtig schot van buiten de zestien.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "4",
    style: "blockquote",
    children: [
      {
        _type: "span",
        _key: "4a",
        text: "Dit was een van onze beste prestaties van het seizoen. Het team heeft hard gewerkt en het resultaat laat dat zien.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: "image",
    _key: "img1",
    asset: {
      url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&fm=webp&fit=max",
    },
    alt: "Voetbalveld tijdens wedstrijd",
    width: 800,
    height: 450,
  } as unknown as PortableTextBlock,
  {
    _type: "block",
    _key: "5",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "5a",
        text: "Na de pauze bleef KCVV druk zetten. Het publiek genoot van het aanvallende voetbal.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: "articleImage",
    _key: "img2",
    asset: {
      url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80&fm=webp&fit=max",
    },
    alt: "Panorama van het stadion",
    width: 1600,
    height: 600,
    fullBleed: true,
  } as unknown as PortableTextBlock,
  {
    _type: "block",
    _key: "6",
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: [{ _type: "span", _key: "6a", text: "Balbezit: 62%", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "7",
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: [
      { _type: "span", _key: "7a", text: "Schoten op doel: 8", marks: [] },
    ],
    markDefs: [],
  },
];

/**
 * Default article page with all components
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-white">
      <ArticleHeader
        title="KCVV Elewijt wint met 3-1 in spannende derby"
        imageUrl="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1120&h=560&fit=crop"
        imageAlt="Voetbalwedstrijd KCVV Elewijt"
      />

      <ArticleMetadata
        author="Tom Redactie"
        date="15 januari 2025"
        readingTime="4 min lezen"
        shareConfig={{
          url: "https://kcvvelewijt.be/nieuws/overwinning-derby",
        }}
      />

      <main className="max-w-inner-lg mx-auto w-full px-6">
        <SanityArticleBody content={sampleArticleContent} />
      </main>

      <ArticleFooter
        relatedContent={[
          {
            title: "Volgende wedstrijd: KCVV Elewijt vs SK Wolvertem",
            href: "/nieuws/volgende-wedstrijd",
            type: "article",
          },
          {
            title: "Jan Janssens - Speler van de Maand",
            href: "/player/jan-janssens",
            type: "player",
          },
          {
            title: "A-Ploeg Teaminfo",
            href: "/ploegen/a-ploeg",
            type: "team",
          },
        ]}
      />

      <div className="bg-gray-100 pt-8 pb-16">
        <div className="max-w-inner-lg mx-auto px-6">
          <h2 className="mb-4 text-2xl font-bold">Andere Artikelen</h2>
          <p className="text-gray-600">
            Hier komen andere artikelen of widgets...
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Article without image — uses dark fallback header
 */
export const WithoutImage: Story = {
  render: () => (
    <div className="min-h-screen bg-white">
      <ArticleHeader title="Trainingsschema aangepast voor winterstop" />

      <ArticleMetadata
        author="Club Secretariaat"
        date="20 december 2024"
        readingTime="2 min lezen"
        shareConfig={{
          url: "https://kcvvelewijt.be/nieuws/trainingsschema",
        }}
      />

      <main className="max-w-inner-lg mx-auto w-full px-6">
        <SanityArticleBody content={sampleArticleContent} />
      </main>

      <ArticleFooter
        relatedContent={[
          {
            title: "Winterstop: Wat je moet weten",
            href: "/nieuws/winterstop-info",
            type: "article",
          },
          {
            title: "Hoofdtrainer John Doe",
            href: "/staff/john-doe",
            type: "staff",
          },
        ]}
      />
    </div>
  ),
};

/**
 * Long article with multiple sections
 */
export const LongArticle: Story = {
  render: () => (
    <div className="min-h-screen bg-white">
      <ArticleHeader
        title="Seizoensoverzicht 2024-2025: Een analyse van onze prestaties"
        imageUrl="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1120&h=560&fit=crop"
        imageAlt="KCVV Elewijt seizoen analyse"
      />

      <ArticleMetadata
        author="Marc Analyse"
        date="18 december 2024"
        readingTime="4 min lezen"
        shareConfig={{
          url: "https://kcvvelewijt.be/nieuws/seizoensoverzicht",
        }}
      />

      <main className="max-w-inner-lg mx-auto w-full px-6">
        <SanityArticleBody content={sampleArticleContent} />
      </main>

      <ArticleFooter
        relatedContent={[
          {
            title: "Topscorer Jan Janssens: 18 doelpunten",
            href: "/player/jan-janssens",
            type: "player",
          },
          {
            title: "Trainer reflecteert op eerste seizoenshelft",
            href: "/nieuws/trainer-reflectie",
            type: "article",
          },
          {
            title: "A-Ploeg Selectie 2024-2025",
            href: "/ploegen/a-ploeg",
            type: "team",
          },
          {
            title: "Jeugdwerking ook succesvol",
            href: "/nieuws/jeugd-succes",
            type: "article",
          },
        ]}
      />
    </div>
  ),
};

/**
 * Mobile viewport preview
 */
export const MobileView: Story = {
  ...Default,
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Tablet viewport preview
 */
export const TabletView: Story = {
  ...Default,
  globals: {
    viewport: { value: "tablet" },
  },
};
