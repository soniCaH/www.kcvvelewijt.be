import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QASectionDivider } from "./QASectionDivider";

const titlePlain: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "t1",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "s1",
        text: "De jaren tussen de lijnen.",
        marks: [],
      },
    ],
  },
];

const titleWithAccent: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "t2",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: "s1", text: "De jaren ", marks: [] },
      { _type: "span", _key: "s2", text: "tussen", marks: ["accent"] },
      { _type: "span", _key: "s3", text: " de lijnen.", marks: [] },
    ],
  },
];

const meta = {
  title: "UI/QASectionDivider",
  component: QASectionDivider,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QASectionDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { title: titlePlain },
};

export const Default: Story = {
  args: { title: titlePlain },
};

export const WithAccent: Story = {
  args: { title: titleWithAccent },
};

export const WithKicker: Story = {
  args: { title: titlePlain, kicker: "AKTE 02 · DE OVERSTAP" },
};

export const WithAccentAndKicker: Story = {
  args: { title: titleWithAccent, kicker: "AKTE 02 · DE OVERSTAP" },
};

/**
 * Visual verification overlay — guide line through the rule row so a reviewer
 * can confirm the 1px rules, both ✦ glyphs, and the cap-height midpoint of
 * the italic title all touch the same horizontal line. The kicker is omitted
 * in this story so the overlay isn't off-centre relative to the rule row.
 */
export const AlignmentProof: Story = {
  args: { title: titleWithAccent },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge relative border p-12">
        <Story />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 top-1/2 h-px bg-fuchsia-500/60"
        />
      </div>
    ),
  ],
};
