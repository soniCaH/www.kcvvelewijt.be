import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QASection, type QASectionRow } from "./QASection";

const meta = {
  title: "Article/QASection",
  component: QASection,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'Net-new Phase 5 interview surface (5.B.int). Wraps an interview\'s Q&A run inside the article body: optional `<MonoLabel>Q&A</MonoLabel>` heading + ordered `<QARow>`s with `<QASectionDivider variant="dotted">` inserted between adjacent rows. Container is pinned at `--container-prose` width.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QASection>;

export default meta;
type Story = StoryObj<typeof meta>;

const INTERVIEW_ROWS: QASectionRow[] = [
  {
    rowKey: "qa-1",
    question: "Wat was het moment dat alles draaide voor jullie dit seizoen?",
    respondents: [
      {
        firstName: "Lars",
        fullName: "Lars Janssens",
        role: "AANVALLER",
        answer:
          "Halfweg de eerste helft tegen Tervuren. We stonden 0-1 achter en in plaats van te ontploffen zag je iedereen rustig blijven, de bal beginnen rondspelen. Dat moment voelde iets nieuws.",
      },
    ],
  },
  {
    rowKey: "qa-2",
    question: "Eén woord om het seizoen samen te vatten?",
    respondents: [
      {
        firstName: "Niels",
        fullName: "Niels Peeters",
        role: "MIDDENVELDER",
        answer: "Volwassen.",
      },
    ],
  },
  {
    rowKey: "qa-3",
    question: "Wat is je grootste ambitie voor de eindronde?",
    respondents: [
      {
        firstName: "Wim",
        fullName: "Wim Govaerts",
        role: "TRAINER",
        answer:
          "Een ploeg neerzetten die elke wedstrijd hetzelfde verhaal vertelt — los van het resultaat. Als we dat doen, dan komen de punten vanzelf.",
      },
    ],
  },
  {
    rowKey: "qa-4",
    question: "Wat veranderde er na de winterstop?",
    // Multi-respondent: one question, two speakers answer. The renderer
    // lifts the question above and stacks the two respondent blocks.
    respondents: [
      {
        respondentKey: "lars",
        firstName: "Lars",
        fullName: "Lars Janssens",
        role: "AANVALLER",
        answer:
          "Halfweg de eerste helft tegen Tervuren. Iedereen ging plots de bal opeisen — dat was het.",
      },
      {
        respondentKey: "niels",
        firstName: "Niels",
        fullName: "Niels Peeters",
        role: "MIDDENVELDER",
        answer:
          "Voor mij was het de zaalstage. Drie dagen samen op stage, opeens kenden we elkaars looplijnen.",
      },
    ],
  },
];

// Standard 3-row Q&A — canonical layout. Verifies the MonoLabel heading,
// row order, and dotted-divider insertion between every adjacent pair.
export const ThreeRows: Story = {
  args: { rows: INTERVIEW_ROWS },
};

// Single-row Q&A — no inter-row divider. Edge case for a short Q&A or
// a single follow-up question.
export const SingleRow: Story = {
  args: { rows: INTERVIEW_ROWS.slice(0, 1) },
};

// Two-row Q&A — exactly one divider between them. Confirms the "no
// trailing divider after the last row" behaviour.
export const TwoRows: Story = {
  args: { rows: INTERVIEW_ROWS.slice(0, 2) },
};

// Long Q&A run — verifies the section reads as a transcript without
// visual fatigue. Mixes single and multi respondent rows.
export const LongRun: Story = {
  args: {
    rows: [
      ...INTERVIEW_ROWS,
      {
        rowKey: "qa-5",
        question: "Hoe kijk je terug op het bestuurlijke werk dit jaar?",
        respondents: [
          {
            firstName: "Anouk",
            fullName: "Anouk De Wit",
            role: "BESTUUR",
            answer:
              "Het is veel werk geweest, maar ook veel plezier. We hebben een ploeg, een trainer en een richting die elkaar versterken.",
          },
        ],
      },
      {
        rowKey: "qa-6",
        question: "Wat zou je tegen je 17-jarige zelf zeggen?",
        respondents: [
          {
            firstName: "Lars",
            fullName: "Lars Janssens",
            role: "AANVALLER",
            answer: "Geduld. En blijf werken — de rest komt vanzelf.",
          },
        ],
      },
      {
        rowKey: "qa-7",
        question: "Eén ding dat je echt mist als je terugkijkt?",
        respondents: [
          {
            firstName: "Wim",
            fullName: "Wim Govaerts",
            role: "TRAINER",
            answer:
              "De vrijdagavonden op de derde lijn. Dat was puur clubgevoel — vandaag heb je dat niet meer op die manier.",
          },
        ],
      },
    ],
  },
};

// Heading omitted — passes `heading={null}`. Useful for layouts where
// the Q&A run is the only body content and the article hero already
// signals the interview format.
export const NoHeading: Story = {
  args: { rows: INTERVIEW_ROWS, heading: null },
};

// Custom heading — verifies that the MonoLabel slot accepts arbitrary
// Dutch wording.
export const CustomHeading: Story = {
  args: { rows: INTERVIEW_ROWS, heading: "Het gesprek" },
};
