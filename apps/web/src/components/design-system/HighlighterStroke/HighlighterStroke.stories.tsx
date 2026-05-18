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
  // children is required by the Story type but the render() composes its own
  // gallery instead of consuming args; an empty value satisfies the contract.
  args: { children: "" },
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

// Multi-line wrapping support (#1543). The implementation uses CSS
// `box-decoration-break: clone` so the stroke clones per visual line
// without JavaScript. VR baseline captures the multi-line render at
// max-w-md to lock the wrap geometry.
export const MultiLineWrapping: Story = {
  // children is required by the Story type but the render() supplies its own.
  args: { children: "" },
  render: () => (
    <div className="font-display text-display-lg max-w-md italic">
      <h2>
        Een{" "}
        <HighlighterStroke>
          erg lang gemarkeerd stuk dat over meerdere regels breekt
        </HighlighterStroke>{" "}
        wordt nu correct gemarkeerd per regel.
      </h2>
    </div>
  ),
};
