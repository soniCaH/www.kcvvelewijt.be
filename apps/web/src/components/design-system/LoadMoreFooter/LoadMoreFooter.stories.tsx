import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { LoadMoreFooter } from "./LoadMoreFooter";

const meta = {
  title: "UI/LoadMoreFooter",
  component: LoadMoreFooter,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'The tail of a paginated listing — exactly one of three things shows at a time: a failed-batch notice with a retry (rendered through `<EmptyState tier="slot" reason="unavailable">`, #2815), the in-flight spinner, or the load-more button. `/nieuws` and `/galerij` are the two listings on the shared 24 + 12 contract (#2569), and they render this rather than each keeping a hand-copied footer.',
      },
    },
  },
  args: {
    label: "Meer nieuws laden",
    hasMore: true,
    isLoading: false,
    onLoadMore: fn().mockName("onLoadMore"),
  },
} satisfies Meta<typeof LoadMoreFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** More to fetch, nothing in flight — the button is the whole footer. */
export const Actionable: Story = {};

/** A batch is in flight; the button is replaced, not disabled. */
export const Loading: Story = {
  args: { isLoading: true },
};

/**
 * The batch failed. The message and its retry take over — the button does not
 * also show, so there is only ever one thing to click.
 */
export const Error: Story = {
  args: { error: { message: "Artikelen laden mislukt.", emphasis: "mislukt" } },
};

/** An error outranks an in-flight state, so a retry is always reachable. */
export const ErrorWhileLoading: Story = {
  args: {
    error: { message: "Artikelen laden mislukt.", emphasis: "mislukt" },
    isLoading: true,
  },
};

/** Nothing left to fetch — the footer renders nothing at all. */
export const Exhausted: Story = {
  args: { hasMore: false },
};

/** `/galerij` passes its own label; everything else is shared. */
export const GalleryLabel: Story = {
  args: { label: "Meer foto's laden" },
};
