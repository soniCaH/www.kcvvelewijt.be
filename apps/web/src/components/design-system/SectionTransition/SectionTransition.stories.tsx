import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionTransition } from "./SectionTransition";

const meta = {
  title: "UI/SectionTransition",
  component: SectionTransition,
  tags: ["autodocs"],
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
    overlap: "none",
  },
  argTypes: {
    from: {
      control: "select",
      options: [
        "white",
        "gray-100",
        "kcvv-black",
        "kcvv-green-dark",
        "transparent",
      ],
    },
    to: {
      control: "select",
      options: [
        "white",
        "gray-100",
        "kcvv-black",
        "kcvv-green-dark",
        "transparent",
      ],
    },
    type: { control: "select", options: ["diagonal", "double-diagonal"] },
    direction: { control: "select", options: ["left", "right"] },
    overlap: { control: "select", options: ["none", "half", "full"] },
    via: {
      control: "select",
      options: [
        "white",
        "gray-100",
        "kcvv-black",
        "kcvv-green-dark",
        "transparent",
      ],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "100vw" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SingleDiagonalLeft: Story = {
  name: "Single — Left (↙)",
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
  },
};

export const SingleDiagonalRight: Story = {
  name: "Single — Right (↘)",
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "right",
  },
};

export const DarkToLight: Story = {
  name: "kcvv-black → gray-100",
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
  },
};

export const DarkToDarkGreen: Story = {
  name: "kcvv-black → kcvv-green-dark",
  args: {
    from: "kcvv-black",
    to: "kcvv-green-dark",
    type: "diagonal",
    direction: "right",
  },
};

export const GreenDarkToLight: Story = {
  name: "kcvv-green-dark → gray-100",
  args: {
    from: "kcvv-green-dark",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
  },
};

export const GreenDarkToDark: Story = {
  name: "kcvv-green-dark → kcvv-black",
  args: {
    from: "kcvv-green-dark",
    to: "kcvv-black",
    type: "diagonal",
    direction: "right",
  },
};

export const LightToDark: Story = {
  name: "gray-100 → kcvv-black",
  args: {
    from: "gray-100",
    to: "kcvv-black",
    type: "diagonal",
    direction: "left",
  },
};

export const ViaWhiteToDark: Story = {
  name: "white → kcvv-black (via color for double-diagonal sandwich)",
  args: {
    from: "white",
    to: "kcvv-black",
    type: "diagonal",
    direction: "right",
  },
};

export const DoubleDiagonalRightViaWhite: Story = {
  name: "Double — Right, via white (hero usage)",
  args: {
    from: "kcvv-black",
    to: "kcvv-green-dark",
    type: "double-diagonal",
    direction: "right",
    via: "white",
  },
};

export const DoubleDiagonalLeftViaGray: Story = {
  name: "Double — Left, via gray-100",
  args: {
    from: "kcvv-black",
    to: "kcvv-black",
    type: "double-diagonal",
    direction: "left",
    via: "gray-100",
  },
};

export const OverlapNone: Story = {
  name: "Overlap — None (default)",
  decorators: [
    (Story) => (
      <div>
        <div className="bg-kcvv-black h-32 w-full" />
        <Story />
        <div className="h-32 w-full bg-gray-100" />
      </div>
    ),
  ],
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
    overlap: "none",
  },
};

export const OverlapHalf: Story = {
  name: "Overlap — Half (bites into FROM section)",
  decorators: [
    (Story) => (
      <div className="relative">
        <div className="bg-kcvv-black relative z-0 h-32 w-full" />
        <Story />
        <div className="h-32 w-full bg-gray-100" />
      </div>
    ),
  ],
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
    overlap: "half",
  },
};

export const OverlapFull: Story = {
  name: "Overlap — Full (entirely inside FROM section)",
  decorators: [
    (Story) => (
      <div className="relative">
        <div className="bg-kcvv-black relative z-0 h-32 w-full" />
        <Story />
        <div className="h-32 w-full bg-gray-100" />
      </div>
    ),
  ],
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
    overlap: "full",
  },
};
