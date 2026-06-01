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

/** Photo state — newsprint-treated psdImage with number disc top-left. */
export const WithPhoto: Story = {
  args: {
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
    firstName: "Thibault",
    lastName: "Claes",
    position: "Verdediger",
    photoUrl: "/player-fixtures/player-schulz.jpg",
    href: "/spelers/125",
  },
};
