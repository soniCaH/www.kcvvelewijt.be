/**
 * SocialLinks Component Stories
 * Showcases social media links in different variants
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SocialLinks } from "./SocialLinks";

const meta = {
  title: "UI/SocialLinks",
  component: SocialLinks,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Social media links component with circle and inline variants. Used in footer, mobile menu, and other locations.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["circle", "inline"],
      description: "Visual variant of the social links",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the icons",
    },
    direction: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Layout direction",
    },
  },
} satisfies Meta<typeof SocialLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Circle variant (footer style)
 * 2rem circular buttons with 2px gray border that turns green on hover
 */
export const Circle: Story = {
  args: {
    variant: "circle",
  },
  render: (args) => (
    <div className="bg-black p-8">
      <SocialLinks {...args} />
    </div>
  ),
};

/**
 * Circle variant - vertical direction
 */
export const CircleVertical: Story = {
  args: {
    variant: "circle",
    direction: "vertical",
  },
  render: (args) => (
    <div className="bg-black p-8">
      <SocialLinks {...args} />
    </div>
  ),
};

/**
 * Inline variant (mobile menu style)
 * Simple links with hover background
 */
export const Inline: Story = {
  args: {
    variant: "inline",
    size: "lg",
  },
  render: (args) => (
    <div className="bg-[#1E2024] p-8">
      <SocialLinks {...args} />
    </div>
  ),
};

/**
 * Inline variant - vertical direction
 */
export const InlineVertical: Story = {
  args: {
    variant: "inline",
    size: "lg",
    direction: "vertical",
  },
  render: (args) => (
    <div className="bg-[#1E2024] p-8">
      <SocialLinks {...args} />
    </div>
  ),
};

/**
 * Different icon sizes (inline variant)
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 bg-black p-8">
      <div>
        <p className="mb-2 text-sm text-white">Small</p>
        <SocialLinks variant="inline" size="sm" />
      </div>
      <div>
        <p className="mb-2 text-sm text-white">Medium</p>
        <SocialLinks variant="inline" size="md" />
      </div>
      <div>
        <p className="mb-2 text-sm text-white">Large</p>
        <SocialLinks variant="inline" size="lg" />
      </div>
    </div>
  ),
};

/**
 * Circle variant in different sizes
 * Small: 24px, Medium: 32px, Large: 40px
 */
export const CircleSizes: Story = {
  render: () => (
    <div className="space-y-6 bg-black p-8">
      <div>
        <p className="mb-2 text-sm text-white">Small (24px)</p>
        <SocialLinks variant="circle" size="sm" />
      </div>
      <div>
        <p className="mb-2 text-sm text-white">Medium (32px - Default)</p>
        <SocialLinks variant="circle" size="md" />
      </div>
      <div>
        <p className="mb-2 text-sm text-white">Large (40px)</p>
        <SocialLinks variant="circle" size="lg" />
      </div>
    </div>
  ),
};
