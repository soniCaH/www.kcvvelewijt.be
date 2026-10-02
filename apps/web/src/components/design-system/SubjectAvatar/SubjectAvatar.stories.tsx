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
          "The article's person avatar — a scale over the round avatar family (`UI/RoundAvatar`, #3332). `byline` (24px) and `row` (40px) always render an initial monogram; `attribution` (64px) renders a circular newsprint photo, falling back to a 64px monogram when no photo exists. The ring (1px ink at 24, 2px at 40 and 64) and the monogram fill (jersey-deep glyph on cream-soft) are the family's; one letter for a first-name-only subject, two for a full name.",
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
    scale: "byline",
  },
};

// 40px monogram — the only render path at row scale, even when a photo
// URL is supplied (per 5.d2 lock: a photo this small is too small to
// identify a face). Was 32px before the round family's ramp (#3332).
export const RowMonogram: Story = {
  args: {
    firstName: "Wim",
    scale: "row",
  },
};

// 64px photo with R9 newsprint treatment + 2px ink ring. The photo
// uses a stable Picsum seed so VR baselines don't churn.
export const AttributionPhoto: Story = {
  args: {
    firstName: "Wim",
    photoUrl: fixtureImage("staff-portrait", 0),
    scale: "attribution",
  },
};

// 64px monogram fallback when the subject has no photo.
export const AttributionMonogramFallback: Story = {
  args: {
    firstName: "Anouk",
    scale: "attribution",
  },
};

// Side-by-side comparison of the scales for the same subject. Shows the
// cross-scale "same speaker, two looks" tradeoff acknowledged by the
// 5.d2 lock — recognisability beats consistency.
export const ScaleComparison: Story = {
  args: { firstName: "Wim", scale: "attribution" },
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <SubjectAvatar firstName="Wim" scale="row" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          row · 40px
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SubjectAvatar
          firstName="Wim"
          photoUrl={fixtureImage("staff-portrait", 0)}
          scale="attribution"
        />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          attribution · 64px (photo)
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SubjectAvatar firstName="Anouk" scale="attribution" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          attribution · 64px (fallback)
        </span>
      </div>
    </div>
  ),
};
