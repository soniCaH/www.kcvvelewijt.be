import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialLink } from "./EditorialLink";

const meta = {
  title: "UI/EditorialLink",
  component: EditorialLink,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    href: "/nieuws",
    children: "Bekijk alle nieuws",
    tone: "light",
  },
};

// Renders the identical code path as Playground (light tone is the default,
// arrow-on is the default) — kept for autodocs completeness only. Story
// tags merge with the meta's by default, so dropping "vr" here requires the
// explicit negation `"!vr"` (see JerseyIllustration.stories.tsx) — a bare
// `tags: ["autodocs"]` still inherits "vr" and gets captured anyway.
export const Light: Story = {
  tags: ["autodocs", "!vr"],
  args: {
    href: "/nieuws",
    tone: "light",
    children: "Bekijk alle nieuws",
  },
};

export const LightNoArrow: Story = {
  args: {
    href: "/nieuws",
    tone: "light",
    withArrow: false,
    children: "Bekijk alle nieuws",
  },
};

export const Dark: Story = {
  args: {
    href: "/nieuws",
    tone: "dark",
    children: "Bekijk alle nieuws",
  },
  decorators: [
    (Story) => (
      <div className="bg-ink border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
};
