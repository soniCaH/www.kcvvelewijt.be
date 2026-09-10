import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerCard } from "./PlayerCard";

const meta = {
  title: "Features/Teams/PlayerCard",
  component: PlayerCard,
  parameters: { layout: "centered" },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Photo state — newsprint-treated psdImage, blended onto the card's cream, with number disc top-left. */
export const WithPhoto: Story = {
  args: {
    id: "player-123",
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Aanvaller",
    jerseyNumber: 9,
    photoUrl: "/player-fixtures/player-mendes-mouro.jpg",
    href: "/spelers/123",
  },
};

/** Illustration fallback — no psdImage → canonical jersey figure. */
export const IllustrationFallback: Story = {
  args: {
    id: "player-124",
    firstName: "Lars",
    lastName: "De Smet",
    position: "Keeper",
    jerseyNumber: 16,
    href: "/spelers/124",
  },
};

/** No jersey number — disc omitted. */
export const NoNumber: Story = {
  args: {
    id: "player-125",
    firstName: "Thibault",
    lastName: "Claes",
    position: "Verdediger",
    photoUrl: "/player-fixtures/player-schulz.jpg",
    href: "/spelers/125",
  },
};

/**
 * No authored position and no PSD-synced fallback — the majority case in
 * production (184 of 231 active players, measured 2026-08-17). The label
 * row is omitted rather than defaulted to a placeholder (#2567).
 */
export const NoPosition: Story = {
  args: {
    id: "player-126",
    firstName: "Ruben",
    lastName: "Peeters",
    jerseyNumber: 5,
    href: "/spelers/126",
  },
};

/** `garment="coat"` — the staff-document illustration fallback (#2485). */
export const CoatGarment: Story = {
  args: {
    id: "staff-127",
    firstName: "Karel",
    lastName: "Coach",
    position: "Hoofdtrainer",
    garment: "coat",
  },
};

/**
 * `blendPhoto={false}` — the escape hatch, with NO production call site since
 * #2901 made every person surface blend. Kept as coverage of the prop itself,
 * for a surface that ever knowingly renders free-form photography. It skips
 * multiply blend (#2575 review), unlike a standardised PSD headshot.
 */
export const UnblendedPhoto: Story = {
  args: {
    id: "staff-128",
    firstName: "Karel",
    lastName: "Coach",
    position: "Hoofdtrainer",
    photoUrl: "/player-fixtures/player-schulz.jpg",
    blendPhoto: false,
  },
};

/**
 * `linkAffordance` — the resting "Bekijk →" label for a linked card on a
 * run that mixes linked and unlinked cards (BEST-1, #2575 review).
 */
export const LinkAffordance: Story = {
  args: {
    id: "staff-129",
    firstName: "Karel",
    lastName: "Coach",
    position: "Hoofdtrainer",
    href: "/staf/129",
    linkAffordance: true,
  },
};
