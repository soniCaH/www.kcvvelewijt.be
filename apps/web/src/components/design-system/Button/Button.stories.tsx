import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { Heart } from "@/lib/icons.redesign";

const meta = {
  title: "UI/Button",
  component: Button,
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
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "inverted", "secondary", "ghost"],
      description: "Visual variant of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the button",
    },
    withArrow: {
      control: "boolean",
      description: "Render the typographic → glyph after the label",
    },
    fullWidth: {
      control: "boolean",
      description: "Make button full width",
    },
    disabled: {
      control: "boolean",
      description: "Disable the button",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

/**
 * `inverted` is the dark-surface counterpart of `primary` — `bg-cream` on
 * `text-ink`. Rendered against an ink backdrop in this story to expose the
 * contrast the variant is designed for.
 */
export const Inverted: Story = {
  args: {
    children: "Inverted Button",
    variant: "inverted",
  },
  parameters: {
    backgrounds: { default: "ink" },
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
};

export const Small: Story = {
  args: {
    children: "Small Button",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    children: "Medium Button",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    children: "Large Button",
    size: "lg",
  },
};

/**
 * `withArrow` renders the locked typographic `→` glyph (not a Phosphor icon)
 * with a hover translate-x-1 animation.
 */
export const WithArrow: Story = {
  args: {
    children: "Learn More",
    withArrow: true,
  },
};

/**
 * Composing an arbitrary leading icon with `<Button>` — proves icon glyphs
 * sit alongside the label without colliding with the `withArrow` typographic
 * `→`. Uses Phosphor Fill `Heart` from `@/lib/icons.redesign`.
 */
export const WithLeadingIcon: Story = {
  args: {
    variant: "primary",
    children: "Support the club",
  },
  render: ({ children, ...args }) => (
    <Button {...args}>
      <Heart size={16} aria-hidden="true" />
      {children}
    </Button>
  ),
};

export const FullWidth: Story = {
  args: {
    children: "Full Width Button",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const AllVariants: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="bg-cream flex flex-col items-start gap-4 p-6">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <div className="bg-ink p-4">
        <Button variant="inverted">Inverted</Button>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button size="sm">Small Button</Button>
      <Button size="md">Medium Button</Button>
      <Button size="lg">Large Button</Button>
    </div>
  ),
};

export const WithArrowVariants: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="bg-cream flex flex-col items-start gap-4 p-6">
      <Button variant="primary" withArrow>
        Primary with Arrow
      </Button>
      <Button variant="secondary" withArrow>
        Secondary with Arrow
      </Button>
      <Button variant="ghost" withArrow>
        Ghost with Arrow
      </Button>
      <div className="bg-ink p-4">
        <Button variant="inverted" withArrow>
          Inverted with Arrow
        </Button>
      </div>
    </div>
  ),
};

export const Examples: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h3 className="text-ink mb-2 font-bold">Call to Action</h3>
        <Button variant="primary" size="lg" withArrow fullWidth>
          Join KCVV Elewijt
        </Button>
      </div>

      <div>
        <h3 className="text-ink mb-2 font-bold">Article Actions</h3>
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Read Article
          </Button>
          <Button variant="ghost" size="sm">
            Share
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-ink mb-2 font-bold">Form Buttons</h3>
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            Submit
          </Button>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

export const Playground: Story = {
  args: {
    children: "Customize me!",
    variant: "primary",
    size: "md",
    withArrow: false,
    fullWidth: false,
    disabled: false,
  },
};
