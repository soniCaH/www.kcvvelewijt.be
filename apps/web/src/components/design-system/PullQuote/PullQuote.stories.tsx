import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PullQuote } from "./PullQuote";

const meta = {
  title: "UI/PullQuote",
  component: PullQuote,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge max-w-xl border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PullQuote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    attribution: { name: "Maxim Breugelmans" },
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
  },
};

export const WithRoleAndSource: Story = {
  args: {
    attribution: {
      name: "Jonas Willems",
      role: "B-PLOEG",
      source: "INTERVIEW",
    },
    children: "Geen drama. Gewoon doorgaan en zondag de drie pakken.",
  },
};

export const ToneInk: Story = {
  args: {
    tone: "ink",
    attribution: { name: "Coach", role: "A-PLOEG" },
    children:
      "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
  },
};

export const ToneJersey: Story = {
  args: {
    tone: "jersey",
    attribution: { name: "Niels", role: "U21" },
    children: "Ik heb hier op tien verschillende posities gespeeld.",
  },
};

export const Rotated: Story = {
  args: {
    rotation: "b",
    tape: [{ color: "jersey", length: "lg" }],
    attribution: { name: "Maxim" },
    children: "Een tribune die zingt is meer waard.",
  },
};

export const LongQuote: Story = {
  args: {
    attribution: { name: "Voorzitter", role: "BESTUUR" },
    emphasis: { text: "generatie na generatie" },
    children:
      "Het clubgevoel zit in de kleinste dingen — een kop koffie na de match, een gedeeld pintje, een ouder die zijn kind langs de zijlijn ziet groeien. Dat verkoop je niet, dat bouw je generatie na generatie.",
  },
};

export const WithEmphasis: Story = {
  args: {
    attribution: { name: "Maxim", role: "A-PLOEG" },
    emphasis: { text: "tribune die zingt" },
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
  },
};
