/**
 * Select Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./Select";
import { Label } from "../Label";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Native select with KCVV design system styling and a custom chevron icon. Shares visual language with Input and Textarea.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    error: { control: "text" },
    hint: { control: "text" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args) => (
    <Select {...args} className="w-64">
      <option value="gold">⭐ Goud</option>
      <option value="silver">🥈 Zilver</option>
      <option value="bronze">🥉 Brons</option>
    </Select>
  ),
  args: {
    placeholder: "Kies een niveau",
  },
};

export const Small: Story = {
  render: (args) => (
    <Select {...args} size="sm" className="w-48">
      <option value="aploeg">A-ploeg</option>
      <option value="bploeg">B-ploeg</option>
      <option value="u21">U21</option>
    </Select>
  ),
};

export const Large: Story = {
  render: (args) => (
    <Select {...args} size="lg" className="w-72">
      <option value="aploeg">A-ploeg</option>
      <option value="bploeg">B-ploeg</option>
      <option value="u21">U21</option>
    </Select>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <Select size="sm" placeholder="Small (sm)">
        <option value="1">Optie 1</option>
      </Select>
      <Select size="md" placeholder="Medium (md) — default">
        <option value="1">Optie 1</option>
      </Select>
      <Select size="lg" placeholder="Large (lg)">
        <option value="1">Optie 1</option>
      </Select>
    </div>
  ),
};

export const WithHint: Story = {
  render: (args) => (
    <Select
      {...args}
      className="w-64"
      hint="Dit bepaalt welke wedstrijden je ziet."
    >
      <option value="all">Alle ploegen</option>
      <option value="aploeg">A-ploeg</option>
      <option value="bploeg">B-ploeg</option>
    </Select>
  ),
  args: {
    placeholder: "Kies een ploeg",
  },
};

export const WithError: Story = {
  render: (args) => (
    <Select {...args} className="w-64" error="Kies een geldige optie.">
      <option value="gold">⭐ Goud</option>
      <option value="silver">🥈 Zilver</option>
    </Select>
  ),
  args: {
    placeholder: "Kies een niveau",
  },
};

export const Disabled: Story = {
  render: () => (
    <Select className="w-64" disabled defaultValue="aploeg">
      <option value="aploeg">A-ploeg</option>
    </Select>
  ),
};

/**
 * Select paired with Label — typical filter form usage
 */
export const WithLabel: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="tier-select">Niveau</Label>
      <Select id="tier-select" placeholder="Alle sponsors">
        <option value="gold">⭐ Goud</option>
        <option value="silver">🥈 Zilver</option>
        <option value="bronze">🥉 Brons</option>
      </Select>
    </div>
  ),
};

/**
 * Filter panel with two selects side by side
 */
export const FilterPanel: Story = {
  render: () => (
    <div className="grid w-[500px] grid-cols-2 gap-4">
      <div>
        <Label htmlFor="fp-tier">Niveau</Label>
        <Select id="fp-tier" placeholder="Alle sponsors">
          <option value="gold">⭐ Goud</option>
          <option value="silver">🥈 Zilver</option>
          <option value="bronze">🥉 Brons</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="fp-sort">Sorteren</Label>
        <Select id="fp-sort" defaultValue="tier">
          <option value="tier">Op niveau</option>
          <option value="name">Op naam (A-Z)</option>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Two Select fields side by side — typical filter panel layout.",
      },
    },
  },
};

export const Playground: Story = {
  render: (args) => (
    <Select {...args} className="w-64">
      <option value="1">Optie 1</option>
      <option value="2">Optie 2</option>
      <option value="3">Optie 3</option>
    </Select>
  ),
  args: {
    placeholder: "Kies een optie",
    size: "md",
  },
};
