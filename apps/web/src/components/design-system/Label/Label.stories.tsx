/**
 * Label Component Stories — Phase 2.A.4 Direction C.
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
          "Phase 2.A.4 form-atom label. Bold ink semibold above the field; required appends `*` in `text-alert`; optional appends a mono-caps `OPTIONEEL` pill (sharp corners, `border-ink/30`).",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    required: { control: "boolean" },
    optional: { control: "boolean" },
    htmlFor: { control: "text" },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: { children: "E-mailadres" },
};

export const Required: Story = {
  args: { children: "Naam", required: true },
};

export const Optional: Story = {
  args: { children: "Telefoonnummer", optional: true },
};

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

export const OptionalWithInput: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="demo-phone" optional>
        Telefoonnummer
      </Label>
      <Input
        id="demo-phone"
        type="tel"
        placeholder="+32 4XX XX XX XX"
        hint="Enkel voor dringende vragen — wordt nooit gedeeld."
      />
    </div>
  ),
};

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
        <Label htmlFor="cf-phone" optional>
          Telefoonnummer
        </Label>
        <Input
          id="cf-phone"
          type="tel"
          placeholder="+32 4XX XX XX XX"
          hint="Enkel voor dringende vragen — wordt nooit gedeeld."
        />
      </div>
    </div>
  ),
};
