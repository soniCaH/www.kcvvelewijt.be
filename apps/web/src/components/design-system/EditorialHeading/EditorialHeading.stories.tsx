import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialHeading } from "./EditorialHeading";

const meta = {
  title: "UI/EditorialHeading",
  component: EditorialHeading,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge max-w-2xl border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { level: 2, children: "Het rooster" },
};

export const WithEmphasisInline: Story = {
  args: {
    level: 2,
    children: "Het laatste nieuws",
    emphasis: { text: "nieuws" },
  },
};

export const WithEmphasisHighlighted: Story = {
  args: {
    level: 2,
    children: "Het laatste nieuws",
    emphasis: { text: "nieuws", highlight: true },
  },
};

/**
 * Emphasis at default tone (`jersey-deep`) on the cream surface — the
 * canonical editorial accent. Same surface as `WithEmphasisInline`,
 * named explicitly so the per-tone matrix is grep-able.
 */
export const AccentJerseyDeep: Story = {
  args: {
    level: 2,
    children: "Het laatste nieuws",
    emphasis: { text: "nieuws", tone: "jersey-deep" },
  },
};

/**
 * Emphasis at `tone="warm"` on a jersey-deep surface — the contrast
 * pairing this tone exists for. `<FeaturedEventBand>` (#1531 workaround
 * removed in this PR) and `<YouthBlock>` (#1675) consume it.
 */
export const AccentWarmOnJerseyDeep: Story = {
  args: {
    level: 2,
    size: "display-lg",
    tone: "cream",
    children: "De toekomst van Elewijt",
    emphasis: { text: "De toekomst", tone: "warm" },
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep border-jersey-deep-dark max-w-2xl border p-10">
        <Story />
      </div>
    ),
  ],
};

/**
 * Marker variant — kept under `HighlightMarker` to match the issue body's
 * named story list (alias of `WithEmphasisHighlighted`).
 */
export const HighlightMarker: Story = {
  args: {
    level: 2,
    children: "Het laatste nieuws",
    emphasis: { text: "nieuws", highlight: true },
  },
};

/**
 * Portable Text accent span at `accentTone="warm"` on jersey-deep —
 * mirrors `AccentWarmOnJerseyDeep` for the Portable Text path so the
 * Studio editor's accent decorator works on dark surfaces too.
 */
export const PortableTextAccentWarmOnJerseyDeep: Story = {
  args: { level: 2, children: "x" },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep border-jersey-deep-dark max-w-2xl border p-10">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <EditorialHeading
      level={2}
      size="display-lg"
      tone="cream"
      accentTone="warm"
    >
      {[
        {
          _type: "block",
          _key: "a",
          style: "normal",
          markDefs: [],
          children: [
            { _type: "span", _key: "a1", text: "De ", marks: [] },
            { _type: "span", _key: "a2", text: "toekomst", marks: ["accent"] },
            { _type: "span", _key: "a3", text: " van Elewijt", marks: [] },
          ],
        },
      ]}
    </EditorialHeading>
  ),
};

export const EveryLevel: Story = {
  args: { level: 2, children: "x" },
  render: () => (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4, 5, 6].map((lvl) => (
        <EditorialHeading
          key={lvl}
          level={lvl as 1 | 2 | 3 | 4 | 5 | 6}
          size="display-md"
        >
          {`Heading h${lvl}`}
        </EditorialHeading>
      ))}
    </div>
  ),
};

export const EverySize: Story = {
  args: { level: 2, children: "x" },
  render: () => (
    <div className="flex flex-col gap-6">
      {(
        [
          "display-2xl",
          "display-xl",
          "display-lg",
          "display-md",
          "display-sm",
        ] as const
      ).map((s) => (
        <EditorialHeading key={s} level={2} size={s}>
          {`Het rooster — ${s}`}
        </EditorialHeading>
      ))}
    </div>
  ),
};

/**
 * Phase 3 Ask 9 — title as constrained Portable Text with the `accent`
 * decorator on the word "kantine" / "hoofdtribune". Editor selects a
 * word in Studio and clicks the Accent button — it renders italic +
 * jersey-deep without substring matching.
 */
export const PortableTextAccent: Story = {
  args: { level: 1, children: "x" },
  render: () => (
    <div className="flex flex-col gap-8">
      <EditorialHeading level={1} size="display-xl">
        {[
          {
            _type: "block",
            _key: "a",
            style: "normal",
            markDefs: [],
            children: [
              { _type: "span", _key: "a1", text: "De ", marks: [] },
              { _type: "span", _key: "a2", text: "kantine", marks: ["accent"] },
              { _type: "span", _key: "a3", text: " blijft open", marks: [] },
            ],
          },
        ]}
      </EditorialHeading>
      <EditorialHeading level={1} size="display-xl">
        {[
          {
            _type: "block",
            _key: "b",
            style: "normal",
            markDefs: [],
            children: [
              { _type: "span", _key: "b1", text: "Werken aan de ", marks: [] },
              {
                _type: "span",
                _key: "b2",
                text: "hoofdtribune",
                marks: ["accent"],
              },
            ],
          },
        ]}
      </EditorialHeading>
      <EditorialHeading level={1} size="display-xl">
        {[
          {
            _type: "block",
            _key: "c",
            style: "normal",
            markDefs: [],
            children: [
              {
                _type: "span",
                _key: "c1",
                text: "Geen accent hier",
                marks: [],
              },
            ],
          },
        ]}
      </EditorialHeading>
    </div>
  ),
};

export const ToneVariants: Story = {
  args: { level: 2, children: "x" },
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <EditorialHeading level={2} tone="ink" size="display-md">
          Tone ink
        </EditorialHeading>
      </div>
      <div>
        <EditorialHeading level={2} tone="jersey-deep" size="display-md">
          Tone jersey-deep
        </EditorialHeading>
      </div>
      <div className="bg-ink p-6">
        <EditorialHeading level={2} tone="cream" size="display-md">
          Tone cream
        </EditorialHeading>
      </div>
    </div>
  ),
};
