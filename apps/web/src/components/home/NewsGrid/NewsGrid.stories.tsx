// apps/web/src/components/home/NewsGrid/NewsGrid.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsGrid, type NewsGridArticle } from "./NewsGrid";
import { fixtureImage } from "@test-fixtures/images";

const SLOT_SHAPES = [
  "article-hero-generic",
  "article-hero-matchverslag",
  "article-hero-jeugd",
  "article-hero-transfer",
  "article-hero-evenement",
] as const;

const meta = {
  title: "Features/Homepage/NewsGrid",
  component: NewsGrid,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage news section — R2.B flat 3×2 grid of six chronological cards. " +
          "Per-card background derives from `articleType` via the R3.B BG_BY_TYPE lookup " +
          "(transfer → jersey-deep, everything else → cream). Partial states (1..5) " +
          "render fewer cards rather than collapsing to a hierarchy. " +
          "See docs/design/mockups/phase-4-homepage/newsgrid-revisit-locked.md and " +
          "card-semantics-locked.md.",
      },
    },
  },
} satisfies Meta<typeof NewsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Local fixture URLs are byte-stable across runs and viewports. Per-slot
// shape variation keeps the stories visually distinct when reviewing baselines.
const article = (
  slot: number,
  title: string,
  tag: string,
  articleType: NewsGridArticle["articleType"] = null,
): NewsGridArticle => ({
  href: `/nieuws/slot-${slot}`,
  title,
  imageUrl: fixtureImage(
    SLOT_SHAPES[slot % SLOT_SHAPES.length] ?? "article-hero-generic",
    slot,
  ),
  imageAlt: title,
  date: `${15 + slot} mei 2025`,
  tags: [{ name: tag }],
  articleType,
});

// Balanced AC scenario: 1 transfer · 2 interviews · 1 event · 2 announcements.
// Mirrors the issue's first storybook scenario — the "typical week" of
// content where the grid reads calm-mostly-cream with one green accent.
const balancedSix: NewsGridArticle[] = [
  article(
    0,
    "Welkom Aaron Daniels: 26-jarige spits versterkt de aanval",
    "Transfer",
    "transfer",
  ),
  article(
    1,
    "Coach Vermeiren: 'We bouwen verder op de basis'",
    "Interview",
    "interview",
  ),
  article(
    2,
    "Spelerstornooi U13 zaterdag 15 juni — kom supporteren!",
    "Evenement",
    "event",
  ),
  article(
    3,
    "Nieuwe trainingsschema seizoen 2026-2027 bekendgemaakt",
    "Mededeling",
    "announcement",
  ),
  article(
    4,
    "Kapitein Frédéric Maes blikt vooruit op de slotwedstrijd",
    "Interview",
    "interview",
  ),
  article(
    5,
    "Kantine gesloten zaterdag 8 juni wegens onderhoud",
    "Mededeling",
    "announcement",
  ),
];

// Transfer-window stress: 4 transfers in 6 slots. AC requires this
// VR-captured so the "heavy-green" risk is visible at review.
const transferHeavySix: NewsGridArticle[] = [
  article(0, "Welkom Aaron Daniels: 26-jarige spits", "Transfer", "transfer"),
  article(1, "Verlenging voor sluitstuk Lennert Geens", "Transfer", "transfer"),
  article(
    2,
    "Coach Vermeiren: 'We bouwen verder op de basis'",
    "Interview",
    "interview",
  ),
  article(
    3,
    "Aankoop Maxim Sterckx: middenvelder vervoegt selectie",
    "Transfer",
    "transfer",
  ),
  article(
    4,
    "Vertrek Senne Cools naar tweede provinciale",
    "Transfer",
    "transfer",
  ),
  article(
    5,
    "Kantine gesloten zaterdag 8 juni wegens onderhoud",
    "Mededeling",
    "announcement",
  ),
];

// All-interview mono-type stress: 6 cream cards in a row. AC requires
// the "calm-period flatness" risk be VR-captured.
const allInterviewSix: NewsGridArticle[] = [1, 2, 3, 4, 5, 6].map((n, idx) =>
  article(
    idx,
    `Interview ${n}: spelers blikken vooruit op de zomerstop`,
    "Interview",
    "interview",
  ),
);

export const Balanced: Story = {
  args: {
    articles: balancedSix,
    title: "Laatste nieuws",
    showViewAll: true,
    viewAllHref: "/nieuws",
  },
};

export const TransferHeavy: Story = {
  args: { ...Balanced.args, articles: transferHeavySix },
};

export const AllInterview: Story = {
  args: { ...Balanced.args, articles: allInterviewSix },
};

export const Sparse3: Story = {
  args: { ...Balanced.args, articles: balancedSix.slice(0, 3) },
};

export const Sparse1: Story = {
  args: { ...Balanced.args, articles: balancedSix.slice(0, 1) },
};

// N=0 returns null. VR captures the deliberately empty viewport to assert
// the section never renders chrome (heading, "Alle berichten" link, etc.)
// when there are no articles.
export const Empty: Story = {
  args: { ...Balanced.args, articles: [] },
};

// MobileView previews the single-column collapse below 640px. It
// shares `Balanced.args` and the VR runner already captures
// `Balanced` at the mobile viewport — running VR here would
// duplicate that baseline. Per `apps/web/CLAUDE.md`, `vr.disable`
// is the right opt-out (the story renders cleanly; nothing crashes).
export const MobileView: Story = {
  args: Balanced.args,
  globals: { viewport: { value: "mobile1" } },
  parameters: {
    // vr.disable: duplicate VR coverage — Balanced already captures
    // the mobile viewport using identical args.
    // Repro: render this story, compare to `--balanced--mobile.png`.
    // Approved by: @climacon at #1751 PR review.
    // Re-evaluate: when MobileView grows args distinct from Balanced.
    vr: { disable: true },
  },
};
