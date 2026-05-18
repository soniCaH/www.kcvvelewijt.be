import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QaGroupRapidFire } from "./QaGroupRapidFire";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `b-${text.slice(0, 6)}`,
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: `s-${text.slice(0, 6)}`, text, marks: [] },
    ],
  },
];

const meta = {
  title: "Features/Articles/QaBlock/QaGroupRapidFire",
  component: QaGroupRapidFire,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof QaGroupRapidFire>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FivePairs: Story = {
  args: {
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Koffie of thee?",
        respondents: [{ answer: answer("Koffie. Zwart.") }],
      },
      {
        _key: "rf-2",
        tag: "rapid-fire",
        question: "Messi of Ronaldo?",
        respondents: [{ answer: answer("Messi — en het is geen discussie.") }],
      },
      {
        _key: "rf-3",
        tag: "rapid-fire",
        question: "Regen of sneeuw bij een match?",
        respondents: [{ answer: answer("Regen. Sneeuw verpest de bal.") }],
      },
      {
        _key: "rf-4",
        tag: "rapid-fire",
        question: "Linker- of rechtervoet?",
        respondents: [{ answer: answer("Rechts schot, links sturen.") }],
      },
      {
        _key: "rf-5",
        tag: "rapid-fire",
        question: "Mooiste tenue ooit?",
        respondents: [
          { answer: answer("Het 125-jaar-herdenkingstenue uit 2022.") },
        ],
      },
    ],
  },
};

export const SinglePair: Story = {
  args: {
    pairs: [
      {
        _key: "rf-solo",
        tag: "rapid-fire",
        question: "Eén sneltrein-vraag",
        respondents: [{ answer: answer("Eén sneltrein-antwoord.") }],
      },
    ],
  },
};
