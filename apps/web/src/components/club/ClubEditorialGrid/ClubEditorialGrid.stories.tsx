import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClubEditorialGrid } from "./ClubEditorialGrid";

const meta = {
  title: "Features/Club/ClubEditorialGrid",
  component: ClubEditorialGrid,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "light" },
    docs: {
      description: {
        component:
          "Asymmetric 12-column editorial card grid for the /club landing page. Shows all 6 club sub-section cards (geschiedenis, bestuur, organigram, ultras, angels, aansluiten) with responsive breakpoints at 960px and 640px.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ClubEditorialGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full grid with all 6 editorial cards in the asymmetric desktop layout.
 */
export const Default: Story = {};
