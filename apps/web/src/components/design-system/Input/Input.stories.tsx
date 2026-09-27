/**
 * Input Component Stories — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./Input";
import { Label } from "../Label";
import { MagnifyingGlass, PaperPlaneTilt } from "@/lib/icons.redesign";
import { forceFieldFocusRing } from "../_internal/field-vr-focus";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 2.A.4 form atom (Direction C — paper-card emphasis). Implements the eight-state field machine: default / hover / focus / filled / filled+focus / error / error+focus / disabled. Sharp corners, 2px borders with three ink weights, paper-soft resting shadow, ink-press focus.",
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
  // Every `<Input>` needs an accessible name (#3188 — axe `label`). These
  // bare demo stories have no adjacent visible label, so `aria-label` is
  // the right mechanism here; every args-based story below inherits this
  // default. `render`-based stories that DO have a visible `<Label
  // htmlFor>` pair it with a matching `id` instead — never both, which
  // would risk the label text and the AT-announced name drifting apart
  // (WCAG 2.5.3).
  args: { "aria-label": "Voorbeeldveld" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Voer tekst in..." },
};

export const Filled: Story = {
  args: {
    defaultValue: "KCVV Elewijt",
    placeholder: "Naam",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Filled-anchor state — `:not(:placeholder-shown):not(:focus)` flips the border to `ink/60`, signalling completion without colour.",
      },
    },
  },
};

export const Focused: Story = {
  args: { placeholder: "Voer tekst in...", autoFocus: true },
  // VR determinism (#3033 pattern, #3137) — see field-vr-focus.ts. Forces
  // the focus chrome from story state instead of racing the runner's real
  // frame focus.
  play: async ({ canvasElement }) => {
    forceFieldFocusRing(canvasElement);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Focused state — full ink border, shadow snaps off, surface presses 2px into the paper.",
      },
    },
  },
};

export const FilledFocused: Story = {
  args: {
    defaultValue: "Jan Janssens",
    autoFocus: true,
  },
  play: async ({ canvasElement }) => {
    forceFieldFocusRing(canvasElement);
  },
  parameters: {
    docs: {
      description: {
        story: "Focus dominates filled — chrome resolves to focus's ink-press.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    placeholder: "je@email.be",
    defaultValue: "geen-geldig-email",
    error: "Vul een geldig e-mailadres in.",
  },
};

export const ErrorFocused: Story = {
  args: {
    placeholder: "je@email.be",
    defaultValue: "geen-geldig-email",
    error: "Vul een geldig e-mailadres in.",
    autoFocus: true,
  },
  play: async ({ canvasElement }) => {
    forceFieldFocusRing(canvasElement);
  },
};

export const Disabled: Story = {
  args: { placeholder: "Niet beschikbaar", disabled: true },
};

export const DisabledWithValue: Story = {
  args: { defaultValue: "KCVV Elewijt", disabled: true },
};

export const WithHint: Story = {
  args: {
    placeholder: "je@email.be",
    hint: "We sturen je enkel clubnieuws.",
  },
};

export const Small: Story = {
  args: { size: "sm", placeholder: "Klein invoerveld" },
};

export const Large: Story = {
  args: { size: "lg", placeholder: "Groot invoerveld" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Input size="sm" placeholder="Small (sm)" aria-label="Small (sm)" />
      <Input
        size="md"
        placeholder="Medium (md) — default"
        aria-label="Medium (md) — default"
      />
      <Input size="lg" placeholder="Large (lg)" aria-label="Large (lg)" />
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  args: {
    placeholder: "Zoeken...",
    leadingIcon: <MagnifyingGlass size={16} />,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    type: "email",
    placeholder: "je@email.be",
    trailingIcon: <PaperPlaneTilt size={16} />,
  },
};

/**
 * The complete eight-state machine on a single canvas. Hover/focus states
 * are documented inline since pseudo-classes don't VR-capture statically;
 * the dedicated `Focused`, `FilledFocused`, and `ErrorFocused` stories
 * carry their snapshots via `autoFocus`.
 */
export const StateMachine: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-2 gap-x-6 gap-y-5">
      <div>
        <Label htmlFor="input-state-default">Default</Label>
        <Input id="input-state-default" placeholder="Voer tekst in..." />
      </div>
      <div>
        <Label htmlFor="input-state-filled">Filled</Label>
        <Input id="input-state-filled" defaultValue="Kevin Van Ransbeeck" />
      </div>
      <div>
        <Label htmlFor="input-state-error">Error</Label>
        <Input
          id="input-state-error"
          defaultValue="geen-geldig-email"
          error="Vul een geldig e-mailadres in."
        />
      </div>
      <div>
        <Label htmlFor="input-state-disabled">Disabled</Label>
        <Input
          id="input-state-disabled"
          defaultValue="Niet bewerkbaar"
          disabled
        />
      </div>
    </div>
  ),
};

export const ContactFormExample: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-5">
      <div>
        <Label htmlFor="firstname" required>
          Voornaam
        </Label>
        <Input id="firstname" defaultValue="Kevin" />
      </div>
      <div>
        <Label htmlFor="email" required>
          E-mailadres
        </Label>
        <Input
          id="email"
          type="email"
          defaultValue="geen-geldig"
          error="Vul een geldig e-mailadres in."
          trailingIcon={<PaperPlaneTilt size={16} />}
        />
      </div>
      <div>
        <Label htmlFor="phone" optional>
          Telefoonnummer
        </Label>
        <Input
          id="phone"
          hint="Enkel voor dringende vragen — wordt nooit gedeeld."
        />
      </div>
      <div>
        <Label htmlFor="subject">Onderwerp</Label>
        <Input id="subject" placeholder="Onderwerp" disabled />
      </div>
    </div>
  ),
};
