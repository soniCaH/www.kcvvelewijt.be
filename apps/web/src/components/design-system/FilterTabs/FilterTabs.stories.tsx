import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { FirstAid, SoccerBall } from "@/lib/icons.redesign";
import { FilterTabs, type FilterTab, type FilterTabsProps } from "./FilterTabs";

/**
 * FilterTabs Component Stories
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Each chip is a paper-card body in
 * cream-soft + ink border + offset shadow; active inverts to ink + cream
 * + soft shadow. Counts render inline after a 1 px hairline pipe — no pill,
 * no badge. Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html.
 *
 * The single filter primitive (#2429 / #2564) — absorbs every filter row on
 * the site: News categories, search result types, `/kalender`, `/evenementen`,
 * and both `/hulp` rows (audience + category).
 */
const meta = {
  title: "UI/FilterTabs",
  component: FilterTabs,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Unified filter component for consistent filtering UI across the application. Direction D paper-chip vocabulary: ink-bordered cream-soft chips with mono caps labels, ink-invert active state, and inline counts using a 1 px hairline pipe divider (no pill, no badge). One chip size site-wide; per-facet colour and a leading glyph are both optional props.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  args: {
    onChange: fn(),
  },
  argTypes: {
    showCounts: {
      control: "boolean",
      description:
        "Toggle the inline paper-chip count rendered after the hairline pipe divider",
    },
    renderAsLinks: {
      control: "boolean",
      description: "Render as links instead of buttons",
    },
    surface: {
      control: "select",
      options: ["paper", "inverse"],
      description:
        "The row's ground — 'inverse' for a row hosted on an ink/dark ground",
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

// Colour-coded facet tabs. `/kalender` is the only surface with a
// Wedstrijden chip, and it's on cream; `/evenementen` is the only dark row
// and has no Wedstrijden chip — the two combinations below match what each
// page actually ships, not a hybrid neither does (#2564 review item 12).
const kalenderTabs: FilterTab[] = [
  { value: "all", label: "Alles" },
  {
    value: "Wedstrijden",
    label: "Wedstrijden",
    color: { border: "border-card-red", fill: "bg-card-red text-cream" },
  },
  {
    value: "Clubevent",
    label: "Clubevent",
    color: { border: "border-jersey-deep", fill: "bg-jersey-deep text-white" },
  },
  {
    value: "Supportersactiviteit",
    label: "Supportersactiviteit",
    color: { border: "border-warm", fill: "bg-warm text-ink" },
  },
  {
    value: "Jeugdwerking",
    label: "Jeugdwerking",
    color: {
      border: "border-jersey-bright",
      fill: "bg-jersey-bright text-ink",
    },
  },
  { value: "Andere", label: "Andere" },
];

const evenementenTabs: FilterTab[] = kalenderTabs.filter(
  (tab) => tab.value !== "Wedstrijden",
);

// The `/hulp` category row — the leading-glyph slot in use.
const hulpCategoryTabs: FilterTab[] = [
  { value: "alles", label: "Alles" },
  { value: "medisch", label: "Medisch", icon: FirstAid },
  { value: "sportief", label: "Sportief", icon: SoccerBall },
];

/**
 * Interactive story wrapper that renders FilterTabs and shows the currently selected tab.
 *
 * Forwards the provided FilterTabsProps to the FilterTabs component and manages selection state internally.
 *
 * @param args - Props forwarded to FilterTabs; when `args.activeTab` is not provided the first tab's `value` is used as the initial selection.
 * @returns A JSX element containing the FilterTabs bound to internal state and a panel displaying the currently selected tab value.
 */
// Re-mount the stateful inner whenever the Storybook controls change
// `activeTab` or the `tabs` array, so the preview + readout track the
// controls. Using a `key` to reset state is React's recommended pattern
// over a state-syncing useEffect (see react.dev "you might not need an
// effect"). Forwarding args.onChange in handleChange keeps the Actions
// panel populated.
function InteractiveFilterTabs(args: FilterTabsProps) {
  // Stable signature of tab identity — joining `value`s catches edits,
  // reorders, and same-length swaps that `tabs.length` alone would miss.
  const stateKey = `${args.activeTab ?? ""}-${args.tabs
    .map((t) => t.value)
    .join(",")}`;
  return <InteractiveFilterTabsInner key={stateKey} {...args} />;
}

function InteractiveFilterTabsInner(args: FilterTabsProps) {
  const [activeTab, setActiveTab] = useState(
    args.activeTab || args.tabs[0].value,
  );

  const handleChange = (value: string) => {
    setActiveTab(value);
    args.onChange?.(value);
  };

  return (
    <div className="space-y-6">
      <FilterTabs {...args} activeTab={activeTab} onChange={handleChange} />
      <div className="border-paper-edge bg-cream-soft border p-4">
        <p className="text-ink-muted font-mono text-xs tracking-wider uppercase">
          Selected: <span className="text-jersey-deep">{activeTab}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Default filter tabs with counts.
 * Used in most filtering scenarios across the app.
 */
export const Default: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: departmentTabs,
    activeTab: "all",
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
    showCounts: true,
    ariaLabel: "Filter sponsors by tier",
  },
};

/**
 * Per-facet colour — `/kalender`'s by-type row. Colour is a prop
 * (`FilterTab.color`), sourced from the domain's own colour map so this
 * primitive stays colour-agnostic. "Alles" and "Andere" carry no colour and
 * render the neutral Direction D chip.
 */
export const ColorCoded: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: kalenderTabs,
    activeTab: "all",
    showCounts: false,
    ariaLabel: "Filter kalender op type",
  },
};

/**
 * `surface="inverse"` — for a row hosted on an ink/dark ground
 * (`/evenementen` on `bg-jersey-deep-dark`), where a hard ink shadow would
 * be invisible. Renders `/evenementen`'s own tab set (no Wedstrijden chip —
 * that one's `/kalender`-only, and `/kalender` is on cream).
 */
export const OnDarkGround: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: evenementenTabs,
    activeTab: "all",
    showCounts: false,
    surface: "inverse",
    ariaLabel: "Filter evenementen op type",
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark p-6">
        <Story />
      </div>
    ),
  ],
};

/**
 * Leading-glyph slot — an optional Phosphor Fill icon before the label
 * (#2429 resolution addendum, "rule 9"). `/hulp`'s category row uses it.
 */
export const WithLeadingGlyph: Story = {
  render: (args) => <InteractiveFilterTabs {...args} />,
  args: {
    tabs: hulpCategoryTabs,
    activeTab: "alles",
    showCounts: false,
    ariaLabel: "Filter op categorie",
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
    showCounts: true,
    ariaLabel: "Filter by department (keyboard accessible)",
  },
  // A story-level `parameters.a11y` override that locally re-enabled
  // `color-contrast` (redundant `interactive-supports-focus` alongside it)
  // predates #3188's global a11y gate. It's removed rather than kept: the
  // acceptance criteria require color-contrast to be disabled in exactly
  // ONE place (`.storybook/preview.ts`), and every other rule already gates
  // globally by default — this override no longer adds anything.
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
    showCounts: true,
    ariaLabel: "Filter by category",
  },
  globals: {
    viewport: { value: "kcvvMobile" },
  },
  // #2803
  parameters: {
    vr: { viewports: ["mobile"] },
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
    showCounts: true,
    ariaLabel: "Filter by category",
  },
  globals: {
    viewport: { value: "tablet" },
  },
  // #2803
  parameters: {
    vr: { viewports: ["tablet"] },
  },
};
