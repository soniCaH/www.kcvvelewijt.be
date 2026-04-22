/**
 * Label Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./Label";
import { Input } from "../Input";

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Form label with KCVV design system styling. Pairs with Input, Textarea, and Select. Supports a required asterisk indicator.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    htmlFor: { control: "text" },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "E-mailadres",
  },
};

export const Required: Story = {
  args: {
    children: "Naam",
    required: true,
  },
};

/**
 * Label paired with Input — the typical usage
 */
export const WithInput: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="demo-email" required>
        E-mailadres
      </Label>
      <Input id="demo-email" type="email" placeholder="je@email.be" />
    </div>
  ),
};

/**
 * Full form field group showing Label + Input + error message
 */
export const WithInputAndError: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="demo-name" required>
        Naam
      </Label>
      <Input
        id="demo-name"
        placeholder="Voornaam en achternaam"
        error="Dit veld is verplicht."
      />
    </div>
  ),
};

export const WithInputAndHint: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="demo-phone">Telefoonnummer</Label>
      <Input
        id="demo-phone"
        type="tel"
        placeholder="+32 4XX XX XX XX"
        hint="Optioneel — enkel voor dringende vragen."
      />
    </div>
  ),
};

/**
 * Labels in a realistic contact form layout
 */
export const ContactForm: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-5">
      <div>
        <Label htmlFor="cf-name" required>
          Naam
        </Label>
        <Input id="cf-name" placeholder="Voornaam en achternaam" />
      </div>
      <div>
        <Label htmlFor="cf-email" required>
          E-mailadres
        </Label>
        <Input id="cf-email" type="email" placeholder="je@email.be" />
      </div>
      <div>
        <Label htmlFor="cf-phone">Telefoonnummer</Label>
        <Input
          id="cf-phone"
          type="tel"
          placeholder="+32 4XX XX XX XX"
          hint="Optioneel"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Typical contact form field group with required and optional labels.",
      },
    },
  },
};
