import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MissionBanner } from "./MissionBanner";

const meta = {
  title: "Features/Club/MissionBanner",
  component: MissionBanner,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component:
          "Centered mission statement banner for the /club landing page. Displays a decorative opening quote, the club mission text, and attribution line on a dark green background.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MissionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default mission banner with club quote and attribution.
 */
export const Default: Story = {};

/**
 * Custom quote and attribution — used on /jeugd page.
 */
export const CustomQuote: Story = {
  args: {
    quote:
      "Bij KCVV Elewijt staat plezier op één. We geloven dat spelplezier de beste basis is voor sportieve groei.",
    attribution: "— Jeugdopleiding KCVV Elewijt",
  },
};
