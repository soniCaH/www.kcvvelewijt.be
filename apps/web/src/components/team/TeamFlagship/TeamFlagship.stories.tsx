import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamFlagship } from "./TeamFlagship";

const meta = {
  title: "Features/Teams/TeamFlagship",
  component: TeamFlagship,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof TeamFlagship>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A-ploeg — jersey-deep filled, content left / photo right, with squad photo. */
export const AVariantWithPhoto: Story = {
  args: {
    variant: "a",
    kicker: "Eerste elftal",
    category: "A-ploeg",
    division: "Eerste Elftal A – 3e Nat. A",
    season: "25/26",
    teamImageUrl: "/player-fixtures/player-mendes-mouro.jpg",
    href: "/ploegen/eerste-elftallen-a",
  },
};

/** A-ploeg without a squad photo — JerseyShirt fallback in the photo panel. */
export const AVariantNoPhoto: Story = {
  args: {
    variant: "a",
    kicker: "Eerste elftal",
    category: "A-ploeg",
    division: "Eerste Elftal A – 3e Nat. A",
    season: "25/26",
    href: "/ploegen/eerste-elftallen-a",
  },
};

/** B-ploeg — cream, mirrored (photo left / content right). */
export const BVariantMirrored: Story = {
  args: {
    variant: "b",
    kicker: "Tweede elftal",
    category: "B-ploeg",
    division: "Eerste Elftal B – 4e Prov.",
    season: "25/26",
    teamImageUrl: "/player-fixtures/player-vartolomaios.jpg",
    href: "/ploegen/eerste-elftallen-b",
  },
};
