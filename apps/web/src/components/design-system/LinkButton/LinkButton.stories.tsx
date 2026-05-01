import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LinkButton } from "./LinkButton";

const meta = {
  title: "UI/LinkButton",
  component: LinkButton,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "cream",
      values: [
        { name: "cream", value: "#f5f1e6" },
        { name: "ink", value: "#0a0a0a" },
      ],
    },
  },
  tags: ["autodocs", "vr"],
  args: {
    href: "/example",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "inverted", "secondary", "ghost"],
      description: "Visual variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the link button",
    },
    withArrow: {
      control: "boolean",
      description: "Render the typographic → glyph after the label",
    },
    fullWidth: {
      control: "boolean",
      description: "Make link button full width",
    },
    href: {
      control: "text",
      description: "Link destination",
    },
  },
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Primary Link",
    variant: "primary",
  },
};

export const Inverted: Story = {
  args: {
    children: "Inverted Link",
    variant: "inverted",
  },
  parameters: {
    backgrounds: { default: "ink" },
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Link",
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Link",
    variant: "ghost",
  },
};

export const WithArrow: Story = {
  args: {
    children: "Learn More",
    withArrow: true,
  },
};

export const AllVariants: Story = {
  args: {
    children: "Link",
  },
  render: () => (
    <div className="bg-cream flex flex-col items-start gap-4 p-6">
      <LinkButton href="/example" variant="primary">
        Primary
      </LinkButton>
      <LinkButton href="/example" variant="secondary">
        Secondary
      </LinkButton>
      <LinkButton href="/example" variant="ghost">
        Ghost
      </LinkButton>
      <div className="bg-ink p-4">
        <LinkButton href="/example" variant="inverted">
          Inverted
        </LinkButton>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  args: {
    children: "Link",
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <LinkButton href="/example" size="sm">
        Small Link
      </LinkButton>
      <LinkButton href="/example" size="md">
        Medium Link
      </LinkButton>
      <LinkButton href="/example" size="lg">
        Large Link
      </LinkButton>
    </div>
  ),
};

export const WithArrowVariants: Story = {
  args: {
    children: "Link",
  },
  render: () => (
    <div className="bg-cream flex flex-col items-start gap-4 p-6">
      <LinkButton href="/example" variant="primary" withArrow>
        Primary with Arrow
      </LinkButton>
      <LinkButton href="/example" variant="secondary" withArrow>
        Secondary with Arrow
      </LinkButton>
      <LinkButton href="/example" variant="ghost" withArrow>
        Ghost with Arrow
      </LinkButton>
      <div className="bg-ink p-4">
        <LinkButton href="/example" variant="inverted" withArrow>
          Inverted with Arrow
        </LinkButton>
      </div>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    children: "Customize me!",
    variant: "primary",
    size: "md",
    withArrow: false,
    fullWidth: false,
  },
};
