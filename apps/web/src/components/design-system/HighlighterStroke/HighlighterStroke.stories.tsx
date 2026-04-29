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

// Default story renders the stroke in its real context — under italic
// emphasis inside a display-sized heading. Renders the actual visual
// signal a reviewer needs ("does the marker pass land cleanly under a
// real word at real size") rather than a thin abstract line.
export const Playground: Story = {
  args: { children: "nieuws.", color: "jersey" },
  render: ({ children, color }) => (
    <h2 className="font-display text-display-lg italic">
      Laatste <HighlighterStroke color={color}>{children}</HighlighterStroke>
    </h2>
  ),
};

export const InAHeading: Story = {
  args: { children: "toekomst", color: "jersey" },
  render: ({ children, color }) => (
    <h2 className="font-display text-display-xl italic">
      De <HighlighterStroke color={color}>{children}</HighlighterStroke> van
      Elewijt.
    </h2>
  ),
};

export const ColorVariants: Story = {
  args: { children: "x" },
  render: () => (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-display-lg italic">
        Laatste <HighlighterStroke color="jersey">nieuws.</HighlighterStroke>
      </h2>
      <h2 className="font-display text-display-lg italic">
        Laatste{" "}
        <HighlighterStroke color="jersey-deep">nieuws.</HighlighterStroke>
      </h2>
      <h2 className="font-display text-display-lg italic">
        Laatste <HighlighterStroke color="ink">nieuws.</HighlighterStroke>
      </h2>
      <div className="bg-ink p-6">
        <h2 className="font-display text-cream text-display-lg italic">
          Laatste <HighlighterStroke color="cream">nieuws.</HighlighterStroke>
        </h2>
      </div>
    </div>
  ),
};

// Multi-line wrapping is a known limitation deferred to Phase 1+ — the CSS
// background-image approach lays a single horizontal stroke across the
// highlighted span's bounding box and does not repeat per visual line.
// Story renders without crashing but the visual is intentionally not
// VR-baselined (parameters.vr.disable).
export const MultiLineUnsupported: Story = {
  parameters: {
    // vr.disable: known-broken visual (multi-line wrapping unsupported);
    // story renders without crashing so vr-skip doesn't apply.
    // Repro: render <HighlighterStroke> over wrapped text; stroke fails to
    // repeat per visual line.
    // Approved by: PR #1519 code review 2026-04-28
    // Re-evaluate: 2026-10-01 (or earlier when #1543 multi-line support ships)
    vr: { disable: true },
  },
  args: { children: "x" },
  render: () => (
    <div className="font-display text-display-lg max-w-md italic">
      <h2>
        Een{" "}
        <HighlighterStroke>
          erg lang gemarkeerd stuk dat over meerdere regels breekt
        </HighlighterStroke>{" "}
        ziet er nu nog niet correct uit.
      </h2>
    </div>
  ),
};
