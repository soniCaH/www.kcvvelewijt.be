/**
 * Input Component Stories — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./Input";
import { Label } from "../Label";
import { Search, Mail } from "lucide-react";

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
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

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
      <Input size="sm" placeholder="Small (sm)" />
      <Input size="md" placeholder="Medium (md) — default" />
      <Input size="lg" placeholder="Large (lg)" />
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  args: { placeholder: "Zoeken...", leadingIcon: <Search size={16} /> },
};

export const WithTrailingIcon: Story = {
  args: {
    type: "email",
    placeholder: "je@email.be",
    trailingIcon: <Mail size={16} />,
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
        <Label>Default</Label>
        <Input placeholder="Voer tekst in..." />
      </div>
      <div>
        <Label>Filled</Label>
        <Input defaultValue="Kevin Van Ransbeeck" />
      </div>
      <div>
        <Label>Error</Label>
        <Input
          defaultValue="geen-geldig-email"
          error="Vul een geldig e-mailadres in."
        />
      </div>
      <div>
        <Label>Disabled</Label>
        <Input defaultValue="Niet bewerkbaar" disabled />
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
          trailingIcon={<Mail size={16} />}
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
