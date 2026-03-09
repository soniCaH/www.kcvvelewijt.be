/**
 * HelpPage Stories
 *
 * "Ik ben ... en ik ..." responsibility-finder page.
 * The interactive ResponsibilityFinder widget appears in the main section;
 * below it are info cards linking to the organigram and general contact,
 * plus a three-step "Hoe werkt het?" explanation.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HelpPage } from "./HelpPage";
import { responsibilityPaths } from "@/data/responsibility-paths";

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Pages/HelpPage",
  component: HelpPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full help page for /hulp. Contains a hero banner, the interactive ResponsibilityFinder, info cards, and a three-step explanation section.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    paths: responsibilityPaths,
  },
} satisfies Meta<typeof HelpPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default full-page view with the ResponsibilityFinder and all info sections.
 */
export const Default: Story = {};

/**
 * Mobile viewport.
 */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
