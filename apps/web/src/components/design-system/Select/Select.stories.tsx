/**
 * Select Component Stories — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./Select";
import { Label } from "../Label";
import { forceFieldFocusRing } from "../_internal/field-vr-focus";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 2.A.4 form atom (Direction C — paper-card emphasis). Native `<select>` styled with the same eight-state field machine as Input/Textarea, plus a Phosphor `CaretDown` (fill) chevron. Open-menu styling is OS-rendered (deferred to a future combobox primitive).",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    error: { control: "text" },
    hint: { control: "text" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  // Every `<Select>` needs an accessible name (#3188 — axe `select-name`).
  // `Default` below spreads `args` and inherits this; every other bare
  // demo `render` here sets its own `aria-label` since none has an
  // adjacent visible label. `StateMachine`/`FilterPanel` DO have a visible
  // `<Label htmlFor>` and pair it with a matching `id` instead — never
  // both, which would risk the label text and the AT-announced name
  // drifting apart (WCAG 2.5.3).
  args: { "aria-label": "Voorbeeldveld" },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const teamOptions = (
  <>
    <option value="aploeg">A-ploeg</option>
    <option value="bploeg">B-ploeg</option>
    <option value="u21">U21</option>
  </>
);

export const Default: Story = {
  render: (args) => (
    <Select {...args} className="w-64">
      {teamOptions}
    </Select>
  ),
  args: { placeholder: "Kies een ploeg" },
};

export const Filled: Story = {
  render: () => (
    <Select className="w-64" defaultValue="aploeg" aria-label="Ploeg">
      {teamOptions}
    </Select>
  ),
};

export const Focused: Story = {
  render: () => (
    <Select
      className="w-64"
      placeholder="Kies een ploeg"
      aria-label="Ploeg"
      autoFocus
    >
      {teamOptions}
    </Select>
  ),
  // VR determinism (#3033 pattern, #3137) — see field-vr-focus.ts. Forces
  // the focus chrome from story state instead of racing the runner's real
  // frame focus.
  play: async ({ canvasElement }) => {
    forceFieldFocusRing(canvasElement);
  },
};

export const FilledFocused: Story = {
  render: () => (
    <Select className="w-64" defaultValue="bploeg" aria-label="Ploeg" autoFocus>
      {teamOptions}
    </Select>
  ),
  play: async ({ canvasElement }) => {
    forceFieldFocusRing(canvasElement);
  },
};

export const WithError: Story = {
  render: () => (
    <Select
      className="w-64"
      error="Kies een geldige ploeg."
      placeholder="Kies een ploeg"
      aria-label="Ploeg"
    >
      {teamOptions}
    </Select>
  ),
};

export const ErrorFocused: Story = {
  render: () => (
    <Select
      className="w-64"
      error="Kies een geldige ploeg."
      placeholder="Kies een ploeg"
      aria-label="Ploeg"
      autoFocus
    >
      {teamOptions}
    </Select>
  ),
  play: async ({ canvasElement }) => {
    forceFieldFocusRing(canvasElement);
  },
};

export const Disabled: Story = {
  render: () => (
    <Select className="w-64" disabled defaultValue="aploeg" aria-label="Ploeg">
      {teamOptions}
    </Select>
  ),
};

export const WithHint: Story = {
  render: () => (
    <Select
      className="w-64"
      hint="Dit bepaalt welke wedstrijden je ziet."
      placeholder="Alle ploegen"
      aria-label="Ploeg"
    >
      {teamOptions}
    </Select>
  ),
};

export const Small: Story = {
  render: () => (
    <Select className="w-48" size="sm" placeholder="Klein" aria-label="Ploeg">
      {teamOptions}
    </Select>
  ),
};

export const Large: Story = {
  render: () => (
    <Select className="w-72" size="lg" placeholder="Groot" aria-label="Ploeg">
      {teamOptions}
    </Select>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <Select size="sm" placeholder="Small (sm)" aria-label="Small (sm)">
        <option value="1">Optie 1</option>
      </Select>
      <Select
        size="md"
        placeholder="Medium (md) — default"
        aria-label="Medium (md) — default"
      >
        <option value="1">Optie 1</option>
      </Select>
      <Select size="lg" placeholder="Large (lg)" aria-label="Large (lg)">
        <option value="1">Optie 1</option>
      </Select>
    </div>
  ),
};

export const StateMachine: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-2 gap-x-6 gap-y-5">
      <div>
        <Label htmlFor="select-state-default">Default</Label>
        <Select id="select-state-default" placeholder="Kies een ploeg">
          {teamOptions}
        </Select>
      </div>
      <div>
        <Label htmlFor="select-state-filled">Filled</Label>
        <Select id="select-state-filled" defaultValue="aploeg">
          {teamOptions}
        </Select>
      </div>
      <div>
        <Label htmlFor="select-state-error">Error</Label>
        <Select
          id="select-state-error"
          placeholder="Kies een ploeg"
          error="Kies een geldige ploeg."
        >
          {teamOptions}
        </Select>
      </div>
      <div>
        <Label htmlFor="select-state-disabled">Disabled</Label>
        <Select id="select-state-disabled" defaultValue="aploeg" disabled>
          {teamOptions}
        </Select>
      </div>
    </div>
  ),
};

export const FilterPanel: Story = {
  render: () => (
    <div className="grid w-[500px] grid-cols-2 gap-4">
      <div>
        <Label htmlFor="fp-tier">Niveau</Label>
        <Select id="fp-tier" placeholder="Alle sponsors">
          <option value="gold">Goud</option>
          <option value="silver">Zilver</option>
          <option value="bronze">Brons</option>
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
};
