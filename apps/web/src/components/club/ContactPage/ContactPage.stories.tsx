/**
 * ContactPage Stories
 *
 * `/club/contact` on the retro-terrace-fanzine system (10k1): <PageHero>,
 * paper-stamp cards, plain Phosphor-Fill icons, a merged "Contacteer ons."
 * grid (dynamic key contacts + static categories, deduped on e-mail), and a
 * jersey-deep prices table.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactPage } from "./ContactPage";
import type { KeyContactVM } from "@/lib/repositories/staff.repository";

const KEY_CONTACTS: KeyContactVM[] = [
  {
    role: "Voorzitter",
    name: "Jan Janssens",
    email: "voorzitter@kcvvelewijt.be",
  },
  {
    role: "Secretaris",
    name: "Piet Peeters",
    email: "secretaris@kcvvelewijt.be",
  },
  // Covers jeugd@ → the static "Jeugdwerking" category is deduped away.
  {
    role: "Jeugdcoördinator",
    name: "Marie Maes",
    email: "jeugd@kcvvelewijt.be",
  },
];

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
          "Full contact page for /club/contact on the retro-terrace-fanzine system. Hero + paper-stamp cards, an OpenStreetMap embed (paper-framed, pinned on Driesstraat 32), a merged 'Contacteer ons.' grid (key contacts + categories, deduped on e-mail), and a jersey-deep prices table.",
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
 * Default full-page view with dynamic key contacts merged into the grid.
 */
export const Default: Story = {
  args: { keyContacts: KEY_CONTACTS },
};

/**
 * No key contacts — the grid falls back to the static categories only.
 */
export const CategoriesOnly: Story = {
  args: { keyContacts: [] },
};

/**
 * Mobile viewport.
 */
export const MobileViewport: Story = {
  args: { keyContacts: KEY_CONTACTS },
  globals: { viewport: { value: "kcvvMobile" } },
};
