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
          "OpenStreetMap embed for the club address (Driesstraat 30, 1982 Elewijt). No consent gate needed — OSM does not track users.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MapEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
