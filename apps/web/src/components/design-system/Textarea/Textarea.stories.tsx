/**
 * Textarea Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./Textarea";
import { Label } from "../Label";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Multi-line text input with KCVV design system styling. Shares visual language with Input — same border, focus ring, error, and hint patterns.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    resize: {
      control: "select",
      options: ["none", "vertical", "both"],
    },
    error: { control: "text" },
    hint: { control: "text" },
    disabled: { control: "boolean" },
    rows: { control: "number" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Schrijf hier je bericht...",
    rows: 4,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue:
      "Beste KCVV,\n\nIk zou graag meer informatie ontvangen over de jeugdwerking.",
    rows: 5,
  },
};

export const WithHint: Story = {
  args: {
    placeholder: "Omschrijf je vraag...",
    hint: "Maximaal 500 tekens.",
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    placeholder: "Bericht",
    error: "Dit veld is verplicht.",
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "Dit veld kan niet worden aangepast.",
    disabled: true,
    rows: 3,
  },
};

export const NoResize: Story = {
  args: {
    placeholder: "Vaste hoogte, niet versleepbaar",
    resize: "none",
    rows: 4,
  },
};

/**
 * Textarea paired with Label — typical contact form usage
 */
export const WithLabel: Story = {
  render: () => (
    <div className="w-96">
      <Label htmlFor="message" required>
        Bericht
      </Label>
      <Textarea
        id="message"
        placeholder="Schrijf hier je bericht..."
        hint="Maximaal 500 tekens."
        rows={5}
        required
      />
    </div>
  ),
};

export const WithLabelAndError: Story = {
  render: () => (
    <div className="w-96">
      <Label htmlFor="message-err" required>
        Bericht
      </Label>
      <Textarea
        id="message-err"
        placeholder="Schrijf hier je bericht..."
        error="Vul minimaal 20 tekens in."
        rows={5}
        required
      />
    </div>
  ),
};

export const Playground: Story = {
  args: {
    placeholder: "Playground tekstveld...",
    rows: 4,
  },
};
