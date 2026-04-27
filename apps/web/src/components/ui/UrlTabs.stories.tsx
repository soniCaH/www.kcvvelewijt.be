/**
 * UrlTabs Component Stories
 *
 * URL-synced tabs that read/write the active tab to the URL query parameter.
 * Built on @radix-ui/react-tabs, integrated with Next.js App Router navigation hooks.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as Tabs from "@radix-ui/react-tabs";
import { UrlTabs } from "./url-tabs";

const meta = {
  title: "UI/UrlTabs",
  component: UrlTabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "vr"],
  // children is required by UrlTabsProps but always supplied via render()
  args: {
    defaultValue: "tab-1",
    validTabs: ["tab-1", "tab-2"],
    children: null,
  },
  argTypes: {
    defaultValue: {
      control: "text",
      description: "Default tab value when no URL param is set",
    },
    validTabs: {
      control: false,
      description: "Array of valid tab values used to validate the URL param",
    },
    paramName: {
      control: "text",
      description: 'URL query parameter name (default: "tab")',
    },
    className: {
      control: "text",
      description: "Additional CSS classes on the Tabs.Root element",
    },
  },
} satisfies Meta<typeof UrlTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const tabTriggerClass =
  "px-4 py-2 text-sm font-semibold text-kcvv-gray border-b-2 border-transparent hover:text-kcvv-green-bright hover:border-kcvv-green-bright/30 data-[state=active]:border-kcvv-green-bright data-[state=active]:text-kcvv-green-bright transition-colors";

/**
 * Default three-tab example — Info / Wedstrijden / Standen.
 * Switching tabs updates the `?tab=` query parameter in the address bar.
 */
export const Default: Story = {
  args: {
    defaultValue: "info",
    validTabs: ["info", "wedstrijden", "standen"],
  },
  render: (args) => (
    <UrlTabs {...args}>
      <Tabs.List className="mb-4 flex gap-1 border-b border-gray-200">
        <Tabs.Trigger value="info" className={tabTriggerClass}>
          Info
        </Tabs.Trigger>
        <Tabs.Trigger value="wedstrijden" className={tabTriggerClass}>
          Wedstrijden
        </Tabs.Trigger>
        <Tabs.Trigger value="standen" className={tabTriggerClass}>
          Standen
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="info" className="py-2">
        <p className="text-kcvv-gray-dark">
          Teaminfo: seizoen, ploegnummer, trainer en trainingsschema.
        </p>
      </Tabs.Content>
      <Tabs.Content value="wedstrijden" className="py-2">
        <p className="text-kcvv-gray-dark">
          Overzicht van alle wedstrijden in dit seizoen.
        </p>
      </Tabs.Content>
      <Tabs.Content value="standen" className="py-2">
        <p className="text-kcvv-gray-dark">
          Huidige rangschikking in de reeks.
        </p>
      </Tabs.Content>
    </UrlTabs>
  ),
};

/**
 * Pre-selected tab via URL parameter simulation.
 * Demonstrates how the component reads `?tab=wedstrijden` from the URL on load.
 */
export const PreSelectedFromUrl: Story = {
  args: {
    defaultValue: "info",
    validTabs: ["info", "wedstrijden", "standen"],
  },
  parameters: {
    nextjs: {
      navigation: {
        query: { tab: "wedstrijden" },
      },
    },
  },
  render: (args) => (
    <UrlTabs {...args}>
      <Tabs.List className="mb-4 flex gap-1 border-b border-gray-200">
        <Tabs.Trigger value="info" className={tabTriggerClass}>
          Info
        </Tabs.Trigger>
        <Tabs.Trigger value="wedstrijden" className={tabTriggerClass}>
          Wedstrijden
        </Tabs.Trigger>
        <Tabs.Trigger value="standen" className={tabTriggerClass}>
          Standen
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="info" className="py-2">
        <p className="text-kcvv-gray-dark">Teaminfo inhoud.</p>
      </Tabs.Content>
      <Tabs.Content value="wedstrijden" className="py-2">
        <p className="text-kcvv-gray-dark">
          Wedstrijden tab is actief via <code>?tab=wedstrijden</code> in de URL.
        </p>
      </Tabs.Content>
      <Tabs.Content value="standen" className="py-2">
        <p className="text-kcvv-gray-dark">Standen inhoud.</p>
      </Tabs.Content>
    </UrlTabs>
  ),
};

/**
 * Custom query parameter name via `paramName` prop.
 * Shows `?sectie=spelers` instead of `?tab=spelers`.
 */
export const WithCustomParam: Story = {
  args: {
    defaultValue: "club",
    validTabs: ["club", "spelers", "staff"],
    paramName: "sectie",
  },
  render: (args) => (
    <UrlTabs {...args}>
      <Tabs.List className="mb-4 flex gap-1 border-b border-gray-200">
        <Tabs.Trigger value="club" className={tabTriggerClass}>
          Club
        </Tabs.Trigger>
        <Tabs.Trigger value="spelers" className={tabTriggerClass}>
          Spelers
        </Tabs.Trigger>
        <Tabs.Trigger value="staff" className={tabTriggerClass}>
          Staff
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="club" className="py-2">
        <p className="text-kcvv-gray-dark">
          Clubinfo — param is <code>?sectie=</code> (not <code>?tab=</code>)
        </p>
      </Tabs.Content>
      <Tabs.Content value="spelers" className="py-2">
        <p className="text-kcvv-gray-dark">Spelerslijst.</p>
      </Tabs.Content>
      <Tabs.Content value="staff" className="py-2">
        <p className="text-kcvv-gray-dark">Staf en technisch kader.</p>
      </Tabs.Content>
    </UrlTabs>
  ),
};

/**
 * Two independent UrlTabs on the same page, each with their own URL param.
 * They don't interfere with each other.
 */
export const MultipleTabGroups: Story = {
  args: {
    defaultValue: "info",
    validTabs: ["info", "wedstrijden"],
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-title text-kcvv-gray-blue mb-2 font-bold">
          Ploeg A — param: <code className="font-mono text-sm">?tab=</code>
        </h3>
        <UrlTabs
          defaultValue="info"
          validTabs={["info", "wedstrijden"]}
          paramName="tab"
        >
          <Tabs.List className="mb-4 flex gap-1 border-b border-gray-200">
            <Tabs.Trigger value="info" className={tabTriggerClass}>
              Info
            </Tabs.Trigger>
            <Tabs.Trigger value="wedstrijden" className={tabTriggerClass}>
              Wedstrijden
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="info" className="py-2">
            <p className="text-kcvv-gray-dark">A-ploeg info.</p>
          </Tabs.Content>
          <Tabs.Content value="wedstrijden" className="py-2">
            <p className="text-kcvv-gray-dark">A-ploeg wedstrijden.</p>
          </Tabs.Content>
        </UrlTabs>
      </div>

      <div>
        <h3 className="font-title text-kcvv-gray-blue mb-2 font-bold">
          Ploeg B — param: <code className="font-mono text-sm">?sectie=</code>
        </h3>
        <UrlTabs
          defaultValue="info"
          validTabs={["info", "standen"]}
          paramName="sectie"
        >
          <Tabs.List className="mb-4 flex gap-1 border-b border-gray-200">
            <Tabs.Trigger value="info" className={tabTriggerClass}>
              Info
            </Tabs.Trigger>
            <Tabs.Trigger value="standen" className={tabTriggerClass}>
              Standen
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="info" className="py-2">
            <p className="text-kcvv-gray-dark">B-ploeg info.</p>
          </Tabs.Content>
          <Tabs.Content value="standen" className="py-2">
            <p className="text-kcvv-gray-dark">B-ploeg standen.</p>
          </Tabs.Content>
        </UrlTabs>
      </div>
    </div>
  ),
};

/**
 * Interactive playground — all props editable via Storybook controls.
 */
export const Playground: Story = {
  args: {
    defaultValue: "tab-1",
    validTabs: ["tab-1", "tab-2", "tab-3"],
    paramName: "tab",
    className: "",
  },
  render: (args) => (
    <UrlTabs {...args}>
      <Tabs.List className="mb-4 flex gap-1 border-b border-gray-200">
        <Tabs.Trigger value="tab-1" className={tabTriggerClass}>
          Tab 1
        </Tabs.Trigger>
        <Tabs.Trigger value="tab-2" className={tabTriggerClass}>
          Tab 2
        </Tabs.Trigger>
        <Tabs.Trigger value="tab-3" className={tabTriggerClass}>
          Tab 3
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab-1" className="py-2">
        <p className="text-kcvv-gray-dark">Content for Tab 1.</p>
      </Tabs.Content>
      <Tabs.Content value="tab-2" className="py-2">
        <p className="text-kcvv-gray-dark">Content for Tab 2.</p>
      </Tabs.Content>
      <Tabs.Content value="tab-3" className="py-2">
        <p className="text-kcvv-gray-dark">Content for Tab 3.</p>
      </Tabs.Content>
    </UrlTabs>
  ),
};
