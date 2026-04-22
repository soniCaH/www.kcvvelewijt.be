/**
 * Input Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./Input";
import { Search, Mail, Eye } from "lucide-react";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Text input field with KCVV design system styling. Supports size variants, error/hint states, and leading/trailing icons.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant of the input",
    },
    error: {
      control: "text",
      description: "Error message — also applies error styling to the border",
    },
    hint: {
      control: "text",
      description: "Hint text shown below the input when there is no error",
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Voer tekst in...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "KCVV Elewijt",
    placeholder: "Naam",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    placeholder: "Klein invoerveld",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    placeholder: "Groot invoerveld",
  },
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
  args: {
    placeholder: "Zoeken...",
    leadingIcon: <Search size={16} />,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    type: "email",
    placeholder: "je@email.be",
    trailingIcon: <Mail size={16} />,
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Wachtwoord",
    trailingIcon: <Eye size={16} />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Password input with trailing eye icon (toggle logic wired per use-case).",
      },
    },
  },
};

export const WithHint: Story = {
  args: {
    placeholder: "je@email.be",
    hint: "We sturen je enkel clubnieuws.",
  },
};

export const WithError: Story = {
  args: {
    placeholder: "je@email.be",
    defaultValue: "geen-geldig-email",
    error: "Vul een geldig e-mailadres in.",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Niet beschikbaar",
    disabled: true,
  },
};

export const DisabledWithValue: Story = {
  args: {
    defaultValue: "KCVV Elewijt",
    disabled: true,
  },
};

/**
 * Typical search field as used throughout the app
 */
export const SearchField: Story = {
  args: {
    size: "lg",
    type: "search",
    placeholder: "Zoek nieuws, spelers, teams...",
    leadingIcon: <Search size={20} />,
  },
};

/**
 * Contact form example — all states side by side
 */
export const ContactFormExample: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-5">
      <Input placeholder="Voornaam" defaultValue="Kevin" />
      <Input
        type="email"
        placeholder="E-mailadres"
        defaultValue="geen-geldig"
        error="Vul een geldig e-mailadres in."
        trailingIcon={<Mail size={16} />}
      />
      <Input
        placeholder="Telefoonnummer"
        hint="Optioneel — enkel voor dringende vragen."
      />
      <Input placeholder="Onderwerp" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Realistic form layout showing default, error, hint, and disabled states together.",
      },
    },
  },
};

export const Playground: Story = {
  args: {
    placeholder: "Playground invoerveld",
    size: "md",
  },
};
