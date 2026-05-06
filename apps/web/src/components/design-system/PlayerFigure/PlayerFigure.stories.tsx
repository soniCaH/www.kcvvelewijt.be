import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerFigure } from "./PlayerFigure";

const meta = {
  title: "UI/PlayerFigure",
  component: PlayerFigure,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge max-w-[760px] border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_BIO =
  "Linkse spits met een neus voor de tweede paal. Dertiende seizoen in groen-wit.";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=600&h=800&fit=crop";

export const Playground: Story = {
  args: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Middenvelder",
    jerseyNumber: 8,
    photoUrl: PLACEHOLDER_PHOTO,
    bio: SAMPLE_BIO,
    teamLabel: "A-Ploeg",
  },
};

export const PhotoState: Story = {
  args: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Middenvelder",
    jerseyNumber: 8,
    photoUrl: PLACEHOLDER_PHOTO,
    bio: SAMPLE_BIO,
    teamLabel: "A-Ploeg",
  },
};

export const PhotoStateTightCrop: Story = {
  args: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Aanvaller",
    jerseyNumber: 8,
    photoUrl: PLACEHOLDER_PHOTO,
    crop: "tight",
    teamLabel: "A-Ploeg",
  },
};

export const IllustrationState: Story = {
  args: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Middenvelder",
    jerseyNumber: 8,
    bio: SAMPLE_BIO,
    teamLabel: "A-Ploeg",
  },
};

export const IllustrationStateMinimalData: Story = {
  args: {
    firstName: "Tom",
    lastName: "Janssens",
    positionPsd: "Verdediger",
  },
};

export const TagJerseyTone: Story = {
  args: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Middenvelder",
    jerseyNumber: 8,
    photoUrl: PLACEHOLDER_PHOTO,
    teamLabel: "A-Ploeg",
    tag: { text: "SPELER VAN DE WEEK", tone: "jersey" },
  },
};

export const TagInkTone: Story = {
  args: {
    firstName: "Lien",
    lastName: "De Smet",
    position: "Aanvaller",
    jerseyNumber: 11,
    photoUrl: PLACEHOLDER_PHOTO,
    teamLabel: "Dames",
    tag: { text: "NIEUW", tone: "ink" },
  },
};

export const PlainStringTag: Story = {
  args: {
    firstName: "Bram",
    lastName: "Vermeulen",
    position: "Aanvallende Middenvelder",
    jerseyNumber: 10,
    photoUrl: PLACEHOLDER_PHOTO,
    teamLabel: "B-Ploeg",
    tag: "KAPITEIN",
  },
};
