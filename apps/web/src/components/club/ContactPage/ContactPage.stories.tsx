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
  // vr-skip: this story is observed to generate a test file and crash
  // Chromium's `page.goto` during the test-runner's setupPage hook under
  // Docker's 8GB memory cap. The `--includeTags vr` filter does not fully
  // exclude untagged stories at file-generation time (docs suggest it should,
  // but empirical evidence on this codebase contradicts that), so
  // `--excludeTags vr-skip` is the filter that actually keeps the test file
  // from being generated. Page-level visual coverage moves to Playwright e2e
  // per docs/prd/page-level-testing-rework.md.
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
