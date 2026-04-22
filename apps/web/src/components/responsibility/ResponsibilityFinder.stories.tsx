/**
 * ResponsibilityFinder Component Stories
 * Interactive "Ik ben ... en ik ..." question builder with smart autocomplete
 *
 * Features:
 * - Smart autocomplete with fuzzy matching
 * - Large typography for accessibility
 * - Role-based filtering
 * - Complete answer cards
 * - Mobile responsive
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ResponsibilityFinder } from "./ResponsibilityFinder";
import type { ResponsibilityPath } from "@/types/responsibility";

const storyPaths: ResponsibilityPath[] = [
  {
    id: "ongeval-speler-training",
    role: ["speler", "ouder"],
    question: "heb een ongeval op training/wedstrijd",
    keywords: ["ongeval", "blessure", "letsel", "kwetsuur", "pijn"],
    summary:
      "Meld het ongeval onmiddellijk bij je trainer en neem contact op met de verzekeringverantwoordelijke.",
    category: "medisch",
    icon: "heart",
    primaryContact: {
      contactType: "manual",
      role: "Verzekeringverantwoordelijke",
      email: "verzekering@kcvvelewijt.be",
      department: "algemeen",
    },
    steps: [
      { description: "Meld het ongeval bij je trainer" },
      {
        description: "Contacteer de verzekeringverantwoordelijke binnen 48 uur",
        contact: {
          contactType: "manual",
          role: "Verzekeringverantwoordelijke",
          email: "verzekering@kcvvelewijt.be",
        },
      },
      {
        description: "Vul het ongevalformulier in",
        link: "/club/downloads",
      },
    ],
  },
  {
    id: "inschrijving-nieuw-lid",
    role: ["niet-lid", "ouder"],
    question: "wil mij graag inschrijven",
    keywords: ["inschrijven", "lid worden", "aansluiten", "lidmaatschap"],
    summary:
      "Gebruik het online inschrijvingsformulier of neem contact op met de jeugdsecretaris.",
    category: "administratief",
    icon: "file-text",
    primaryContact: {
      contactType: "manual",
      role: "Jeugdsecretaris",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
    },
    steps: [
      {
        description: "Ga naar de inschrijvingspagina",
        link: "/club/inschrijven",
      },
      { description: "Vul het formulier in met alle gevraagde gegevens" },
      { description: "Betaal het lidgeld" },
    ],
  },
  {
    id: "trainer-worden",
    role: ["niet-lid"],
    question: "wil graag trainer worden",
    keywords: ["trainer", "coach", "vrijwilliger", "helpen"],
    summary:
      "Neem contact op met de technisch coördinator of jeugdcoördinator.",
    category: "algemeen",
    icon: "graduation-cap",
    primaryContact: {
      contactType: "manual",
      role: "Technisch Coördinator",
      email: "technisch@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      {
        description: "Contacteer de technisch coördinator",
        contact: {
          contactType: "manual",
          role: "Technisch Coördinator",
          email: "technisch@kcvvelewijt.be",
        },
      },
      { description: "Bespreek je ervaring en beschikbaarheid" },
    ],
  },
];

const meta = {
  title: "Features/Responsibility/ResponsibilityFinder",
  component: ResponsibilityFinder,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
The **ResponsibilityFinder** helps users quickly find the right contact person by building a question:

**"IK BEN [ROLE] EN IK [QUESTION]"**

### Features
- 🎯 Smart autocomplete with keyword matching
- 📱 Mobile-optimized with large typography
- 🔍 Fuzzy search algorithm
- 👤 Role-based filtering
- ✅ Complete solution paths with steps
- 📧 Contact information integration
- 🔗 Links to org chart and relevant pages

### Use Cases
- Finding who to contact for injuries
- Registration questions
- Match schedules
- Reporting issues
- General help
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    paths: storyPaths,
    onResultSelect: fn(),
  },
  argTypes: {
    compact: {
      control: "boolean",
      description: "Compact mode for homepage integration",
      table: {
        defaultValue: { summary: "false" },
      },
    },
  },
} satisfies Meta<typeof ResponsibilityFinder>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default full-size variant for the dedicated /hulp page
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Full-size version with large typography (4xl-6xl) for maximum readability.",
      },
    },
  },
};

/**
 * Compact variant for homepage integration
 */
export const Compact: Story = {
  args: {
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Compact version (2xl-4xl) perfect for homepage blocks or smaller sections.",
      },
    },
  },
};

/**
 * With mobile viewport to test responsiveness
 */
export const Mobile: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Mobile-optimized view showing touch-friendly buttons and stacked layout.",
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Tablet view showing responsive layout adaptation.",
      },
    },
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

/**
 * Interactive test: User selects role and searches
 * (Manual interaction - click "Speler" to see the question input)
 */
export const WithRoleSelected: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the interaction flow: selecting a role reveals the question input. Click any role button to test!",
      },
    },
  },
};

/**
 * Interactive test: Full search flow
 * Manual interaction - select a role and type to see autocomplete
 */
export const WithSearchResults: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Full interaction: select a role (e.g., "Ouder") and type a query (e.g., "inschrijv") to see autocomplete suggestions appear. Try it yourself!',
      },
    },
  },
};

/**
 * Interactive test: Selecting a suggestion
 * Manual interaction - complete the full flow to see result card
 */
export const WithResultSelected: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Complete flow: select a role (e.g., "Speler") → type query (e.g., "ongeval") → click suggestion → view result card with contact info and steps. Try it yourself!',
      },
    },
  },
};

/**
 * All user roles showcased
 */
export const AllRoles: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Available Roles</h3>
      <p className="text-gray-dark">
        Users can select from these roles to filter relevant questions:
      </p>
      <ResponsibilityFinder {...args} />
      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        <h4 className="mb-2 font-bold">Role Types:</h4>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            <strong>Speler</strong> - Active players
          </li>
          <li>
            <strong>Ouder</strong> - Parents of players
          </li>
          <li>
            <strong>Trainer</strong> - Coaches and trainers
          </li>
          <li>
            <strong>Supporter</strong> - Fans and supporters
          </li>
          <li>
            <strong>Niet-lid</strong> - Non-members (sponsors, volunteers)
          </li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Overview of all available user roles with descriptions.",
      },
    },
  },
};

/**
 * Keyboard navigation test
 * Manual interaction - test keyboard accessibility
 */
export const KeyboardNavigation: Story = {
  args: {},
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: "label",
            enabled: true,
          },
          {
            id: "button-name",
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story:
          "Tests keyboard navigation and accessibility compliance. Use Tab to navigate, Enter/Space to select roles, and type to search. All interactive elements are keyboard accessible.",
      },
    },
  },
};

/**
 * Compact vs Full size comparison
 */
export const SizeComparison: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-12">
      <div>
        <h3 className="mb-4 text-2xl font-bold">Full Size (Default)</h3>
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
          <ResponsibilityFinder {...args} />
        </div>
        <p className="text-gray-medium mt-2 text-sm">
          Large typography (4xl-6xl) for dedicated /hulp page
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-2xl font-bold">Compact Size</h3>
        <div className="bg-green-main/5 rounded-lg border-2 border-dashed border-gray-300 p-6">
          <ResponsibilityFinder {...args} compact />
        </div>
        <p className="text-gray-medium mt-2 text-sm">
          Smaller typography (2xl-4xl) for homepage integration
        </p>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Side-by-side comparison of full and compact variants.",
      },
    },
  },
};

/**
 * Real-world integration example
 */
export const HomepageIntegration: Story = {
  args: {
    compact: true,
  },
  render: (args) => (
    <section className="from-green-main/5 to-green-hover/5 bg-gradient-to-br px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-gray-blue mb-4 text-3xl font-bold md:text-5xl">
            Hoe kunnen we je helpen?
          </h2>
          <p className="text-gray-dark mx-auto max-w-2xl text-lg md:text-xl">
            Vind snel de juiste contactpersoon voor jouw vraag
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl md:p-10">
          <ResponsibilityFinder {...args} />
        </div>

        <div className="mt-8 text-center">
          <a
            href="/hulp"
            className="text-green-main hover:text-green-hover font-semibold"
          >
            Bekijk alle veelgestelde vragen →
          </a>
        </div>
      </div>
    </section>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "Real-world example showing how the component integrates into a homepage section.",
      },
    },
  },
};

/**
 * Dark mode variant (if supported)
 */
export const DarkMode: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-gray-900 p-8">
        <Story />
      </div>
    ),
  ],
  parameters: {
    backgrounds: {
      default: "dark",
    },
    docs: {
      description: {
        story: "Testing component appearance on dark backgrounds.",
      },
    },
  },
};

/**
 * Accessibility test story
 */
export const AccessibilityTest: Story = {
  args: {},
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
            id: "label",
            enabled: true,
          },
          {
            id: "button-name",
            enabled: true,
          },
          {
            id: "input-image-alt",
            enabled: true,
          },
        ],
      },
      options: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      },
    },
    docs: {
      description: {
        story: "Comprehensive accessibility testing with axe-core.",
      },
    },
  },
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive playground to test different configurations. Use the controls panel to customize!",
      },
    },
  },
};

/**
 * Performance test with many interactions
 * Manual interaction - test performance with rapid role switching and typing
 */
export const PerformanceTest: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Performance test: rapidly switch between roles (Speler → Ouder → Trainer) and type/delete text to test smooth UX and responsiveness. Component should remain smooth during heavy interaction.",
      },
    },
  },
};

/**
 * VISUAL IMPROVEMENTS (Issue #435)
 * The following stories document the visual design enhancements
 */

/**
 * Inline dropdown role selector with green border
 * Shows "Ik ben [dropdown ↓] en ik [search]" layout
 */
export const InlineDropdownDesign: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
**Visual Improvement #1: Inline Dropdown**

Instead of large button cards, the role selector becomes an inline sentence:
- "Ik ben [dropdown] en ik [search input]"
- Dropdown has fat green border-bottom (4px, #4acf52)
- Cleaner, more compact design
- Typography reduced: 2xl-4xl instead of 4xl-6xl
- Maintains excellent readability while being less overwhelming
        `,
      },
    },
  },
};

/**
 * Category color coding demonstration
 * Each category gets unique color scheme
 */
export const CategoryColorCoding: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-2xl font-bold">Category Color System</h3>
        <p className="text-gray-dark mb-6">
          Each category gets distinct colors for quick visual recognition:
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
            <div className="font-bold text-blue-700">Commercieel</div>
            <div className="mt-1 text-sm text-gray-600">Blue theme</div>
          </div>

          <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4">
            <div className="font-bold text-red-700">Medisch</div>
            <div className="mt-1 text-sm text-gray-600">Red theme</div>
          </div>

          <div className="rounded-lg border-2 border-purple-400 bg-purple-50 p-4">
            <div className="font-bold text-purple-700">Administratief</div>
            <div className="mt-1 text-sm text-gray-600">Purple theme</div>
          </div>

          <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-4">
            <div className="font-bold text-orange-700">Gedrag</div>
            <div className="mt-1 text-sm text-gray-600">Orange theme</div>
          </div>

          <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-4">
            <div className="font-bold text-gray-700">Algemeen</div>
            <div className="mt-1 text-sm text-gray-600">Gray theme</div>
          </div>

          <div className="rounded-lg border-2 border-green-600 bg-green-50 p-4">
            <div className="font-bold text-green-700">Sportief</div>
            <div className="mt-1 text-sm text-gray-600">Green theme</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-2xl font-bold">In Practice</h3>
        <p className="text-gray-dark mb-4">
          Select a role and search to see colors in action:
        </p>
        <ResponsibilityFinder {...args} />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: `
**Visual Improvement #2: Category Colors**

Each category type uses consistent color coding:
- **Commercieel** (Commercial) - Blue (#3b82f6)
- **Medisch** (Medical) - Red (#ef4444)
- **Administratief** (Administrative) - Purple (#a855f7)
- **Gedrag** (Behavior) - Orange (#f97316)
- **Algemeen** (General) - Gray (#6b7280)
- **Sportief** (Sports) - Green (#16a34a)

Applied to:
- Suggestion card left border
- Icon backgrounds
- Category badges
- Result card accent bar
        `,
      },
    },
  },
};

/**
 * Enhanced suggestion cards with better visual hierarchy
 */
export const EnhancedSuggestionCards: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
**Visual Improvement #3: Suggestion Cards**

- Larger, more prominent icons (64px boxes with category colors)
- Colored left border that widens on hover (1px → 2px)
- Category badge with matching background
- Better typography hierarchy
- Smooth animations on hover (scale, shadow)
- Arrow icon appears on hover
        `,
      },
    },
  },
};

/**
 * Empty state design when no results found
 */
export const EmptyStateDesign: Story = {
  args: {},
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 text-center shadow-xl">
          <div className="mb-3 text-5xl">🔍</div>
          <h3 className="text-kcvv-gray-blue mb-1 text-lg font-bold">
            Geen resultaten gevonden
          </h3>
          <p className="text-gray-medium text-sm">
            Probeer een andere zoekterm of selecteer een andere rol
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        This appears when searching returns no matches
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Visual Improvement #4: Empty State**

Friendly message when no results are found:
- Large search emoji (🔍)
- Clear heading
- Helpful suggestion text
- Clean, non-intrusive design
        `,
      },
    },
  },
};

/**
 * Result card with category accent bar and improved design
 */
export const EnhancedResultCard: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
**Visual Improvement #5: Result Card**

- Category-colored accent bar at top (2px height)
- Larger icon in colored box (64px)
- Category badge next to title
- Contact section with category colors
- Step numbers in category color
- Better spacing and hierarchy
- Cleaner overall appearance
        `,
      },
    },
  },
};

/**
 * Animation showcase
 */
export const AnimationsShowcase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
**Visual Improvement #6: Smooth Animations**

All animations use smooth transitions:
- Fade-in for suggestions (0.3s ease-out)
- Scale on hover for cards (1.01x)
- Icon scale on hover (1.1x)
- Dropdown rotation (chevron)
- Border width transitions
- Color transitions

All animations use \`transition-all duration-200-300\` for consistency
        `,
      },
    },
  },
};
