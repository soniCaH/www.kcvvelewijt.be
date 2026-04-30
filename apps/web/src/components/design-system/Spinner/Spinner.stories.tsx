/**
 * Spinner Component Stories
 *
 * Showcases the scarf barber-pole + compact dot pulse atom.
 * Direction D ("Paper chrome, ink emphasis"), locked 2026-04-30.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner, FullPageSpinner } from "./Spinner";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "Size of the spinner (applies to scarf variants only)",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "white", "compact"],
      description: "Visual variant",
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
 * Primary — jersey · cream · ink · cream scarf stripes. Default loading on
 * cream surfaces.
 */
export const Primary: Story = {
  args: {
    variant: "primary",
    size: "md",
  },
};

/**
 * Secondary — ink · cream · ink-muted · cream scarf (no jersey). For
 * non-brand loading like form saves, admin actions, background sync.
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "md",
  },
};

/**
 * White — palette flip on a dark interlude background. Cream-led stripes
 * with a paper-edge border + soft ink-muted shadow.
 */
export const White: Story = {
  render: () => (
    <div className="bg-ink-soft p-8">
      <Spinner variant="white" size="md" />
    </div>
  ),
};

/**
 * Compact — three jersey-deep dots pulsing in sequence. Inline workhorse
 * for tight contexts where a 96 px barber-pole bar is too heavy.
 */
export const Compact: Story = {
  args: {
    variant: "compact",
    label: "Bijwerken",
  },
};

/**
 * All sizes (primary scarf): sm 96×16 / md 180×28 / lg 240×36 / xl 360×56.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-12 font-mono text-xs tracking-wider uppercase">
          SM
        </span>
        <Spinner size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-12 font-mono text-xs tracking-wider uppercase">
          MD
        </span>
        <Spinner size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-12 font-mono text-xs tracking-wider uppercase">
          LG
        </span>
        <Spinner size="lg" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-12 font-mono text-xs tracking-wider uppercase">
          XL
        </span>
        <Spinner size="xl" />
      </div>
    </div>
  ),
};

/**
 * All variants — primary, secondary, white, compact rendered together for
 * visual cohesion check.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-24 font-mono text-xs tracking-wider uppercase">
          PRIMARY
        </span>
        <Spinner variant="primary" size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-24 font-mono text-xs tracking-wider uppercase">
          SECONDARY
        </span>
        <Spinner variant="secondary" size="md" />
      </div>
      <div className="bg-ink-soft -mx-4 flex items-center gap-4 p-4">
        <span className="text-cream w-24 font-mono text-xs tracking-wider uppercase">
          WHITE
        </span>
        <Spinner variant="white" size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-ink-muted w-24 font-mono text-xs tracking-wider uppercase">
          COMPACT
        </span>
        <Spinner variant="compact" />
      </div>
    </div>
  ),
};

/**
 * Inline pulse — compact next to a label, the canonical use case.
 */
export const InlinePulse: Story = {
  render: () => (
    <div className="text-ink flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
      <span>BIJWERKEN</span>
      <Spinner variant="compact" label="Bijwerken" />
    </div>
  ),
};

/**
 * Spinner in card — large primary scarf inside a paper card frame.
 */
export const InCard: Story = {
  render: () => (
    <div className="border-ink bg-cream w-72 border-2 p-6 shadow-[var(--shadow-paper-sm)]">
      <div className="flex flex-col items-center gap-4 py-6">
        <Spinner size="lg" />
        <p className="text-ink-muted font-mono text-xs tracking-wider uppercase">
          Wedstrijden laden…
        </p>
      </div>
    </div>
  ),
};

/**
 * Centered in container — typical loading state framed by a paper-edge
 * outline.
 */
export const Centered: Story = {
  render: () => (
    <div className="border-paper-edge bg-cream flex h-64 w-96 items-center justify-center border">
      <Spinner size="lg" label="Loading content..." />
    </div>
  ),
};

/**
 * Custom label — large primary scarf with a project-specific aria-label.
 */
export const CustomLabel: Story = {
  args: {
    label: "Loading match data...",
    size: "lg",
    variant: "primary",
  },
};

/**
 * FullPageSpinner overlay — covers the viewport with a soft cream
 * backdrop while the page loads.
 */
export const FullPage: Story = {
  render: () => (
    <div className="border-ink bg-cream relative h-64 w-96 overflow-hidden border-2">
      <div className="p-4">
        <h3 className="text-ink mb-2 font-bold">Page Content</h3>
        <p className="text-ink-muted">This content is behind the overlay.</p>
      </div>
      <FullPageSpinner />
    </div>
  ),
};

/**
 * Loading states comparison — inline (compact), center (scarf), and a
 * skeleton-style block followed by an inline pulse.
 */
export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="border-paper-edge bg-cream border p-4">
        <div className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          <Spinner variant="compact" label="Inline loading" />
          <span>INLINE LOADING STATE</span>
        </div>
      </div>

      <div className="border-paper-edge bg-cream border p-4">
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner size="md" />
          <span className="text-ink-muted font-mono text-xs tracking-wider uppercase">
            CENTER LOADING STATE
          </span>
        </div>
      </div>

      <div className="border-paper-edge bg-cream border p-4">
        <div className="space-y-3">
          <div className="bg-cream-soft h-4 w-full" />
          <div className="bg-cream-soft h-4 w-4/5" />
          <div className="bg-cream-soft h-4 w-3/5" />
          <div className="mt-3 flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
            <Spinner variant="compact" label="Loading more" />
            <span className="text-ink-muted">LOADING MORE…</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Interactive playground.
 */
export const Playground: Story = {
  args: {
    size: "md",
    variant: "primary",
    label: "Loading...",
  },
};
