import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QaBlock } from "./QaBlock";
import type { SubjectValue } from "@/components/article/SubjectAttribution";
import { fixtureImage } from "@test-fixtures/images";

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
          "Phase 5 dispatcher. `standard` pairs render through `<QARow>`; `key` and `quote` render through `<PullQuote>` (cream / ink tones); consecutive `rapid-fire` pairs collapse into a single `<QaGroupRapidFire>`. All paths resolve speakers from `article.subjects[]`.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  render: (args) => (
    <div className="bg-cream mx-auto w-full max-w-[680px] p-8">
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
    psdImageUrl: fixtureImage("player-portrait", 0),
  },
};

// Stories render a single-subject article — the subjects[] prop mirrors
// runtime behaviour where SanityArticleBody / QaBlock receive the full
// article.subjects[] array, even when there's only one entry.
const singleSubject = [{ _key: "maxim-k", ...playerSubject }];

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoStandardPairs: Story = {
  args: {
    subjects: singleSubject,
    value: {
      pairs: [
        {
          _key: "pair-1",
          tag: "standard",
          question: "Wat is je eerste herinnering aan KCVV?",
          respondents: [
            {
              answer: answer(
                "Als U9 spelen op het A-terrein, nog met mijn grote broer in de dug-out. Ik weet nog dat het regende en dat ik dacht: ik wil hier nooit meer weg.",
              ),
            },
          ],
        },
        {
          _key: "pair-2",
          tag: "standard",
          question:
            "En wat maakt KCVV anders dan de andere clubs waar je speelde?",
          respondents: [
            {
              answer: answer(
                "De mensen. Je speelt niet voor de voorzitter of de sponsor — je speelt voor de cafébaas die na de match weet dat je een mislukte pass gaf. Dat is de plezante compagnie.",
              ),
            },
          ],
        },
      ],
    },
  },
};

export const SinglePair: Story = {
  args: {
    subjects: singleSubject,
    value: {
      pairs: [
        {
          _key: "pair-1",
          tag: "standard",
          question: "Eén vraag, één antwoord — zonder rule eronder.",
          respondents: [
            {
              answer: answer(
                "Precies. Het 1 px `kcvv-gray-light` lijntje valt weg na de laatste pair.",
              ),
            },
          ],
        },
      ],
    },
  },
};

export const MixedTagSuite: Story = {
  args: {
    subjects: singleSubject,
    value: {
      pairs: [
        {
          _key: "p1",
          tag: "standard",
          question: "Wat is je eerste herinnering aan KCVV?",
          respondents: [
            {
              answer: answer(
                "Als U9 spelen op het A-terrein, met de dug-out vol.",
              ),
            },
          ],
        },
        {
          _key: "p2",
          tag: "standard",
          question: "Welke coach heeft je het meest gevormd?",
          respondents: [
            {
              answer: answer(
                "De Presi. Niet omdat hij tactisch briljant was, maar omdat hij eerlijk was.",
              ),
            },
          ],
        },
        {
          _key: "p3",
          tag: "key",
          question: "Je moment van de voorbije vijf jaar",
          respondents: [
            {
              answer: answer(
                "Eindrondewinst tegen Kraainem: thuis 3-0, met een waanzinnig promotiefeest.",
              ),
            },
          ],
        },
        {
          _key: "p4",
          tag: "rapid-fire",
          question: "Koffie of thee?",
          respondents: [{ answer: answer("Koffie. Zwart.") }],
        },
        {
          _key: "p5",
          tag: "rapid-fire",
          question: "Regen of sneeuw?",
          respondents: [{ answer: answer("Regen. Sneeuw verpest de bal.") }],
        },
        {
          _key: "p6",
          tag: "rapid-fire",
          question: "Rechter- of linkervoet?",
          respondents: [{ answer: answer("Rechts schot, links sturen.") }],
        },
        {
          _key: "p7",
          tag: "quote",
          question: "(verborgen voor quote)",
          respondents: [
            {
              answer: answer(
                "Ik voetbal nog altijd met schrik in de buik — dat is het enige wat mij scherp houdt.",
              ),
            },
          ],
        },
        {
          _key: "p8",
          tag: "standard",
          question: "Eén boodschap voor de supporters?",
          respondents: [
            {
              answer: answer(
                "Een club is maar zo sterk als haar supporters. Merci voor alles.",
              ),
            },
          ],
        },
      ],
    },
  },
};
