/**
 * Spinner Component Stories
 * Showcases loading indicators
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner, FullPageSpinner } from "./Spinner";
import { Button } from "../Button";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "Size of the spinner",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "white", "logo"],
      description: "Color variant",
    },
    label: {
      control: "text",
      description: "Accessible label for screen readers",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary spinner with KCVV green
 */
export const Primary: Story = {
  args: {
    variant: "primary",
  },
};

/**
 * Secondary spinner with gray
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

/**
 * White spinner for dark backgrounds
 */
export const White: Story = {
  render: () => (
    <div className="bg-kcvv-gray-dark rounded p-8">
      <Spinner variant="white" />
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="text-center">
        <Spinner size="sm" />
        <div className="mt-2 text-xs text-gray-600">Small</div>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <div className="mt-2 text-xs text-gray-600">Medium</div>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <div className="mt-2 text-xs text-gray-600">Large</div>
      </div>
      <div className="text-center">
        <Spinner size="xl" />
        <div className="mt-2 text-xs text-gray-600">Extra Large</div>
      </div>
    </div>
  ),
};

/**
 * Spinner in button
 */
export const InButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner size="sm" variant="white" />
      <span>Loading...</span>
    </Button>
  ),
};

/**
 * Spinner in card
 */
export const InCard: Story = {
  render: () => (
    <div className="w-64 rounded border border-gray-200 p-4">
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading articles...</p>
      </div>
    </div>
  ),
};

/**
 * Centered in container
 */
export const Centered: Story = {
  render: () => (
    <div className="flex h-64 w-96 items-center justify-center rounded border border-gray-200">
      <Spinner size="lg" label="Loading content..." />
    </div>
  ),
};

/**
 * With custom label
 */
export const CustomLabel: Story = {
  args: {
    label: "Loading match data...",
    size: "lg",
  },
};

/**
 * Full page spinner overlay
 */
export const FullPage: Story = {
  render: () => (
    <div className="relative h-64 w-96 overflow-hidden rounded border border-gray-200">
      <div className="p-4">
        <h3 className="mb-2 font-bold">Page Content</h3>
        <p className="text-gray-600">This content is behind the overlay.</p>
      </div>
      <FullPageSpinner />
    </div>
  ),
};

/**
 * Loading states comparison
 */
export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm">Inline loading state</span>
        </div>
      </div>

      <div className="rounded border border-gray-200 p-4">
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="md" />
          <span className="text-sm text-gray-600">Center loading state</span>
        </div>
      </div>

      <div className="rounded border border-gray-200 p-4">
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-gray-600">Loading more...</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * KCVV Logo Spinner (matches Gatsby site)
 * Rotates the KCVV logo around Y-axis with smooth 3D effect
 */
export const LogoSpinner: Story = {
  args: {
    variant: "logo",
    size: "lg",
    label: "Loading KCVV content...",
  },
};

/**
 * Logo spinner in all sizes
 */
export const LogoSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="text-center">
        <Spinner variant="logo" size="sm" />
        <div className="mt-2 text-xs text-gray-600">Small</div>
      </div>
      <div className="text-center">
        <Spinner variant="logo" size="md" />
        <div className="mt-2 text-xs text-gray-600">Medium</div>
      </div>
      <div className="text-center">
        <Spinner variant="logo" size="lg" />
        <div className="mt-2 text-xs text-gray-600">Large</div>
      </div>
      <div className="text-center">
        <Spinner variant="logo" size="xl" />
        <div className="mt-2 text-xs text-gray-600">Extra Large</div>
      </div>
    </div>
  ),
};

/**
 * Comparison: SVG Spinner vs Logo Spinner
 * Shows both spinner types side-by-side
 */
export const SpinnerComparison: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <div className="flex flex-col items-center gap-4">
        <h4 className="text-sm font-bold">SVG Spinner</h4>
        <Spinner variant="primary" size="lg" />
        <p className="max-w-xs text-center text-xs text-gray-600">
          Generic circular spinner (fast, lightweight)
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <h4 className="text-sm font-bold">Logo Spinner</h4>
        <Spinner variant="logo" size="lg" />
        <p className="max-w-xs text-center text-xs text-gray-600">
          KCVV branded spinner (page loads, branded experiences)
        </p>
      </div>
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    size: "md",
    variant: "primary",
    label: "Loading...",
  },
};
