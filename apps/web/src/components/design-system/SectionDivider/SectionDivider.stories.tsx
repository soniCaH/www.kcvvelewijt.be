import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionDivider } from "./SectionDivider";

const meta = {
  title: "UI/SectionDivider",
  component: SectionDivider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-width diagonal section divider. Place inside a `relative overflow-hidden` parent. The triangle colour must match the adjacent section's background to create the visual cut effect. Used at every dark/light section boundary in the redesign.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    color: "white",
    position: "top",
  },
  argTypes: {
    color: {
      control: "select",
      options: ["white", "gray-100", "kcvv-black", "kcvv-green-dark"],
    },
    position: { control: "radio", options: ["top", "bottom"] },
  },
} satisfies Meta<typeof SectionDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrap in a coloured box so the transparent triangle is visible
const Wrapper = ({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) => (
  <div className={`relative overflow-hidden h-32 w-full ${bg}`}>{children}</div>
);

export const Playground: Story = {
  args: { color: "kcvv-black", position: "top" },
  render: (args) => (
    <Wrapper bg="bg-white">
      <SectionDivider {...args} />
    </Wrapper>
  ),
};

export const TopWhite: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="white" position="top" />
    </Wrapper>
  ),
};

export const TopGray100: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-green-dark">
      <SectionDivider color="gray-100" position="top" />
    </Wrapper>
  ),
};

export const TopKcvvBlack: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-green-dark">
      <SectionDivider color="kcvv-black" position="top" />
    </Wrapper>
  ),
};

export const TopKcvvGreenDark: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="kcvv-green-dark" position="top" />
    </Wrapper>
  ),
};

export const BottomWhite: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="white" position="bottom" />
    </Wrapper>
  ),
};

export const BottomGray100: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-green-dark">
      <SectionDivider color="gray-100" position="bottom" />
    </Wrapper>
  ),
};

export const BottomKcvvBlack: Story = {
  render: () => (
    <Wrapper bg="bg-white">
      <SectionDivider color="kcvv-black" position="bottom" />
    </Wrapper>
  ),
};

export const BottomKcvvGreenDark: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="kcvv-green-dark" position="bottom" />
    </Wrapper>
  ),
};

export const PairExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "FeaturedArticles (black) → MatchWidget (green-dark) → LatestNews (gray-100) boundary pair.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col">
      {/* FeaturedArticles bottom — white lower-left cut */}
      <div className="relative overflow-hidden h-32 bg-kcvv-black">
        <SectionDivider color="white" position="bottom" flip />
      </div>
      {/* MatchWidget — white upper-left + gray-100 lower-right */}
      <div className="relative overflow-hidden h-48 bg-kcvv-green-dark">
        <SectionDivider color="white" position="top" />
        <SectionDivider color="gray-100" position="bottom" />
      </div>
      {/* LatestNews */}
      <div className="relative overflow-hidden h-32 bg-gray-100" />
    </div>
  ),
};
