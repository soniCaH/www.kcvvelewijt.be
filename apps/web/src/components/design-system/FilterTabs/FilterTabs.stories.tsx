import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { FilterTabs, type FilterTab, type FilterTabsProps } from "./FilterTabs";

/**
 * FilterTabs - Unified filter/tab component
 *
 * A consistent, reusable filter component used across the application for:
 * - News category filtering
 * - Organigram department filtering
 * - Sponsor tier filtering
 * - Responsibility finder role filtering
 *
 * Features:
 * - Mobile-responsive with horizontal scrolling
 * - Optional count badges
 * - Multiple size variants (sm, md, lg)
 * - Accessible and keyboard navigable
 * - Consistent KCVV green styling
 */
const meta = {
  title: "UI/FilterTabs",
  component: FilterTabs,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Unified filter component for consistent filtering UI across the application. Features mobile scrolling, count badges, and multiple size variants.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  args: {
    onChange: fn(),
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    showCounts: {
      control: "boolean",
      description: "Show count badges",
    },
    renderAsLinks: {
      control: "boolean",
      description: "Render as links instead of buttons",
    },
  },
} satisfies Meta<typeof FilterTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const departmentTabs: FilterTab[] = [
  { value: "all", label: "Alle", count: 31 },
  { value: "hoofdbestuur", label: "Hoofdbestuur", count: 17 },
  { value: "jeugdbestuur", label: "Jeugdbestuur", count: 14 },
];

const categoryTabs: FilterTab[] = [
  { value: "all", label: "Alles", count: 156 },
  { value: "kcvv", label: "KCVV", count: 45 },
  { value: "jeugd", label: "Jeugd", count: 32 },
  { value: "beloften", label: "Beloften", count: 18 },
  { value: "tweede-elftal", label: "Tweede Elftal", count: 15 },
  { value: "vrouwen", label: "Vrouwen", count: 12 },
  { value: "recreanten", label: "Recreanten", count: 8 },
  { value: "internationaal", label: "Internationaal", count: 26 },
];

const sponsorTabs: FilterTab[] = [
  { value: "all", label: "Alle sponsors", count: 45 },
  { value: "main", label: "Hoofdsponsors", count: 8 },
  { value: "gold", label: "Goud", count: 12 },
  { value: "silver", label: "Zilver", count: 15 },
  { value: "bronze", label: "Brons", count: 10 },
];

const roleTabs: FilterTab[] = [
  { value: "parent", label: "Ouder" },
  { value: "player", label: "Speler" },
  { value: "trainer", label: "Trainer" },
  { value: "volunteer", label: "Vrijwilliger" },
];

/**
 * Interactive story wrapper that renders FilterTabs and shows the currently selected tab.
 *
 * Forwards the provided FilterTabsProps to the FilterTabs component and manages selection state internally.
 *
 * @param args - Props forwarded to FilterTabs; when `args.activeTab` is not provided the first tab's `value` is used as the initial selection.
 * @returns A JSX element containing the FilterTabs bound to internal state and a panel displaying the currently selected tab value.
 */
function InteractiveFilterTabs(args: FilterTabsProps) {
  const [activeTab, setActiveTab] = useState(
    args.activeTab || args.tabs[0].value,
  );

  return (
    <div className="space-y-6">
      <FilterTabs {...args} activeTab={activeTab} onChange={setActiveTab} />
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-kcvv-gray-blue text-sm font-medium">
          Selected: <span className="text-kcvv-green-bright">{activeTab}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Default medium-sized filter tabs with counts.
 * Used in most filtering scenarios across the app.
 */
export const Default: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: departmentTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter by department",
  },
};

/**
 * Small variant - compact design for tight spaces.
 * Good for sidebars or mobile interfaces.
 */
export const Small: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: departmentTabs,
    activeTab: "all",
    size: "sm",
    showCounts: true,
    ariaLabel: "Filter by department",
  },
};

/**
 * Large variant - prominent filtering for main content areas.
 * Good for hero sections or primary filters.
 */
export const Large: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: departmentTabs,
    activeTab: "all",
    size: "lg",
    showCounts: true,
    ariaLabel: "Filter by department",
  },
};

/**
 * Without count badges - cleaner appearance.
 * Use when counts are not relevant or clutter the UI.
 */
export const WithoutCounts: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: roleTabs,
    activeTab: "parent",
    size: "md",
    showCounts: false,
    ariaLabel: "Select role",
  },
};

/**
 * News category filter - many options with horizontal scrolling.
 * Demonstrates mobile scrolling arrows on overflow.
 */
export const NewsCategoryFilter: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: categoryTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter news by category",
  },
};

/**
 * Sponsor tier filter - hierarchical filtering.
 * Used on the sponsors page to filter by tier.
 */
export const SponsorTierFilter: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: sponsorTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter sponsors by tier",
  },
};

/**
 * Mobile viewport (375px) - demonstrates scrolling behavior.
 * Arrow buttons appear when tabs overflow.
 */
export const Mobile: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: categoryTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter by category",
  },
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};

/**
 * Tablet viewport (768px) - fewer items require scrolling.
 * Shows responsive behavior at medium breakpoints.
 */
export const Tablet: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: categoryTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter by category",
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

/**
 * With Link rendering - for Next.js routing.
 * Tabs render as <a> tags with href attributes.
 */
export const AsLinks: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: [
      { value: "all", label: "Alles", count: 156, href: "/nieuws" },
      {
        value: "kcvv",
        label: "KCVV",
        count: 45,
        href: "/nieuws?categorie=kcvv",
      },
      {
        value: "jeugd",
        label: "Jeugd",
        count: 32,
        href: "/nieuws?categorie=jeugd",
      },
    ],
    activeTab: "all",
    size: "md",
    showCounts: true,
    renderAsLinks: true,
    ariaLabel: "Filter news by category",
  },
};

/**
 * Two options only - simplest filtering scenario.
 * Good for binary filters (e.g., Active/Archived).
 */
export const TwoOptions: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: [
      { value: "active", label: "Active", count: 45 },
      { value: "archived", label: "Archived", count: 12 },
    ],
    activeTab: "active",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter by status",
  },
};

/**
 * Many options (12+) - stress test for scrolling.
 * Demonstrates arrow navigation with many tabs.
 */
export const ManyOptions: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: [
      { value: "all", label: "Alles", count: 250 },
      { value: "u6", label: "U6", count: 15 },
      { value: "u7", label: "U7", count: 18 },
      { value: "u8", label: "U8", count: 20 },
      { value: "u9", label: "U9", count: 22 },
      { value: "u10", label: "U10", count: 24 },
      { value: "u11", label: "U11", count: 26 },
      { value: "u12", label: "U12", count: 28 },
      { value: "u13", label: "U13", count: 25 },
      { value: "u14", label: "U14", count: 23 },
      { value: "u15", label: "U15", count: 21 },
      { value: "u16", label: "U16", count: 19 },
      { value: "u17", label: "U17", count: 17 },
    ],
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter by age group",
  },
};

/**
 * Accessibility test - keyboard navigation and screen readers.
 * Use Tab to navigate, Space/Enter to select.
 */
export const AccessibilityTest: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: departmentTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
    ariaLabel: "Filter by department (keyboard accessible)",
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "interactive-supports-focus",
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * Size comparison - all three sizes side-by-side.
 * Visual reference for choosing the right size.
 */
export const SizeComparison: Story = {
  args: {
    tabs: departmentTabs,
    activeTab: "all",
    size: "md",
    showCounts: true,
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-kcvv-gray-blue mb-3 text-sm font-semibold">
          Small
        </h3>
        <FilterTabs
          tabs={departmentTabs}
          activeTab="all"
          onChange={() => {}}
          size="sm"
          showCounts={true}
        />
      </div>
      <div>
        <h3 className="text-kcvv-gray-blue mb-3 text-sm font-semibold">
          Medium (Default)
        </h3>
        <FilterTabs
          tabs={departmentTabs}
          activeTab="all"
          onChange={() => {}}
          size="md"
          showCounts={true}
        />
      </div>
      <div>
        <h3 className="text-kcvv-gray-blue mb-3 text-sm font-semibold">
          Large
        </h3>
        <FilterTabs
          tabs={departmentTabs}
          activeTab="all"
          onChange={() => {}}
          size="lg"
          showCounts={true}
        />
      </div>
    </div>
  ),
};
