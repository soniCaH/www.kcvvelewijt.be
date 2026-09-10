import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SkeletonBars } from "./SkeletonBars";

// Autodocs only, deliberately not VR-tagged: #2642 (the ticket that
// introduced this primitive) captures no VR baselines at all, and every
// call site already renders through the four `loading.tsx` files' own
// vitest coverage. Match `Skeleton.stories.tsx`'s peer story if this
// primitive ever earns its own visual contract worth pinning.
const meta = {
  title: "UI/SkeletonBars",
  component: SkeletonBars,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof SkeletonBars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithOuterSpacing: Story = {
  args: { className: "mt-16" },
};
