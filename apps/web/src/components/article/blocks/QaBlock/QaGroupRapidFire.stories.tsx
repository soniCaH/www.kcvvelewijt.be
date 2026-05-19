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

const LARS = {
  firstName: "Lars",
  fullName: "Lars Janssens",
  role: "AANVALLER",
};

const meta = {
  title: "Features/Articles/QaBlock/QaGroupRapidFire",
  component: QaGroupRapidFire,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 5 rewrite (interview-rapidfire-locked.md). `Kort & Krachtig` MonoLabel opener between 1px ink hairlines + speaker strip + hanging-Q rows. Mobile collapses to single column.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-[680px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QaGroupRapidFire>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    respondent: LARS,
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Favoriete goal",
        respondents: [
          { answer: answer("De volley tegen Diest in de slotminuut.") },
        ],
      },
      {
        _key: "rf-2",
        tag: "rapid-fire",
        question: "Speler om te volgen",
        respondents: [{ answer: answer("Wim. Hij maakt iedereen beter.") }],
      },
      {
        _key: "rf-3",
        tag: "rapid-fire",
        question: "Bus-muziek",
        respondents: [
          { answer: answer('"Geen liedjes — koptelefoon op, ogen dicht."') },
        ],
      },
      {
        _key: "rf-4",
        tag: "rapid-fire",
        question: "Eerste KCVV-herinnering",
        respondents: [{ answer: answer("Hand vasthouden van mijn pa, U7.") }],
      },
    ],
  },
};

export const SinglePair: Story = {
  args: {
    respondent: LARS,
    pairs: [
      {
        _key: "rf-solo",
        tag: "rapid-fire",
        question: "Koffie of thee",
        respondents: [{ answer: answer("Koffie. Zwart.") }],
      },
    ],
  },
};

export const ThreeConsecutive: Story = {
  name: "Three consecutive (divider check)",
  args: {
    respondent: LARS,
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Koffie of thee",
        respondents: [{ answer: answer("Koffie. Zwart.") }],
      },
      {
        _key: "rf-2",
        tag: "rapid-fire",
        question: "Messi of Ronaldo",
        respondents: [{ answer: answer("Messi — geen discussie.") }],
      },
      {
        _key: "rf-3",
        tag: "rapid-fire",
        question: "Linker- of rechtervoet",
        respondents: [{ answer: answer("Rechts schot, links sturen.") }],
      },
    ],
  },
};

export const LongQuestionAndAnswer: Story = {
  name: "Long question + long answer",
  args: {
    respondent: LARS,
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Mooiste herinnering aan KCVV",
        respondents: [
          {
            answer: answer(
              "Toen ik als U7 voor het eerst over het kunstgras liep, hand in hand met mijn pa. Ik herinner me nog de geur van de kantine en de stem van mijn eerste trainer die mijn naam riep.",
            ),
          },
        ],
      },
    ],
  },
};

export const EmptyAnswer: Story = {
  name: "Empty answer (em-dash placeholder)",
  args: {
    respondent: LARS,
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Favoriete fitness-oefening",
        respondents: [{ answer: [] }],
      },
      {
        _key: "rf-2",
        tag: "rapid-fire",
        question: "Schoenmaat",
        respondents: [{ answer: answer("44.") }],
      },
    ],
  },
};

export const WithoutRespondent: Story = {
  name: "Without respondent (no speaker strip)",
  args: {
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Koffie of thee",
        respondents: [{ answer: answer("Koffie. Zwart.") }],
      },
      {
        _key: "rf-2",
        tag: "rapid-fire",
        question: "Messi of Ronaldo",
        respondents: [{ answer: answer("Messi.") }],
      },
    ],
  },
};

export const MobileNarrow: Story = {
  name: "Mobile — narrow viewport (375px)",
  args: {
    respondent: LARS,
    pairs: [
      {
        _key: "rf-1",
        tag: "rapid-fire",
        question: "Favoriete goal",
        respondents: [{ answer: answer("De volley tegen Diest.") }],
      },
      {
        _key: "rf-2",
        tag: "rapid-fire",
        question: "Speler om te volgen",
        respondents: [{ answer: answer("Wim. Hij maakt iedereen beter.") }],
      },
    ],
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
