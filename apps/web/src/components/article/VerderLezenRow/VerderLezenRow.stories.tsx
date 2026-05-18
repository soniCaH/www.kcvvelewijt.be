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
          'Net-new Phase 5 footer primitive (5.d4 lock). 3-up `<NewsCard>` row at `--container-page` (1120px) width, with Phase 4.5 R10 flush-edge cards and R3 per-`articleType` backgrounds. Sparse states inherit the R10 "cards drop, never pad" rule: 0 → row doesn\'t render, 1 → 1-up at left, 2 → 2-up in cols 1+2, 3 → standard 3-up.',
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

// Standard 3-up — the canonical Verder-lezen layout. Mixed articleTypes
// confirm the R3 per-card background lookup: transfer card renders on
// jersey-deep, the rest on cream.
export const ThreeUp: Story = {
  args: {
    items: [INTERVIEW, TRANSFER, ANNOUNCEMENT],
  },
};

// 2-up sparse state. Cards drop into cols 1 + 2 of the grid; col 3 stays
// empty (no padding, no shifted centering). Verifies the R10 rule.
export const TwoUp: Story = {
  args: {
    items: [INTERVIEW, TRANSFER],
  },
};

// 1-up sparse state. Card lands in col 1; cols 2 + 3 stay empty.
export const OneUp: Story = {
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
// announcement / event). Capped at 3 cards by the component; the 4th
// item (event) is silently dropped. Demonstrates the R3 lookup across
// every supported `articleType`.
export const MixedArticleTypes: Story = {
  args: {
    items: [INTERVIEW, TRANSFER, ANNOUNCEMENT, EVENT],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Four items supplied, three rendered (interview / transfer / announcement); the fourth (event) is silently capped. Confirms the call-site is responsible for ranking before passing items to the row.",
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
