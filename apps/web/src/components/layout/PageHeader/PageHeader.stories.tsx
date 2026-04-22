/**
 * PageHeader Component Stories
 * Showcases the main site header with navigation
 *
 * The PageHeader is the primary navigation component for the KCVV Elewijt website.
 * It features a dark background (#1E2024) with white text, positioned below the
 * 3px AccentStrip, and responsive behavior that switches between desktop horizontal
 * navigation and mobile hamburger menu at 960px.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccentStrip } from "../AccentStrip";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Main site header with logo and navigation. Dark background (#1E2024), " +
          "white text, sticky below the 3px AccentStrip. Offset top-[3px].",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      description: "Additional CSS classes to apply to the header",
      control: "text",
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default header with logo and navigation.
 * Dark background (#1E2024) with white text.
 * The 3px green AccentStrip sits above the nav — both are fixed, contained by
 * the wrapper's transform so they render relative to the story canvas.
 */
export const Default: Story = {
  args: {},
  render: () => (
    <div style={{ transform: "translateX(0)" }}>
      <AccentStrip />
      <PageHeader />
      <div className="p-8 pt-[calc(4rem+3px)]">
        <h1 className="mb-4 text-2xl font-bold">KCVV Elewijt</h1>
        <p className="mb-4 text-gray-600">
          The header above shows the dark nav with the green accent strip. Hover
          over menu items to see the underline animation effect.
        </p>
        <div className="space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i} className="text-gray-600">
              This is example content to demonstrate the fixed header behavior.
              The header remains visible as you scroll down the page.
            </p>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Mobile view (resize viewport to see)
 */
export const MobileView: Story = {
  render: () => (
    <div style={{ transform: "translateX(0)" }}>
      <AccentStrip />
      <PageHeader />
      <div className="p-4 pt-[calc(4rem+3px)]">
        <h1 className="mb-4 text-xl font-bold">Mobile Layout</h1>
        <p className="text-sm text-gray-600">
          Click the hamburger icon to open the mobile menu.
        </p>
      </div>
    </div>
  ),
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Full page example with content
 */
export const WithContent: Story = {
  render: () => (
    <div
      className="flex min-h-screen flex-col"
      style={{ transform: "translateX(0)" }}
    >
      <AccentStrip />
      <PageHeader />
      <main className="flex-1 pt-[calc(4rem+3px)]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-kcvv-gray-blue mb-4 text-3xl font-bold">
            Welcome to KCVV Elewijt
          </h1>
          <p className="mb-6 text-gray-600">
            This is an example page showing the header in context with content.
            The header will stick to the top as you scroll.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded border border-gray-200 bg-white p-6"
              >
                <h3 className="mb-2 text-lg font-bold">Card {i + 1}</h3>
                <p className="text-sm text-gray-600">
                  Sample content to demonstrate page layout with the header.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <p key={i} className="text-gray-600">
                More content to demonstrate scrolling behavior. The header
                should remain fixed at the top of the viewport.
              </p>
            ))}
          </div>
        </div>
      </main>
    </div>
  ),
};
