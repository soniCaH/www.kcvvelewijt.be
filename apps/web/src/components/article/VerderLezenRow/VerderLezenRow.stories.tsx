import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { VerderLezenRow, type VerderLezenItem } from "./VerderLezenRow";

const meta = {
  title: "Article/VerderLezenRow",
  component: VerderLezenRow,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Net-new Phase 5 footer primitive (5.d4 lock, slider variant ratified during #1800 implementation review). Horizontal scroller of `<NewsCard>` at `--container-page` (1120px) width. At desktop the first ~3 cards sit in-frame; the rest reveal via paper-chrome scroll arrows + drag. Per-`articleType` card backgrounds (R3 lookup) tint each card. Items include articles + mentioned players / teams / staff / events.",
      },
    },
  },
} satisfies Meta<typeof VerderLezenRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// Deterministic local fixtures per `feedback_design_data_audit` and the
// fixture pool's own warning ("remote placeholder services produce
// non-deterministic VR baselines"). Pool indices are 0-fixed so VR
// snapshots stay byte-stable across runs.

const INTERVIEW: VerderLezenItem = {
  title: "Wim Govaerts over de wakker-mentaliteit",
  href: "/nieuws/wim-govaerts-interview",
  imageUrl: fixtureImage("article-hero-interview", 0),
  imageAlt: "Wim Govaerts in de dug-out",
  badge: "INTERVIEW",
  date: "23 mei 2026",
  articleType: "interview",
};

const TRANSFER: VerderLezenItem = {
  title: "Maxim Breugelmans versterkt Elewijt",
  href: "/nieuws/maxim-breugelmans-transfer",
  imageUrl: fixtureImage("article-hero-transfer", 0),
  imageAlt: "Maxim Breugelmans bij zijn aankomst",
  badge: "TRANSFER",
  date: "18 mei 2026",
  articleType: "transfer",
};

const ANNOUNCEMENT: VerderLezenItem = {
  title: "Algemene vergadering op 12 juni",
  href: "/nieuws/algemene-vergadering-juni",
  imageUrl: fixtureImage("article-hero-generic", 0),
  imageAlt: "Driesstraat 32, hoofdingang",
  badge: "MEDEDELING",
  date: "15 mei 2026",
  articleType: "announcement",
};

const EVENT: VerderLezenItem = {
  title: "Lentetornooi U13",
  href: "/nieuws/lentetornooi-u13",
  imageUrl: fixtureImage("article-hero-evenement", 0),
  imageAlt: "Jeugdspelers tijdens een wedstrijd",
  badge: "EVENEMENT",
  date: "10 mei 2026",
  articleType: "event",
};

// Canonical 3-card layout — the first three slots are visible at desktop
// width; no scroll arrows render because there's no overflow. Mixed
// articleTypes confirm the R3 per-card background lookup: transfer card
// renders on jersey-deep, the rest on cream.
export const ThreeCards: Story = {
  args: {
    items: [INTERVIEW, TRANSFER, ANNOUNCEMENT],
  },
};

// 2-card sparse state — cards take their fixed slot width; the slider
// track simply shorter. No overflow, no arrows.
export const TwoCards: Story = {
  args: {
    items: [INTERVIEW, TRANSFER],
  },
};

// 1-card sparse state — single slot, no slider arrows.
export const OneCard: Story = {
  args: {
    items: [INTERVIEW],
  },
};

// Empty / 0-up — the row must not render at all (returns `null`). The
// "Verder lezen" heading should not appear as a heading-only orphan.
export const Empty: Story = {
  args: {
    items: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Defensive rendering check: a 0-item row returns `null`, no heading-only orphan. Storybook will show an empty canvas — that is the expected behaviour per the 5.d4 lock ("0 related → row does not render").',
      },
    },
  },
};

// All 4 articleType variants in the same row (interview / transfer /
// announcement / event) — slider track of 4 cards. The 4th card lives
// just outside the desktop viewport; scroll arrows reveal it.
export const MixedArticleTypes: Story = {
  args: {
    items: [INTERVIEW, TRANSFER, ANNOUNCEMENT, EVENT],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Four cards — three sit in-frame at desktop width, the fourth is reachable via the slider's right arrow / horizontal scroll. Confirms the R3 lookup across every supported `articleType` plus the slider overflow behaviour.",
      },
    },
  },
};

// Slider overflow with 7 mixed items (articles + a mentioned player +
// a mentioned team) — exercises the canonical case where mentioned
// non-article references push the row well past the 3-visible viewport.
export const SliderOverflow: Story = {
  args: {
    items: [
      INTERVIEW,
      TRANSFER,
      ANNOUNCEMENT,
      EVENT,
      {
        title: "Joren De Smet",
        href: "/spelers/1234",
        imageUrl: fixtureImage("player-portrait-square", 0),
        imageAlt: "Joren De Smet — portret",
        badge: "SPELER",
      },
      {
        title: "KCVV Elewijt B",
        href: "/ploegen/kcvv-b",
        imageUrl: fixtureImage("team-group", 0),
        imageAlt: "KCVV B ploegfoto",
        badge: "PLOEG",
      },
      {
        title: "Steakfestijn 2026",
        href: "/evenementen/steakfestijn-2026",
        imageUrl: fixtureImage("event-cover", 0),
        imageAlt: "Steakfestijn afbeelding",
        badge: "EVENEMENT",
        date: "25 sep 2026",
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Seven mixed items — articles, a player, a team, an event. The slider's right arrow is visible; drag / arrow / scroll reveals the cards past the viewport edge. Mirrors the real article-page output on `/nieuws/[slug]` (#1800).",
      },
    },
  },
};

// Transfer-only row — confirms the jersey-deep card background renders
// cleanly when every card is the same articleType (no mixed contrast
// against the cream section surface).
export const AllTransfer: Story = {
  args: {
    items: [
      TRANSFER,
      {
        ...TRANSFER,
        title: "Niels verlengt voor twee seizoenen",
        href: "/nieuws/niels-verlenging",
        badge: "VERLENGD",
        imageUrl: fixtureImage("article-hero-transfer", 1),
      },
      {
        ...TRANSFER,
        title: "Joris vertrekt naar Diest",
        href: "/nieuws/joris-uitgaand",
        badge: "UITGAAND",
        imageUrl: fixtureImage("article-hero-transfer", 2),
      },
    ],
  },
};
