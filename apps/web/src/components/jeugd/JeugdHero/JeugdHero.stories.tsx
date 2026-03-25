import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JeugdHero } from "./JeugdHero";

const meta = {
  title: "Features/Jeugd/JeugdHero",
  component: JeugdHero,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component:
          "Hero section for the /jeugd landing page. Full-bleed background image with dark overlay, section label, large title with green accent, subtitle, and a built-in diagonal divider at the bottom.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof JeugdHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default hero with background image, title, and diagonal divider.
 */
export const Default: Story = {};
