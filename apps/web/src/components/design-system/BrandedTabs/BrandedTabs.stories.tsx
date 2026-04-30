/**
 * BrandedTabs Component Stories
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Each tab is a cream paper card with an
 * ink border + offset shadow; active inverts to ink + cream + soft shadow.
 * Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { BrandedTabs, type BrandedTab } from "./BrandedTabs";

const TABS: BrandedTab[] = [
  { id: "info", label: "Info" },
  { id: "spelers", label: "Spelers" },
  { id: "wedstrijden", label: "Wedstrijden" },
  { id: "klassement", label: "Klassement" },
];

const MANY_TABS: BrandedTab[] = [
  { id: "info", label: "Info" },
  { id: "spelers", label: "Spelers" },
  { id: "wedstrijden", label: "Wedstrijden" },
  { id: "klassement", label: "Klassement" },
  { id: "statistieken", label: "Statistieken" },
  { id: "transfers", label: "Transfers" },
  { id: "geschiedenis", label: "Geschiedenis" },
  { id: "media", label: "Media" },
];

const meta = {
  title: "UI/BrandedTabs",
  component: BrandedTabs,
  tags: ["autodocs", "vr"],
  args: {
    tabs: TABS,
    activeTabId: "spelers",
    onTabChange: fn(),
    ariaLabel: "Team detail secties",
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof BrandedTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default — controlled tab bar with `activeTabId` set to "spelers".
 */
export const Default: Story = {};

/**
 * Three tabs (typical for short navigation bars).
 */
export const ThreeTabs: Story = {
  args: {
    tabs: TABS.slice(0, 3),
    activeTabId: "info",
  },
};

/**
 * Interactive playground — switches the active tab on click using local state.
 *
 * The `key` on `<Playground>` resets the local state whenever Storybook
 * controls change `activeTabId` or the `tabs` array, so the preview tracks
 * the controls panel. Using `key`-driven remount over a state-syncing
 * useEffect is React's recommended pattern (see react.dev "you might not
 * need an effect").
 */
export const Interactive: Story = {
  render: (args) => {
    function Playground() {
      const [active, setActive] = useState(args.activeTabId);
      return (
        <BrandedTabs
          tabs={args.tabs}
          activeTabId={active}
          onTabChange={(id) => {
            setActive(id);
            args.onTabChange(id);
          }}
          ariaLabel={args.ariaLabel}
        />
      );
    }
    return (
      <Playground
        key={`${args.activeTabId}-${args.tabs.map((t) => t.id).join(",")}`}
      />
    );
  },
};

/**
 * Many tabs — demonstrates scroll arrows when tabs overflow on narrow screens.
 * Resize the viewport to see the navigation arrows appear.
 */
export const ManyTabs: Story = {
  args: {
    tabs: MANY_TABS,
    activeTabId: "info",
  },
  render: (args) => {
    function Playground() {
      const [active, setActive] = useState(args.activeTabId);
      return (
        <div style={{ maxWidth: 400 }}>
          <BrandedTabs
            tabs={args.tabs}
            activeTabId={active}
            onTabChange={(id) => {
              setActive(id);
              args.onTabChange(id);
            }}
            ariaLabel={args.ariaLabel}
          />
        </div>
      );
    }
    return (
      <Playground
        key={`${args.activeTabId}-${args.tabs.map((t) => t.id).join(",")}`}
      />
    );
  },
};

/**
 * Mobile viewport — shows scroll arrows with constrained width.
 */
export const Mobile: Story = {
  args: {
    tabs: MANY_TABS,
    activeTabId: "spelers",
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
