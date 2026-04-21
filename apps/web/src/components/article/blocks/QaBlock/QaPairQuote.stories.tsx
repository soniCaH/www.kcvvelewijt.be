import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QaPairQuote } from "./QaPairQuote";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const quoteAnswer = (lines: string[]): PortableTextBlock[] =>
  lines.map((line, i) => ({
    _type: "block",
    _key: `block-${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `span-${i}`, text: line, marks: [] }],
  }));

const playerSubject: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Jeroen",
    lastName: "Van den Berghe",
    jerseyNumber: 9,
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

const staffSubject: SubjectValue = {
  kind: "staff",
  staffRef: {
    firstName: "Koen",
    lastName: "Dewaele",
    functionTitle: "Hoofdcoach A-ploeg",
    photoUrl: null,
  },
};

const meta = {
  title: "Features/Articles/QaBlock/QaPairQuote",
  component: QaPairQuote,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof QaPairQuote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlayerQuote: Story = {
  args: {
    answer: quoteAnswer([
      "Ik voetbal nog altijd met schrik in de buik.",
      "Dat is het enige wat mij scherp houdt.",
    ]),
    subject: playerSubject,
  },
};

export const StaffQuote: Story = {
  args: {
    answer: quoteAnswer([
      "Talent is geen alibi voor luiheid. Werk is het enige wat altijd terugkomt.",
    ]),
    subject: staffSubject,
  },
};
