import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HighlighterStroke } from "./HighlighterStroke";

const meta = {
  title: "UI/HighlighterStroke",
  component: HighlighterStroke,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-3xl p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HighlighterStroke>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { variant: "a", children: "nieuws" },
};

export const VariantA: Story = {
  args: { variant: "a", children: "nieuws" },
  render: (args) => (
    <h2 className="font-display text-display-lg italic">
      Laatste{" "}
      <HighlighterStroke {...args}>
        {args.children ?? "nieuws."}
      </HighlighterStroke>
    </h2>
  ),
};

export const VariantB: Story = {
  args: { variant: "b", children: "eigen woorden." },
  render: (args) => (
    <h2 className="font-display text-display-lg italic">
      In zijn{" "}
      <HighlighterStroke {...args}>
        {args.children ?? "eigen woorden."}
      </HighlighterStroke>
    </h2>
  ),
};

export const VariantC: Story = {
  args: { variant: "c", children: "toekomst" },
  render: (args) => (
    <h2 className="font-display text-display-lg italic">
      De{" "}
      <HighlighterStroke {...args}>
        {args.children ?? "toekomst"}
      </HighlighterStroke>{" "}
      van Elewijt.
    </h2>
  ),
};

export const AllVariants: Story = {
  args: { children: "x" },
  render: () => (
    <div className="font-display text-display-lg flex flex-col gap-6 italic">
      <h2>
        Laatste <HighlighterStroke variant="a">nieuws.</HighlighterStroke>
      </h2>
      <h2>
        In zijn{" "}
        <HighlighterStroke variant="b">eigen woorden.</HighlighterStroke>
      </h2>
      <h2>
        De <HighlighterStroke variant="c">toekomst</HighlighterStroke> van
        Elewijt.
      </h2>
    </div>
  ),
};

// Phase 0 limitation: the CSS background-image approach lays a single
// horizontal stroke across the highlighted span's bounding box. When the
// span wraps onto multiple lines, the background scales to one line-height
// of the bounding box and does NOT repeat per visual line — so multi-line
// highlights are visually broken. Multi-line support is deferred to
// Phase 1+. The story renders fine (no crash); it's just a known-broken
// visual that we don't want VR to baseline. `parameters.vr.disable = true`
// suppresses screenshot capture without excluding the story at discovery
// (per apps/web/CLAUDE.md: `vr-skip` is reserved for stories that crash).
export const MultiLineUnsupported: Story = {
  parameters: {
    // vr.disable: known-broken visual (multi-line wrapping unsupported in
    // Phase 0); the story renders without crashing, so vr-skip doesn't apply.
    // Repro: render <HighlighterStroke> over wrapped text; stroke fails to
    // repeat per visual line.
    // Approved by: PR #1519 code review (CodeRabbit) 2026-04-28
    // Re-evaluate: when multi-line support ships in Phase 1+
    vr: { disable: true },
  },
  args: { children: "x" },
  render: () => (
    <div className="font-display text-display-lg max-w-md italic">
      <h2>
        Een{" "}
        <HighlighterStroke variant="a">
          erg lang gemarkeerd stuk dat over meerdere regels breekt
        </HighlighterStroke>{" "}
        ziet er nu nog niet correct uit.
      </h2>
    </div>
  ),
};
