/**
 * <MatchArticleLinkCard> stories — Phase 6.B.d4 match-article link card.
 *
 * Lock matrix from
 * `docs/design/mockups/phase-6-match-detail/article-link-card-locked.md`
 * (Variant B — hero-style cover card):
 *  - Recap on a finished match → `LEES HET VERSLAG · MATCHVERSLAG` (`Recap`)
 *  - Recap + the preceding preview → inline "Lees ook …" link
 *    (`RecapWithPreviewLink`)
 *  - Preview on an upcoming match → `LEES DE VOORBESCHOUWING · MATCHPREVIEW`
 *    (`Preview`)
 *  - No linked article → component returns `null` (`Hidden`, blank VR baseline)
 *
 * The per-state kicker copy is produced by `selectMatchArticle` (covered in
 * `selectMatchArticle.test.ts`); these stories pass the resolved props the page
 * would derive from it.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { MatchArticleLinkCard } from "./MatchArticleLinkCard";
import { RECAP_KICKER, PREVIEW_KICKER } from "./selectMatchArticle";

const RECAP_ARTICLE = {
  title: "KCVV kopt zich in extremis langs Zemst.",
  slug: "kcvv-zemst-verslag",
  coverImageUrl: fixtureImage("article-hero-matchverslag", 0),
  lead: "Een rommelige tweede helft kantelde pas in minuut 89 — invaller Maes besliste de derby met het hoofd.",
};

const PREVIEW_ARTICLE = {
  title: "Alles op alles tegen de buren uit Zemst.",
  slug: "kcvv-zemst-voorbeschouwing",
  coverImageUrl: fixtureImage("match-action", 0),
  lead: "Met een zege schuift KCVV op naar de tweede plaats. Coach houdt de geblesseerde kapitein nog in de luwte.",
};

const meta = {
  title: "Features/Matches/MatchArticleLinkCard",
  component: MatchArticleLinkCard,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 6.B.d4 hero-style link card for `/wedstrijd/[matchId]`. Surfaces the `matchRecap` (finished) or `matchPreview` (upcoming) article written about a match as a full-width `<TapedCard>` with a 16:9 cover, per-state kicker, display heading, lead, and CTA. Auto-hides (`null`) when no linked article exists.",
      },
    },
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof MatchArticleLinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Finished match with a recap article — the dominant state. */
export const Recap: Story = {
  args: {
    article: RECAP_ARTICLE,
    kicker: RECAP_KICKER,
  },
};

/**
 * Finished match that also has the preview written before kickoff — the recap
 * leads the card; the preview is offered as an inline "Lees ook …" link (the
 * agreed replacement for the dropped match-filtered related-articles slot).
 */
export const RecapWithPreviewLink: Story = {
  args: {
    article: RECAP_ARTICLE,
    kicker: RECAP_KICKER,
    secondary: {
      slug: PREVIEW_ARTICLE.slug,
      label: "Lees ook de voorbeschouwing",
    },
  },
};

/** Upcoming match with a preview article. */
export const Preview: Story = {
  args: {
    article: PREVIEW_ARTICLE,
    kicker: PREVIEW_KICKER,
  },
};

/**
 * No linked article — the component returns `null`. Rendered here so the story
 * file captures the auto-hide branch; the VR snapshot is intentionally blank.
 */
export const Hidden: Story = {
  args: {
    article: null,
  },
};
