/**
 * ResponsibilityBlock Component Stories
 * Compact homepage block version of the ResponsibilityFinder
 *
 * Designed for homepage integration with quick links
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResponsibilityBlock } from "./ResponsibilityBlock";
import { responsibilityPaths } from "@/data/responsibility-paths";

const meta = {
  title: "Features/Responsibility/ResponsibilityBlock",
  component: ResponsibilityBlock,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
The **ResponsibilityBlock** is a compact version designed for homepage integration.

### Features
- 🏠 Optimized for homepage sections
- 📱 Fully responsive with mobile-first design
- 🔗 Quick links to popular pages (organigram, contact, registration)
- 🎨 Branded with green gradient background
- ↗️ Link to full /hulp page

### Use Case
Perfect for homepage "How can we help?" sections that provide quick access to the responsibility finder.
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    paths: responsibilityPaths,
  },
} satisfies Meta<typeof ResponsibilityBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default homepage block
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Default appearance as it would appear on the homepage with gradient background and quick links.",
      },
    },
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Mobile-optimized view showing stacked quick links and touch-friendly interface.",
      },
    },
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  parameters: {
    docs: {
      description: {
        story: "Tablet view showing responsive grid layout for quick links.",
      },
    },
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

/**
 * Interactive test
 * Manual verification - check all elements are present
 */
export const WithInteraction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Verify all essential elements: heading "Hoe kunnen we je helpen?", three quick links (Organigram, Contact, Inschrijven), and the link to /hulp page.',
      },
    },
  },
};

/**
 * Interactive role selection
 * Manual interaction - test the compact ResponsibilityFinder
 */
export const WithRoleSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Test the compact ResponsibilityFinder interaction: click a role button (e.g., "Speler") and verify it highlights with green background and the question input appears.',
      },
    },
  },
};

/**
 * Quick links interaction
 * Manual interaction - test hover effects
 */
export const QuickLinksInteraction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Hover over quick link cards (Organigram, Contact, Inschrijven) to see the hover effects (shadow and scale). Links should be visually responsive.",
      },
    },
  },
};

/**
 * Integration with page layout
 */
export const WithPageContext: Story = {
  render: () => (
    <div>
      {/* Simulated page header */}
      <header className="bg-green-main text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">KCVV Elewijt</h1>
        </div>
      </header>

      {/* Hero section */}
      <section className="bg-gradient-to-br from-green-dark to-green-main text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-4">Welkom bij KCVV Elewijt</h2>
          <p className="text-xl">Jouw voetbalclub in het hart van Elewijt</p>
        </div>
      </section>

      {/* Responsibility Block */}
      <ResponsibilityBlock paths={responsibilityPaths} />

      {/* Simulated page footer */}
      <footer className="bg-black text-white p-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">© 2025 KCVV Elewijt</p>
        </div>
      </footer>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "Shows how the ResponsibilityBlock integrates into a complete page layout.",
      },
    },
  },
};

/**
 * Accessibility test
 */
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      context: "#storybook-root",
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "landmark-one-main",
            enabled: false, // Section doesn't need main landmark
          },
        ],
      },
    },
    docs: {
      description: {
        story: "Accessibility compliance test with axe-core.",
      },
    },
  },
};

/**
 * Visual comparison: Before/After states
 */
export const VisualStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4 px-4">Initial State</h3>
        <ResponsibilityBlock paths={responsibilityPaths} />
      </div>

      <div className="border-t-4 border-gray-200 pt-8">
        <h3 className="text-xl font-bold mb-4 px-4">
          With Different Backgrounds
        </h3>
        <div className="space-y-4">
          <div className="bg-white p-8">
            <ResponsibilityBlock paths={responsibilityPaths} />
          </div>
          <div className="bg-gray-100 p-8">
            <ResponsibilityBlock paths={responsibilityPaths} />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "Visual comparison showing how the component looks on different backgrounds.",
      },
    },
  },
};

/**
 * Performance test
 * Manual interaction - test performance with rapid clicks
 */
export const PerformanceTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Performance benchmark: rapidly click through all role buttons (Speler → Ouder → Trainer → Supporter → Niet-lid → Andere) to verify smooth, responsive interactions without lag.",
      },
    },
  },
};
