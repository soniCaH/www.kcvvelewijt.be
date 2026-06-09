import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BoardHero } from "./BoardHero";

const meta = {
  title: "Features/Club/BoardHero",
  component: BoardHero,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BoardHero>;

export default meta;
type Story = StoryObj<typeof meta>;

// Local committed asset served by Storybook `staticDirs` (deterministic VR).
const PHOTO = "/images/ultras.jpg";

export const WithPhoto: Story = {
  args: {
    name: "Bestuur",
    tagline: "De mensen achter de plezantste compagnie.",
    imageUrl: PHOTO,
  },
};

export const NoPhoto: Story = {
  args: {
    name: "Jeugdbestuur",
    tagline: "Wie de jeugdwerking in goede banen leidt.",
  },
};
