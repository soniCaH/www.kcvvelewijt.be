import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QaPairKey } from "./QaPairKey";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: "ans-1",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s1", text, marks: [] }],
  },
];

const playerSubject: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80",
  },
};

const customSubject: SubjectValue = {
  kind: "custom",
  customName: "Luc Janssens",
  customRole: "Oud-speler",
  customPhotoUrl:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80",
};

const meta = {
  title: "Features/Articles/QaBlock/QaPairKey",
  component: QaPairKey,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof QaPairKey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPlayer: Story = {
  args: {
    question: "Je moment van de voorbije vijf jaar",
    answer: answer(
      "Eindrondewinst tegen Kraainem — na een 4-2 nederlaag uit, werd de promotie thuis alsnog binnengehaald met een overtuigende 3-0 overwinning.",
    ),
    subject: playerSubject,
  },
};

export const WithCustomSubject: Story = {
  args: {
    question: "Wat maakt Elewijt uniek?",
    answer: answer(
      "Het is de énige plek waar een verloren pass je 's maandags nog op café wordt nagedragen.",
    ),
    subject: customSubject,
  },
};

export const NoSubject: Story = {
  args: {
    question: "Zonder subject-fallback",
    answer: answer(
      "Ook zonder subject moet het blok renderen — gewoon zonder foto- en attributie-kolom.",
    ),
    subject: null,
  },
};
