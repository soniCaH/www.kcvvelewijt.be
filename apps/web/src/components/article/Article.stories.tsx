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
    _type: "block",
    _key: "5",
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: [{ _type: "span", _key: "5a", text: "Balbezit: 62%", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "6",
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: [
      { _type: "span", _key: "6a", text: "Schoten op doel: 8", marks: [] },
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

      <main className="w-full max-w-inner-lg mx-auto px-0 lg:flex lg:flex-row-reverse">
        {/* Metadata - First in HTML, displays on RIGHT on desktop */}
        <aside className="lg:flex lg:flex-col lg:max-w-[20rem] lg:self-start">
          <ArticleMetadata
            author="Tom Redactie"
            date="15 januari 2025"
            tags={[
              { name: "A-Ploeg", href: "/news?category=a-ploeg" },
              {
                name: "Wedstrijdverslag",
                href: "/news?category=wedstrijdverslag",
              },
              { name: "Derby", href: "/news?category=derby" },
            ]}
            shareConfig={{
              url: "https://kcvvelewijt.be/news/overwinning-derby",
              title: "KCVV Elewijt wint met 3-1 in spannende derby",
            }}
          />
        </aside>

        {/* Body - Second in HTML, displays on LEFT on desktop */}
        <div className="flex-1">
          <SanityArticleBody content={sampleArticleContent} />
        </div>
      </main>

      <ArticleFooter
        relatedContent={[
          {
            title: "Volgende wedstrijd: KCVV Elewijt vs SK Wolvertem",
            href: "/news/volgende-wedstrijd",
            type: "article",
          },
          {
            title: "Jan Janssens - Speler van de Maand",
            href: "/player/jan-janssens",
            type: "player",
          },
          {
            title: "A-Ploeg Teaminfo",
            href: "/team/a-ploeg",
            type: "team",
          },
        ]}
      />

      {/* Next section to show footer overlap */}
      <div className="bg-gray-100 pt-8 pb-16">
        <div className="max-w-inner-lg mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4">Andere Artikelen</h2>
          <p className="text-gray-600">
            Hier komen andere artikelen of widgets...
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Article without image - uses simple header
 */
export const WithoutImage: Story = {
  render: () => (
    <div className="min-h-screen bg-white">
      <header className="bg-kcvv-green-bright px-3 pt-4 pb-4 xl:px-0">
        <div className="w-full max-w-inner-lg mx-auto">
          <h1 className="text-white text-[2.5rem] leading-[0.92] font-bold">
            Trainingsschema aangepast voor winterstop
          </h1>
        </div>
      </header>

      <main className="w-full max-w-inner-lg mx-auto px-0 lg:flex lg:flex-row-reverse">
        <aside className="lg:flex lg:flex-col lg:max-w-[20rem]">
          <ArticleMetadata
            author="Club Secretariaat"
            date="20 december 2024"
            tags={[
              { name: "Training", href: "/news?category=training" },
              { name: "Algemeen", href: "/news?category=algemeen" },
            ]}
            shareConfig={{
              url: "https://kcvvelewijt.be/news/trainingsschema",
              title: "Trainingsschema aangepast voor winterstop",
            }}
          />
        </aside>

        <div className="flex-1">
          <SanityArticleBody content={sampleArticleContent} />
        </div>
      </main>

      <ArticleFooter
        relatedContent={[
          {
            title: "Winterstop: Wat je moet weten",
            href: "/news/winterstop-info",
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

      <main className="w-full max-w-inner-lg mx-auto px-0 lg:flex lg:flex-row-reverse">
        <aside className="lg:flex lg:flex-col lg:max-w-[20rem]">
          <ArticleMetadata
            author="Marc Analyse"
            date="18 december 2024"
            tags={[
              { name: "A-Ploeg", href: "/news?category=a-ploeg" },
              { name: "Analyse", href: "/news?category=analyse" },
              {
                name: "Seizoen 2024-2025",
                href: "/news?category=seizoen-2024-2025",
              },
            ]}
            shareConfig={{
              url: "https://kcvvelewijt.be/news/seizoensoverzicht",
              title:
                "Seizoensoverzicht 2024-2025: Een analyse van onze prestaties",
            }}
          />
        </aside>

        <div className="flex-1">
          <SanityArticleBody content={sampleArticleContent} />
        </div>
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
            href: "/news/trainer-reflectie",
            type: "article",
          },
          {
            title: "A-Ploeg Selectie 2024-2025",
            href: "/team/a-ploeg",
            type: "team",
          },
          {
            title: "Jeugdwerking ook succesvol",
            href: "/news/jeugd-succes",
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
