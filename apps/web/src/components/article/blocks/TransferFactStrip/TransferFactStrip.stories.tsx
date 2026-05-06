import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransferFactStrip } from "./TransferFactStrip";

const meta = {
  title: "Article/TransferFactStrip",
  component: TransferFactStrip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft px-12 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TransferFactStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Storybook fixtures only — Wikipedia hotlinking is unreliable (Referer
// blocks), so use placehold.co with stable SVG output. Production logos
// arrive as Sanity-CDN URLs via the GROQ projection.
const STANDARD_LOGO = "https://placehold.co/80x80/d62828/ffffff/svg?text=STD";
const MECHELEN_LOGO = "https://placehold.co/80x80/ffd60a/000000/svg?text=KVM";

/** Inkomende transfer — jersey-deep arrows, andere club in 'Van', KCVV in 'Naar'. */
export const Incoming: Story = {
  args: {
    value: {
      direction: "incoming",
      playerName: "Maxim Breugelmans",
      position: "Middenvelder",
      age: 27,
      otherClubName: "Standard Luik",
      otherClubLogoUrl: STANDARD_LOGO,
      otherClubContext: "Jupiler Pro League · U23",
      kcvvContext: "Derde Amateur · A-ploeg · #8",
    },
  },
};

/**
 * Uitgaande transfer — alert-rode pijlen (bittersweet: speler vertrekt).
 * KCVV in 'Van', andere club in 'Naar'.
 */
export const Outgoing: Story = {
  args: {
    value: {
      direction: "outgoing",
      playerName: "Jan Janssens",
      position: "Aanvaller",
      age: 24,
      otherClubName: "KV Mechelen",
      otherClubLogoUrl: MECHELEN_LOGO,
      otherClubContext: "Eerste klasse",
      kcvvContext: "Vier seizoenen, 38 doelpunten",
    },
  },
};

/**
 * Verlengde transfer — één centrale player-card, geen pijlen, oranje
 * outline-stamp 'tot 2027 — 28'.
 */
export const Extension: Story = {
  args: {
    value: {
      direction: "extension",
      playerName: "Bram Vermeulen",
      position: "Verdediger",
      age: 28,
      until: "2027 — 28",
      kcvvContext: "Derde Amateur · A-ploeg · #4",
    },
  },
};

/**
 * Inkomende transfer zonder logo — fallback naar groot
 * jersey-deep monogram (eerste letter van clubnaam).
 */
export const IncomingNoLogo: Story = {
  args: {
    value: {
      direction: "incoming",
      playerName: "Tom Janssens",
      position: "Keeper",
      age: 22,
      otherClubName: "Voetbalclub Onbekend",
      otherClubContext: "Tweede provinciale",
      kcvvContext: "Tweede doelman",
    },
  },
};

/**
 * Mobiele weergave — verticale stack met SVG-pijl omlaag. Forces the
 * narrow layout via `orientation="vertical"` so it renders correctly in
 * Storybook without needing the viewport addon. Wrapped in a 380px
 * container to mimic phone width.
 */
export const IncomingMobile: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-[380px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    orientation: "vertical",
    value: {
      direction: "incoming",
      playerName: "Maxim Breugelmans",
      position: "Middenvelder",
      age: 27,
      otherClubName: "Standard Luik",
      otherClubLogoUrl: STANDARD_LOGO,
      otherClubContext: "Jupiler Pro League · U23",
      kcvvContext: "Derde Amateur · A-ploeg · #8",
    },
  },
};
