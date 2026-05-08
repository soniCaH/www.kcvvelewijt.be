// apps/web/src/components/home/NewsGrid/NewsGrid.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsGrid } from "./NewsGrid";
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
          "Homepage news section: 1 lead + 4 supporting (50/50 split, 2x2 right cluster). " +
          "Sparse-state behaviour collapses gracefully from N=5 down to N=0 (returns null) " +
          "per the locked spec at docs/design/mockups/phase-4-homepage/newsgrid-locked.md.",
      },
    },
  },
} satisfies Meta<typeof NewsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Local fixture URLs are byte-stable across runs and viewports. Per-slot
// shape variation keeps the stories visually distinct when reviewing baselines.
const article = (slot: number, title: string, tag: string) => ({
  href: `/nieuws/slot-${slot}`,
  title,
  imageUrl: fixtureImage(SLOT_SHAPES[slot % SLOT_SHAPES.length]!, slot),
  imageAlt: title,
  date: `${15 + slot} mei 2025`,
  tags: [{ name: tag }],
});

const fiveArticles = [
  article(
    0,
    "Kampioen! 58 punten en titel in eerste provinciale",
    "Clubnieuws",
  ),
  article(
    1,
    "Spelersvoorstelling seizoen 2025-2026: versterkingen voor debuut",
    "Selectie",
  ),
  article(
    2,
    "Jeugdtoernooi 2026: inschrijvingen open voor U9 t/m U15",
    "Jeugd",
  ),
  article(3, "Nieuwe trainingsschema seizoen 2025-2026 bekendgemaakt", "Club"),
  article(
    4,
    "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    "Competitie",
  ),
];

export const Default5: Story = {
  args: {
    articles: fiveArticles,
    title: "Laatste nieuws",
    showViewAll: true,
    viewAllHref: "/nieuws",
  },
};

export const Sparse4: Story = {
  args: { ...Default5.args, articles: fiveArticles.slice(0, 4) },
};

export const Sparse3: Story = {
  args: { ...Default5.args, articles: fiveArticles.slice(0, 3) },
};

export const Sparse2: Story = {
  args: { ...Default5.args, articles: fiveArticles.slice(0, 2) },
};

export const Sparse1: Story = {
  args: { ...Default5.args, articles: fiveArticles.slice(0, 1) },
};

// N=0 returns null. VR captures the deliberately empty viewport to assert
// the section never renders chrome (heading, "Alle berichten" link, etc.)
// when there are no articles.
export const Empty: Story = {
  args: { ...Default5.args, articles: [] },
};

// MobileView is a docs-only convenience for previewing the 1+2+2 mobile
// collapse in Storybook. Tagged "vr-skip" because the VR runner already
// captures Default5 at desktop / tablet / mobile viewports, and MobileView
// shares Default5.args — running VR on it would only duplicate the existing
// default-5--mobile baseline.
export const MobileView: Story = {
  args: Default5.args,
  globals: { viewport: { value: "mobile1" } },
  tags: ["vr-skip"],
};
