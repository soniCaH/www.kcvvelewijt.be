/**
 * Button Component Stories
 * Showcases all Button variants and use cases
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { ArrowRight as ArrowRightFill } from "@/lib/icons.redesign";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "link"],
      description: "Visual variant of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the button",
    },
    withArrow: {
      control: "boolean",
      description: "Show arrow icon on the right",
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

/**
 * Primary button — reskinned to the redesign vocabulary (jersey-on-cream).
 *
 * Tracer-bullet story for Phase 2 (#1568): proves the Phosphor Fill icon
 * wrapper from `@/lib/icons.redesign` integrates with `<Button variant="primary">`
 * on the new visual treatment. The companion `Primary` story uses the same
 * variant — they share a baseline cluster until 2.A.3 retires the legacy
 * variants entirely.
 */
export const PrimaryRedesigned: Story = {
  args: {
    variant: "primary",
    children: "Continue",
  },
  render: ({ children, ...args }) => (
    <Button {...args}>
      {children} <ArrowRightFill size={16} aria-hidden="true" />
    </Button>
  ),
};

/**
 * Primary button — default (no trailing icon)
 */
export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

/**
 * Secondary button with gray background
 */
export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

/**
 * Ghost button with transparent background and border
 */
export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
};

/**
 * Link-styled button
 */
export const Link: Story = {
  args: {
    children: "Link Button",
    variant: "link",
  },
};

/**
 * Small button size
 */
export const Small: Story = {
  args: {
    children: "Small Button",
    size: "sm",
  },
};

/**
 * Medium button size (default)
 */
export const Medium: Story = {
  args: {
    children: "Medium Button",
    size: "md",
  },
};

/**
 * Large button size
 */
export const Large: Story = {
  args: {
    children: "Large Button",
    size: "lg",
  },
};

/**
 * Button with animated arrow icon
 */
export const WithArrow: Story = {
  args: {
    children: "Learn More",
    withArrow: true,
  },
};

/**
 * Full width button (mobile-friendly)
 */
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

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

/**
 * All variants side by side
 */
export const AllVariants: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/**
 * All sizes comparison
 */
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

/**
 * Button with arrow in all variants
 */
export const WithArrowVariants: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="primary" withArrow>
        Primary with Arrow
      </Button>
      <Button variant="secondary" withArrow>
        Secondary with Arrow
      </Button>
      <Button variant="ghost" withArrow>
        Ghost with Arrow
      </Button>
    </div>
  ),
};

/**
 * Real-world usage examples
 */
export const Examples: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h3 className="text-kcvv-gray-blue mb-2 font-bold">Call to Action</h3>
        <Button variant="primary" size="lg" withArrow fullWidth>
          Join KCVV Elewijt
        </Button>
      </div>

      <div>
        <h3 className="text-kcvv-gray-blue mb-2 font-bold">Article Actions</h3>
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
        <h3 className="text-kcvv-gray-blue mb-2 font-bold">Form Buttons</h3>
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            Submit
          </Button>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-kcvv-gray-blue mb-2 font-bold">Navigation</h3>
        <Button variant="link" withArrow>
          View All News
        </Button>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

/**
 * Interactive playground
 */
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
