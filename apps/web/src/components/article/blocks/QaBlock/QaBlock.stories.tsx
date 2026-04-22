import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QaBlock } from "./QaBlock";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

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
          "Phase 2 tag suite. `standard` pairs flow inside the 65 ch column; `key` and `quote` break out full-bleed; consecutive `rapid-fire` pairs collapse into a single `QaGroupRapidFire`.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => (
    <div className="mx-auto max-w-[65ch]">
      <QaBlock {...args} />
    </div>
  ),
} satisfies Meta<typeof QaBlock>;

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

export const MixedTagSuite: Story = {
  args: {
    subject: playerSubject,
    value: {
      pairs: [
        {
          _key: "p1",
          tag: "standard",
          question: "Wat is je eerste herinnering aan KCVV?",
          answer: answer("Als U9 spelen op het A-terrein, met de dug-out vol."),
        },
        {
          _key: "p2",
          tag: "standard",
          question: "Welke coach heeft je het meest gevormd?",
          answer: answer(
            "De Presi. Niet omdat hij tactisch briljant was, maar omdat hij eerlijk was.",
          ),
        },
        {
          _key: "p3",
          tag: "key",
          question: "Je moment van de voorbije vijf jaar",
          answer: answer(
            "Eindrondewinst tegen Kraainem: thuis 3-0, met een waanzinnig promotiefeest.",
          ),
        },
        {
          _key: "p4",
          tag: "rapid-fire",
          question: "Koffie of thee?",
          answer: answer("Koffie. Zwart."),
        },
        {
          _key: "p5",
          tag: "rapid-fire",
          question: "Regen of sneeuw?",
          answer: answer("Regen. Sneeuw verpest de bal."),
        },
        {
          _key: "p6",
          tag: "rapid-fire",
          question: "Rechter- of linkervoet?",
          answer: answer("Rechts schot, links sturen."),
        },
        {
          _key: "p7",
          tag: "quote",
          question: "(verborgen voor quote)",
          answer: answer(
            "Ik voetbal nog altijd met schrik in de buik — dat is het enige wat mij scherp houdt.",
          ),
        },
        {
          _key: "p8",
          tag: "standard",
          question: "Eén boodschap voor de supporters?",
          answer: answer(
            "Een club is maar zo sterk als haar supporters. Merci voor alles.",
          ),
        },
      ],
    },
  },
};
