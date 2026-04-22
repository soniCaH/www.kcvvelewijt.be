/**
 * NumberBadge Component Stories
 *
 * 3D decorative badge for numbers and short text codes.
 * Used in PlayerCard, TeamCard, and staff cards.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NumberBadge } from "./NumberBadge";

const meta = {
  title: "UI/NumberBadge",
  component: NumberBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
3D decorative badge component displaying numbers or short text codes.

**Use cases:**
- Jersey numbers on PlayerCard (green)
- Role codes on staff cards (navy) - T1, T2, TK, TVJO
- Age groups on TeamCard (blue) - U15, U21

**Features:**
- Layered text-shadow for 3D depth effect
- Stenciletta font for numeric values
- Three color variants: green, navy, blue
- Three size variants: sm, md, lg
- Hover scale animation (when parent has \`group\` class)
        `,
      },
    },
    backgrounds: {
      default: "light",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "Value to display (number or short text)",
    },
    color: {
      control: "select",
      options: ["green", "navy", "blue"],
      description: "Color variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    animated: {
      control: "boolean",
      description: "Enable hover animation",
    },
  },
  decorators: [
    (Story) => (
      <div className="group bg-foundation-gray-light relative h-50 w-50 overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NumberBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default green badge with jersey number
 */
export const Default: Story = {
  args: {
    value: 7,
    color: "green",
    size: "lg",
  },
};

/**
 * Navy badge for staff role code
 */
export const StaffRole: Story = {
  args: {
    value: "T1",
    color: "navy",
    size: "md",
  },
};

/**
 * Blue badge for youth team age group
 */
export const YouthTeam: Story = {
  args: {
    value: "U15",
    color: "blue",
    size: "md",
  },
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
  args: {
    value: 99,
    color: "green",
    size: "sm",
  },
};

/**
 * Two-digit number
 */
export const TwoDigit: Story = {
  args: {
    value: 23,
    color: "green",
    size: "lg",
  },
};

/**
 * Three-digit number (edge case)
 */
export const ThreeDigit: Story = {
  args: {
    value: 100,
    color: "green",
    size: "lg",
  },
};

/**
 * Four-character role code
 */
export const LongRoleCode: Story = {
  args: {
    value: "TVJO",
    color: "navy",
    size: "sm",
  },
};

/**
 * Without animation
 */
export const NoAnimation: Story = {
  args: {
    value: 10,
    color: "green",
    size: "lg",
    animated: false,
  },
};

/**
 * All color variants
 */
export const ColorVariants: Story = {
  args: {
    value: 7,
    color: "green",
    size: "lg",
  },
  render: () => (
    <div className="flex gap-8">
      <div className="group bg-foundation-gray-light relative h-50 w-50 overflow-hidden">
        <NumberBadge value={7} color="green" size="md" />
        <span className="absolute bottom-2 left-2 text-xs text-gray-600">
          Green (Players)
        </span>
      </div>
      <div className="group bg-foundation-gray-light relative h-50 w-50 overflow-hidden">
        <NumberBadge value="T1" color="navy" size="md" />
        <span className="absolute bottom-2 left-2 text-xs text-gray-600">
          Navy (Staff)
        </span>
      </div>
      <div className="group bg-foundation-gray-light relative h-50 w-50 overflow-hidden">
        <NumberBadge value="U15" color="blue" size="md" />
        <span className="absolute bottom-2 left-2 text-xs text-gray-600">
          Blue (Youth)
        </span>
      </div>
    </div>
  ),
  decorators: [], // Remove default decorator for custom render
};

/**
 * All size variants
 */
export const SizeVariants: Story = {
  args: {
    value: 7,
    color: "green",
    size: "lg",
  },
  render: () => (
    <div className="flex gap-8">
      <div className="group bg-foundation-gray-light relative h-40 w-40 overflow-hidden">
        <NumberBadge value={7} color="green" size="sm" />
        <span className="absolute bottom-2 left-2 text-xs text-gray-600">
          Small
        </span>
      </div>
      <div className="group bg-foundation-gray-light relative h-50 w-50 overflow-hidden">
        <NumberBadge value={7} color="green" size="md" />
        <span className="absolute bottom-2 left-2 text-xs text-gray-600">
          Medium
        </span>
      </div>
      <div className="group bg-foundation-gray-light relative h-50 w-50 overflow-hidden">
        <NumberBadge value={7} color="green" size="lg" />
        <span className="absolute bottom-2 left-2 text-xs text-gray-600">
          Large
        </span>
      </div>
    </div>
  ),
  decorators: [], // Remove default decorator for custom render
};
