/**
 * ContactPage Stories
 *
 * Club contact information page with address, map embed, and categorized
 * email contacts.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactPage } from "./ContactPage";

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Pages/ContactPage",
  component: ContactPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full contact page for /club/contact. Shows club address, an OpenStreetMap embed, and a grid of categorized email contacts.",
      },
    },
  },
  // vr-skip: full-page Storybook composition exhausts the browser memory
  // budget in the pinned Playwright Docker image (page.goto crashes during
  // setupPage). Page-level visual coverage moves to Playwright e2e per
  // docs/prd/page-level-testing-rework.md.
  tags: ["autodocs", "vr-skip"],
} satisfies Meta<typeof ContactPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default full-page view with all sections.
 */
export const Default: Story = {};

/**
 * Mobile viewport.
 */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
