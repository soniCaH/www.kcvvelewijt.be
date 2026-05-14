// apps/web/src/components/home/FeaturedUitgelichtRow/FeaturedUitgelichtRow.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeaturedUitgelichtRow } from "./FeaturedUitgelichtRow";
import type { UitgelichtArticle } from "./FeaturedUitgelichtRow";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Homepage/FeaturedUitgelichtRow",
  component: FeaturedUitgelichtRow,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Equal 3-up featured-article row that sits between the hero and the news grid. " +
          "Drops itself (returns null) when no featured articles are present; renders fewer " +
          "cards rather than padding from the recent-articles pool. See " +
          "`docs/design/mockups/phase-4-homepage/uitgelicht-locked.md` (R1.6.A).",
      },
    },
  },
} satisfies Meta<typeof FeaturedUitgelichtRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const article = (
  slot: number,
  title: string,
  articleType: UitgelichtArticle["articleType"],
  badge: string,
  dek?: string,
): UitgelichtArticle => ({
  href: `/nieuws/uitgelicht-${slot}`,
  title,
  imageUrl: fixtureImage("article-hero-generic", slot),
  imageAlt: title,
  date: `${14 + slot} mei 2026`,
  articleType,
  badge,
  dek,
});

const threeArticles: UitgelichtArticle[] = [
  article(
    0,
    "Voorbeschouwing op de competitiestart van seizoen 26-27",
    "interview",
    "Interview",
    "Coach Vermeiren over de zomertransfers en de vooruitzichten op promotie.",
  ),
  article(
    1,
    "Welkom Aaron Daniels: 26-jarige spits versterkt de aanval",
    "transfer",
    "Transfer",
    "De Belgisch-Engelse aanvaller tekent voor twee seizoenen.",
  ),
  article(
    2,
    "Spelerstornooi U13 zaterdag 15 juni — kom supporteren!",
    "event",
    "Evenement",
    "Acht ploegen, één toernooi. Vanaf 09:00 op de hoofdterreinen.",
  ),
];

// N=3 — the canonical fully-populated row.
export const ThreeArticles: Story = {
  args: { articles: threeArticles },
};

// N=2 — two featured articles, third card slot stays empty (no padding
// from non-featured pool).
export const TwoArticles: Story = {
  args: { articles: threeArticles.slice(0, 2) },
};

// N=1 — single featured card. Verifies the section still reads at the
// minimum-content state.
export const OneArticle: Story = {
  args: { articles: threeArticles.slice(0, 1) },
};

// N=0 — graceful drop, section returns null. Storybook renders empty.
// Documented here so a future regression that re-introduces an empty
// section header is visible in baseline review.
export const NoArticles: Story = {
  args: { articles: [] },
};

// Transfer-type background — exercises the R3.B BG_BY_TYPE lookup so
// VR baselines pin the green semantic against the cream-only default.
export const TransferShowcase: Story = {
  args: {
    articles: [
      article(
        1,
        "Welkom Aaron Daniels: 26-jarige spits versterkt de aanval",
        "transfer",
        "Transfer",
        "De Belgisch-Engelse aanvaller tekent voor twee seizoenen.",
      ),
      article(
        3,
        "Verlenging voor sluitstuk Lennert Geens — drie jaar erbij",
        "transfer",
        "Transfer",
      ),
      article(
        4,
        "Frédéric Maes zet één jaar erbij en blijft kapitein",
        "transfer",
        "Transfer",
      ),
    ],
  },
};

// Articles without dek — verifies graceful-omit reads cleanly without
// the optional paragraph (mirrors what ARTICLES_QUERY currently emits
// until `lead` is added to the projection).
export const WithoutDek: Story = {
  args: {
    articles: threeArticles.map(({ dek: _dek, ...rest }) => rest),
  },
};
