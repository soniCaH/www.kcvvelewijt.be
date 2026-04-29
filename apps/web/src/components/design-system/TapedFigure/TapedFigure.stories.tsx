import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
      backgroundImage:
        "repeating-linear-gradient(135deg, rgba(74, 207, 82, 0.18) 0 14px, transparent 14px 28px)",
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
    tape: [{ color: "jersey" }],
    caption: "Met tape en rotatie.",
    children: photoPlaceholder,
  },
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
