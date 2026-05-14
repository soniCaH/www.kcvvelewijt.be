import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";
import { TapedCardGrid } from "../TapedCardGrid";
import { TapedFigure } from "./TapedFigure";

const meta = {
  title: "UI/TapedFigure",
  component: TapedFigure,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge max-w-2xl border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TapedFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

// Storybook fixture stand-in for a real editorial photograph. Renders an
// ink-coloured rectangle with a diagonal jersey-stripe pattern so it reads
// unambiguously as a "photo would go here" placeholder, distinct from the
// cream surrounding card. No external image dependency — VR baselines stay
// deterministic.
const photoPlaceholder = (
  <div
    className="bg-ink flex h-full w-full items-center justify-center"
    style={{
      // Use the design-system jersey-stripes pattern token so the placeholder
      // reads as a brand-consistent "photo would render here" surface.
      backgroundImage: "var(--pattern-jersey-stripes-tight)",
      backgroundBlendMode: "soft-light",
    }}
    aria-label="Sample editorial photo"
  >
    <span className="text-cream/60 font-mono text-[11px] tracking-[0.08em] uppercase">
      Editoriaal beeld
    </span>
  </div>
);

export const Default: Story = {
  args: { children: photoPlaceholder },
};

export const WithCaption: Story = {
  args: {
    caption: "Op weg naar de uitwedstrijd in Aarschot.",
    children: photoPlaceholder,
  },
};

export const WithCredit: Story = {
  args: { credit: "© KCVV", children: photoPlaceholder },
};

export const WithCaptionAndCredit: Story = {
  args: {
    caption: "Op weg naar de uitwedstrijd in Aarschot.",
    credit: "© KCVV",
    children: photoPlaceholder,
  },
};

export const Square: Story = {
  args: {
    aspect: "square",
    caption: "Vierkant fragment.",
    children: photoPlaceholder,
  },
};

export const Portrait: Story = {
  args: {
    aspect: "portrait-3-4",
    caption: "Portretverhouding.",
    children: photoPlaceholder,
  },
};

export const Auto: Story = {
  args: {
    aspect: "auto",
    caption:
      "Vrije verhouding — gebruik de afmetingen van de ingevoegde afbeelding.",
    children: photoPlaceholder,
  },
};

export const RotatedAndTaped: Story = {
  args: {
    rotation: "b",
    tape: { color: "jersey" },
    caption: "Met tape en rotatie.",
    children: photoPlaceholder,
  },
};

// Tint opt-out — R9 §3 default newsprint filter is suppressed for
// designed graphics where the warm tint shifts brand colours.
export const TintNone: Story = {
  args: {
    tint: "none",
    caption: "Filter off (data-tint=none).",
    children: photoPlaceholder,
  },
};

// Interactive lift — R9 §7 Variant A. Card press-down + photo translateY(-2).
// VR captures the rest state; the hover-active counterpart lives in
// `InteractiveLiftHover` per `feedback_state_coverage_stories`.
export const InteractiveLiftRest: Story = {
  args: {
    interactive: true,
    tape: { color: "warm", length: "lg" },
    caption: "Hover-lift idle.",
    children: photoPlaceholder,
  },
};

// Hover-state mirror for the layered lift. The repo has no
// pseudo-states Storybook addon (and we'd rather not install one for a
// single story), so this story renders an inline visual mirror of the
// hover state by setting the same CSS variables that the `:hover` rule
// flips on the live component. The wrapper applies `--card-press-x/y`
// and a `data-lift-state="active"` attribute that the global rule
// recognises as a non-hover-driven trigger for the photo lift. Pure
// visual reference for design review + VR baselines — the live hover
// path stays bound to `:hover` in production.
export const InteractiveLiftHover: Story = {
  args: {
    interactive: true,
    tape: { color: "warm", length: "lg" },
    caption: "Hover-lift active (mirror).",
    children: photoPlaceholder,
  },
  decorators: [
    (Story) => (
      <div
        style={
          {
            "--card-press-x": "1px",
            "--card-press-y": "1px",
          } as CSSProperties
        }
        data-lift-state="active"
        className="[&_.taped-figure]:shadow-none"
      >
        <Story />
      </div>
    ),
  ],
};

export const InsideGrid: Story = {
  args: { children: photoPlaceholder },
  render: () => (
    <TapedCardGrid columns={3}>
      <TapedFigure rotation="auto" caption="Eén">
        {photoPlaceholder}
      </TapedFigure>
      <TapedFigure rotation="auto" caption="Twee">
        {photoPlaceholder}
      </TapedFigure>
      <TapedFigure rotation="auto" caption="Drie">
        {photoPlaceholder}
      </TapedFigure>
    </TapedCardGrid>
  ),
};
