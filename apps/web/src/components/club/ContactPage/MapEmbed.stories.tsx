import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MapEmbed } from "./MapEmbed";

const meta = {
  title: "Features/Contact/MapEmbed",
  component: MapEmbed,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Consent-gated Google Maps embed for the club address (Driesstraat 30, 1982 Elewijt). Shows a privacy notice and a \u201cLaad kaart\u201d button before loading the iframe.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MapEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state — privacy consent gate.
 * Click "Laad kaart" to load the Google Maps iframe.
 */
export const ConsentGate: Story = {};
