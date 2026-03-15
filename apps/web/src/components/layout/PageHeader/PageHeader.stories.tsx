/**
 * PageHeader Component Stories
 * Showcases the main site header with navigation
 *
 * The PageHeader is the primary navigation component for the KCVV Elewijt website.
 * It features a bright green background (#4acf52) with pattern overlay, white text,
 * and responsive behavior that switches between desktop horizontal navigation and
 * mobile hamburger menu at 960px.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
 * Green background (#4acf52) with pattern overlay.
 * Desktop navigation shows on screens 960px and wider.
 * Hover over navigation items to see underline animation.
 * Dropdown menus appear on "A-Ploeg", "B-Ploeg", "Jeugd", and "De club".
 */
export const Default: Story = {
  args: {},
  render: () => (
    <div>
      <PageHeader />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">KCVV Elewijt</h1>
        <p className="text-gray-600 mb-4">
          The header above shows the main navigation with green background and
          white text. Hover over menu items to see the underline animation
          effect.
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
    <div>
      <PageHeader />
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Mobile Layout</h1>
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
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-kcvv-gray-blue mb-4">
            Welcome to KCVV Elewijt
          </h1>
          <p className="text-gray-600 mb-6">
            This is an example page showing the header in context with content.
            The header will stick to the top as you scroll.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded p-6"
              >
                <h3 className="font-bold text-lg mb-2">Card {i + 1}</h3>
                <p className="text-gray-600 text-sm">
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
