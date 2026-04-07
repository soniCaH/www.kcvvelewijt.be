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
      <header className="bg-green-main text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">KCVV Elewijt</h1>
        </div>
      </header>

      <section className="bg-gradient-to-br from-green-dark to-green-main text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-4">Welkom bij KCVV Elewijt</h2>
          <p className="text-xl">Jouw voetbalclub in het hart van Elewijt</p>
        </div>
      </section>

      <ResponsibilityBlock />

      <footer className="bg-black text-white p-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">© 2025 KCVV Elewijt</p>
        </div>
      </footer>
    </div>
  ),
  parameters: { layout: "fullscreen" },
};
