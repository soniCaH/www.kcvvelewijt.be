import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QaBlock } from "./QaBlock";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `block-${text.slice(0, 8)}`,
    style: "normal",
    children: [
      {
        _type: "span",
        _key: `span-${text.slice(0, 8)}`,
        text,
        marks: [],
      },
    ],
    markDefs: [],
  },
];

const meta = {
  title: "Features/Articles/QaBlock",
  component: QaBlock,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 1 tracer rendering of the interview qaBlock. Only the `standard` tag is implemented; `key`, `quote`, and `rapid-fire` ship in Phase 2.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-[65ch] mx-auto">
      <QaBlock {...args} />
    </div>
  ),
} satisfies Meta<typeof QaBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoStandardPairs: Story = {
  args: {
    value: {
      pairs: [
        {
          _key: "pair-1",
          tag: "standard",
          question: "Wat is je eerste herinnering aan KCVV?",
          answer: answer(
            "Als U9 spelen op het A-terrein, nog met mijn grote broer in de dug-out. Ik weet nog dat het regende en dat ik dacht: ik wil hier nooit meer weg.",
          ),
        },
        {
          _key: "pair-2",
          tag: "standard",
          question:
            "En wat maakt KCVV anders dan de andere clubs waar je speelde?",
          answer: answer(
            "De mensen. Je speelt niet voor de voorzitter of de sponsor — je speelt voor de cafébaas die na de match weet dat je een mislukte pass gaf. Dat is de plezante compagnie.",
          ),
        },
      ],
    },
  },
};

export const SinglePair: Story = {
  args: {
    value: {
      pairs: [
        {
          _key: "pair-1",
          tag: "standard",
          question: "Eén vraag, één antwoord — zonder rule eronder.",
          answer: answer(
            "Precies. Het 1 px `kcvv-gray-light` lijntje valt weg na de laatste pair.",
          ),
        },
      ],
    },
  },
};
