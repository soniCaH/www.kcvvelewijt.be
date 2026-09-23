import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
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
    <span className="text-cream-quiet font-mono text-[11px] tracking-[0.08em] uppercase">
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

// A real photograph with faces in it — the D9 mockup's own skin-tone test
// fixture (docs/design/mockups/research-d-series/d9-overprint.html). A
// synthetic swatch cannot demonstrate "shadows move, faces pass through
// unchanged" — that claim is only verifiable on real photography.
//
// Deliberately sourced from `public/images/youth-trainers.jpg` rather than
// the `@test-fixtures/images` pool every other story here uses: this is the
// exact photo the D9 mockup and decision sheet used for the skin-tone test,
// and that parity with the evidence the decision was made against is worth
// more than the small determinism risk. It does not fit the pool's curated,
// hashed-filename webp set either. Coupling: these two stories' VR baselines
// will move if `youth-trainers.jpg` is ever re-cropped, re-compressed, or
// replaced.
//
// `alt=""` — both consuming stories set `caption`, so the caption is the
// alt carrier per this component's own either-or rule (see TapedFigureProps
// docblock above); an alt here too would be the same sentence read twice.
const photoWithFaces = (
  <Image
    src="/images/youth-trainers.jpg"
    alt=""
    fill
    sizes="480px"
    className="object-cover"
  />
);

// Baseline — no overprint (data-print="none", the default). Paired with
// `Overprint` below so the two are directly comparable: the photo area
// should be the only thing that differs between them (only the shadows
// move). The caption row differs by design — it names which story you're
// looking at — so it is not part of that comparison.
export const PhotoBaseline: Story = {
  args: {
    caption: "Geen overprint (data-print=none, standaard).",
    children: photoWithFaces,
  },
};

// Overprint opt-in (D9 / T2, #2619) — `mix-blend-mode: lighten` against
// the dark `--color-jersey-deep-dark` plate. Compare the photo area against
// `PhotoBaseline` above: hair, shade and dark kit should move toward dark
// green there; faces and mid-tones should read identically in both.
export const Overprint: Story = {
  args: {
    print: "overprint",
    caption: "Overprint aan (data-print=overprint).",
    children: photoWithFaces,
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
