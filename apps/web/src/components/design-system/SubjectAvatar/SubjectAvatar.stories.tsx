import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { SubjectAvatar } from "./SubjectAvatar";

const meta = {
  title: "UI/SubjectAvatar",
  component: SubjectAvatar,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Phase 5 net-new primitive per the 5.d2 lock. Two render paths picked by `scale`: `row` (~32px) always renders an initial monogram; `attribution` (~64px) renders a circular photo crop with Phase 4.5 R9 newsprint treatment, falling back to a 64px monogram when no photo exists. Monogram derivation: first letter of `firstName`, uppercased, italic Freight Display 900 on a jersey-deep disc.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SubjectAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 24px monogram — the smallest scale, locked at 5.d-col for the
// `<EditorialByline>` author chip. Sits inline next to mono-caps byline
// text. Monogram-only (no photo path).
export const BylineMonogram: Story = {
  args: {
    firstName: "Tom",
    fullName: "Tom De Smet",
    scale: "byline",
  },
};

// 32px monogram — the only render path at row scale, even when a photo
// URL is supplied (per 5.d2 lock: photos at 32px are too small to
// identify a face).
export const RowMonogram: Story = {
  args: {
    firstName: "Wim",
    fullName: "Wim Govaerts",
    scale: "row",
  },
};

// 64px photo with R9 newsprint treatment + 1px ink border. The photo
// uses a stable Picsum seed so VR baselines don't churn.
export const AttributionPhoto: Story = {
  args: {
    firstName: "Wim",
    fullName: "Wim Govaerts",
    photoUrl: fixtureImage("staff-portrait", 0),
    scale: "attribution",
  },
};

// 64px monogram fallback when the subject has no photo.
export const AttributionMonogramFallback: Story = {
  args: {
    firstName: "Anouk",
    fullName: "Anouk De Wit",
    scale: "attribution",
  },
};

// Side-by-side comparison of the two scales for the same subject. Shows
// the cross-scale "same speaker, two looks" tradeoff acknowledged by the
// 5.d2 lock — recognisability beats consistency.
export const ScaleComparison: Story = {
  args: { firstName: "Wim", scale: "attribution" },
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <SubjectAvatar firstName="Wim" fullName="Wim Govaerts" scale="row" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          row · 32px
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SubjectAvatar
          firstName="Wim"
          fullName="Wim Govaerts"
          photoUrl={fixtureImage("staff-portrait", 0)}
          scale="attribution"
        />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          attribution · 64px (photo)
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SubjectAvatar
          firstName="Anouk"
          fullName="Anouk De Wit"
          scale="attribution"
        />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          attribution · 64px (fallback)
        </span>
      </div>
    </div>
  ),
};
