import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransferFactOverview } from "./TransferFactOverview";

const meta = {
  title: "Features/Articles/TransferFact/Overview",
  component: TransferFactOverview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Overview variant of the `transferFact` body block (design §8.1). Single horizontal row with four slots: accent kicker (`INKOMEND` / `UITGAAND` / `VERLENGD`) · player name + age/position meta · clubs inline · mono status label on the right (`TRANSFER` or `TOT {until}`). Outgoing kicker + arrow use `kcvv-warning` (amber — reported without alarm).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TransferFactOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incoming: Story = {
  args: {
    value: {
      direction: "incoming",
      playerName: "Maxim Breugelmans",
      position: "Middenvelder",
      age: 27,
      otherClubName: "Standard Luik",
      otherClubLogoUrl:
        "https://upload.wikimedia.org/wikipedia/en/2/25/Standard_Li%C3%A8ge_logo.svg",
    },
  },
};

export const Outgoing: Story = {
  args: {
    value: {
      direction: "outgoing",
      playerName: "Jan Janssens",
      position: "Aanvaller",
      age: 24,
      otherClubName: "KV Mechelen",
      otherClubLogoUrl:
        "https://upload.wikimedia.org/wikipedia/en/6/65/KV_Mechelen_logo.svg",
    },
  },
};

export const Extension: Story = {
  args: {
    value: {
      direction: "extension",
      playerName: "Koen Dewaele",
      position: "Keeper",
      age: 29,
      until: "2028",
    },
  },
};
