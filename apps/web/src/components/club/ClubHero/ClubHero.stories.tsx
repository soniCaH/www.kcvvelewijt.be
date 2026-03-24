import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClubHero } from "./ClubHero";

const meta = {
  title: "Features/Club/ClubHero",
  component: ClubHero,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Hero section for the /club landing page. Full-bleed background image with gradient overlays, title with green accent, and a built-in diagonal transition to the next section.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ClubHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default hero with placeholder background image, title, subtitle,
 * and built-in diagonal SVG transition.
 */
export const Default: Story = {};
