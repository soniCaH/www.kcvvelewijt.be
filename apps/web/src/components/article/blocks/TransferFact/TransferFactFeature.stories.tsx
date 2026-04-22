import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransferFactFeature } from "./TransferFactFeature";

const meta = {
  title: "Features/Articles/TransferFact/Feature",
  component: TransferFactFeature,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Feature variant of the `transferFact` body block (design §8.1). Full-bleed cream band, player cutout column, from/to stack with a green 2px accent bar on the KCVV row. Rendered as the first transferFact inside a `transfer` article; other transferFacts render as `TransferFactOverview`.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TransferFactFeature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incoming: Story = {
  args: {
    value: {
      direction: "incoming",
      playerName: "Maxim Breugelmans",
      playerPhotoUrl:
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
      position: "Middenvelder",
      age: 27,
      otherClubName: "Standard Luik",
      otherClubLogoUrl:
        "https://upload.wikimedia.org/wikipedia/en/2/25/Standard_Li%C3%A8ge_logo.svg",
      note: "Blij om thuis te zijn. Elewijt voelt onmiddellijk vertrouwd.",
    },
  },
};

export const Outgoing: Story = {
  args: {
    value: {
      direction: "outgoing",
      playerName: "Jan Janssens",
      playerPhotoUrl:
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80",
      position: "Aanvaller",
      age: 24,
      otherClubName: "KV Mechelen",
      otherClubLogoUrl:
        "https://upload.wikimedia.org/wikipedia/en/6/65/KV_Mechelen_logo.svg",
      note: "Dankjewel Jan — succes in Mechelen.",
    },
  },
};

export const Extension: Story = {
  args: {
    value: {
      direction: "extension",
      playerName: "Koen Dewaele",
      playerPhotoUrl:
        "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=600&q=80",
      position: "Keeper",
      age: 29,
      until: "2028",
      note: "De nummer 1 blijft aan boord tot 2028.",
    },
  },
};

export const IncomingNoPhoto: Story = {
  args: {
    value: {
      ...Incoming.args!.value!,
      playerPhotoUrl: null,
    },
  },
};
