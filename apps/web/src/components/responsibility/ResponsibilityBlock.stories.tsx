/**
 * ResponsibilityBlock Component Stories
 *
 * Homepage teaser for the /hulp page — search input + quick links.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResponsibilityBlock } from "./ResponsibilityBlock";

const meta = {
  title: "Features/Responsibility/ResponsibilityBlock",
  component: ResponsibilityBlock,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
The **ResponsibilityBlock** is a homepage teaser for the redesigned /hulp page.

### Features

- 🔎 Search input that submits to the full /hulp page
- 🔗 Quick links to Organigram, Contact, and Inschrijven
- 🎨 Branded gradient background

### Use Case

Drop this on the homepage so visitors can jump straight into the help flow
without first having to navigate to /hulp manually.
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ResponsibilityBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default homepage block */
export const Default: Story = {};

/** Mobile viewport */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};

/** Tablet viewport */
export const Tablet: Story = {
  globals: { viewport: { value: "tablet" } },
};

/** Embedded in a simulated homepage layout */
export const WithPageContext: Story = {
  render: () => (
    <div>
      <header className="bg-green-main p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">KCVV Elewijt</h1>
        </div>
      </header>

      <section className="from-green-dark to-green-main bg-gradient-to-br px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-5xl font-bold">Welkom bij KCVV Elewijt</h2>
          <p className="text-xl">Jouw voetbalclub in het hart van Elewijt</p>
        </div>
      </section>

      <ResponsibilityBlock />

      <footer className="mt-12 bg-black p-6 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm">© 2025 KCVV Elewijt</p>
        </div>
      </footer>
    </div>
  ),
  parameters: { layout: "fullscreen" },
};
