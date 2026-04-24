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

// ─── Reveal flags (backdrop support) ──────────────────────────────────────────
//
// These stories render a mock patterned backdrop in the section BELOW and/or
// ABOVE the transition so the effect of revealFrom / revealTo is visually
// verifiable. Consumers should not set these flags manually; `SectionStack`
// derives them from neighbor `backdrop` presence. The stories wire them
// explicitly so the primitive is reviewable in isolation. A CSS gradient is
// used instead of a remote photo to keep stories deterministic and CSP-safe.

function MockBackdrop({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,215,0,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(0,135,85,0.45), transparent 60%), linear-gradient(135deg, #1e2024 0%, #0a1a14 50%, #1e2024 100%)",
      }}
    >
      <span className="absolute top-4 right-4 text-xs font-bold tracking-widest text-white uppercase opacity-70">
        {label}
      </span>
    </div>
  );
}

export const BackgroundedFrom: Story = {
  name: "Reveal — FROM (previous section has backdrop)",
  decorators: [
    (Story) => (
      <div>
        <div className="bg-kcvv-green-dark relative h-40 w-full">
          <MockBackdrop label="backdrop above" />
        </div>
        <Story />
        <div className="h-24 w-full bg-gray-100" />
      </div>
    ),
  ],
  args: {
    from: "kcvv-green-dark",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
    revealFrom: true,
  },
};

export const BackgroundedTo: Story = {
  name: "Reveal — TO (next section has backdrop)",
  decorators: [
    (Story) => (
      <div>
        <div className="bg-kcvv-black h-24 w-full" />
        <Story />
        <div className="bg-kcvv-green-dark relative h-40 w-full">
          <MockBackdrop label="backdrop below" />
        </div>
      </div>
    ),
  ],
  args: {
    from: "kcvv-black",
    to: "kcvv-green-dark",
    type: "diagonal",
    direction: "left",
    revealTo: true,
  },
};

export const BackgroundedBoth: Story = {
  name: "Reveal — FROM + TO (two consecutive backdropped sections)",
  decorators: [
    (Story) => (
      <div>
        <div className="bg-kcvv-green-dark relative h-40 w-full">
          <MockBackdrop label="backdrop above" />
        </div>
        <Story />
        <div className="bg-kcvv-black relative h-40 w-full">
          <MockBackdrop label="backdrop below" />
        </div>
      </div>
    ),
  ],
  args: {
    from: "kcvv-green-dark",
    to: "kcvv-black",
    type: "diagonal",
    direction: "left",
    revealFrom: true,
    revealTo: true,
  },
};

export const DoubleDiagonalBackgroundedFrom: Story = {
  name: "Reveal — double-diagonal, FROM only (via stays opaque)",
  decorators: [
    (Story) => (
      <div>
        <div className="bg-kcvv-black relative h-40 w-full">
          <MockBackdrop label="backdrop above" />
        </div>
        <Story />
        <div className="bg-kcvv-green-dark h-24 w-full" />
      </div>
    ),
  ],
  args: {
    from: "kcvv-black",
    to: "kcvv-green-dark",
    type: "double-diagonal",
    direction: "right",
    via: "white",
    revealFrom: true,
  },
};

export const DoubleDiagonalBackgroundedTo: Story = {
  name: "Reveal — double-diagonal, TO only (via stays opaque)",
  decorators: [
    (Story) => (
      <div>
        <div className="bg-kcvv-black h-24 w-full" />
        <Story />
        <div className="bg-kcvv-green-dark relative h-40 w-full">
          <MockBackdrop label="backdrop below" />
        </div>
      </div>
    ),
  ],
  args: {
    from: "kcvv-black",
    to: "kcvv-green-dark",
    type: "double-diagonal",
    direction: "right",
    via: "white",
    revealTo: true,
  },
};
