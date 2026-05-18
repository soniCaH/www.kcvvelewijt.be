import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransferFactCard } from "./TransferFactCard";

const meta = {
  title: "Article/TransferFactCard",
  component: TransferFactCard,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Compact body-level renderer for additional `transferFact` PT blocks (per 5.d-tra lock). The FIRST transferFact in a transfer-type article powers the hero via `<TransferFactStrip>` (Phase 3-b R1.5) — this card renders every subsequent transferFact. Adjacency-aware grouping (consecutive → 2-up grid, isolated → 1-up) is owned by `<ArticleBody>`'s segmenter; the card itself is layout-agnostic. When `otherClubLogoUrl` is present, the route line prefixes the other-club name with a 12px inline crest.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-[680px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TransferFactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Local dummy crests served by Storybook's `staticDirs: "../public"` mount
// (and identically by Next.js at runtime via /public). Real production
// crests come through Sanity's `transferFact.otherClubLogo` → projected
// CDN URL in GROQ.
const DUMMY_CREST_ROUGE = "/images/logos/clubs/dummy-rouge.svg";
const DUMMY_CREST_BLEU = "/images/logos/clubs/dummy-bleu.svg";
const DUMMY_CREST_VERT = "/images/logos/clubs/dummy-vert.svg";

// Incoming transfer — jersey-coloured top tape, "IN ↓" chip, route reads
// {logo} {otherClub} → KCVV · {jersey}.
export const Incoming: Story = {
  args: {
    fact: {
      _key: "tf-1",
      _type: "transferFact",
      direction: "incoming",
      playerName: "Joren De Smet",
      position: "Middenvelder",
      age: 19,
      otherClubName: "Diest",
      otherClubLogoUrl: DUMMY_CREST_ROUGE,
      kcvvContext: "#14",
    },
  },
};

// Outgoing — warm-coloured top tape, "OUT ↑" chip, route reads
// KCVV · {jersey} → {logo} {otherClub}.
export const Outgoing: Story = {
  args: {
    fact: {
      _key: "tf-2",
      _type: "transferFact",
      direction: "outgoing",
      playerName: "Bram Vanhoutte",
      position: "Centrale verdediger",
      age: 24,
      otherClubName: "Tienen",
      otherClubLogoUrl: DUMMY_CREST_BLEU,
      kcvvContext: "#9",
    },
  },
};

// Extension — jersey-coloured top tape, "VERLENGING ↻" chip, route reads
// A-kern · {jersey} · tot {until}. No other-club crest (the player stays
// with KCVV; there's no second club to render).
export const Extension: Story = {
  args: {
    fact: {
      _key: "tf-3",
      _type: "transferFact",
      direction: "extension",
      playerName: "Niels Geukens",
      position: "Spits",
      age: 23,
      kcvvContext: "#11",
      until: "juni 2028",
    },
  },
};

// No position + no age — context line drops out entirely. Confirms the
// `<TransferFactCard>` reads cleanly with a minimal data shape.
export const NoContextLine: Story = {
  args: {
    fact: {
      _key: "tf-4",
      _type: "transferFact",
      direction: "incoming",
      playerName: "Daan Permentier",
      otherClubName: "Aarschot",
      otherClubLogoUrl: DUMMY_CREST_VERT,
      kcvvContext: "#22",
    },
  },
};

// No logo — confirms the card still renders cleanly when
// `otherClubLogoUrl` is missing (the route line falls back to text-only,
// matching the 5.d-tra pre-update spec). Realistic for transferFact
// blocks where the editor hasn't uploaded an other-club crest.
export const NoLogo: Story = {
  args: {
    fact: {
      _key: "tf-5",
      _type: "transferFact",
      direction: "incoming",
      playerName: "Tim Mertens",
      position: "Doelman",
      age: 27,
      otherClubName: "Wespelaar",
      kcvvContext: "#1",
    },
  },
};
