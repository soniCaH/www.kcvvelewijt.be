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

const meta = {
  title: "UI/BrandedTabs",
  component: BrandedTabs,
  tags: ["autodocs"],
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
    return <Playground />;
  },
};
