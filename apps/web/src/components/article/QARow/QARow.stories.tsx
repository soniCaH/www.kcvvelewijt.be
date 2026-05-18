import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QARow } from "./QARow";

const meta = {
  title: "Article/QARow",
  component: QARow,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Net-new Phase 5 interview primitive (5.d-int Round 1 — D lock). Question-first layout with one or more respondents below: italic display-sm question on top, then per-respondent (monogram avatar + speaker tag + body-md answer indented under the tag). Multi-respondent comes from the new `respondents[]` schema on `qaPair` (5.B.int migration).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-[680px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QARow>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single-respondent canonical case — equivalent to the pre-multi-
// respondent schema's single `respondentKey` + `answer` pair.
export const SingleRespondent: Story = {
  args: {
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
};

// Short answer — keeps the row compact.
export const ShortAnswer: Story = {
  args: {
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
};

// Long-form answer — verifies the body column wraps cleanly.
export const LongAnswer: Story = {
  args: {
    question: "Hoe kijk je terug op de tweede helft van het seizoen?",
    respondents: [
      {
        firstName: "Wim",
        fullName: "Wim Govaerts",
        role: "TRAINER",
        answer:
          "Het is een lang verhaal. De eerste weken na de winterstop waren zoeken — we wilden iets veranderen aan onze opbouw maar je merkt pas op de match wat werkt en wat niet. Tegen Diest klikte het, tegen Aarschot werkte het niet, en zo bouw je stilaan een ploeg op die op elk veld kan winnen. Het is geen wetenschap, het is gewoon werken en de mannen vertrouwen geven dat het in orde komt.",
      },
    ],
  },
};

// Speaker with no role.
export const NoSpeakerRole: Story = {
  args: {
    question: "Wat is je grootste ambitie voor volgend seizoen?",
    respondents: [
      {
        firstName: "Anouk",
        fullName: "Anouk De Wit",
        answer:
          "Een ploeg neerzetten die elke week haar identiteit toont — los van het resultaat.",
      },
    ],
  },
};

// Answer with inline `accent` emphasis (via PT in production; here a
// JSX node with the same class set as the renderer's accent mark).
export const AnswerWithInlineEmphasis: Story = {
  args: {
    question: "Wat was het verschil met vorig seizoen?",
    respondents: [
      {
        firstName: "Lars",
        fullName: "Lars Janssens",
        role: "AANVALLER",
        answer: (
          <p className="m-0">
            We hebben de kleedkamer{" "}
            <em className="text-jersey-deep font-black italic">
              wakker gekregen
            </em>
            . Dat is alles. Vorig jaar zat iedereen op zijn eigen ding; nu
            spelen we als één ploeg.
          </p>
        ),
      },
    ],
  },
};

// Multi-respondent duo Q&A — one question, two speakers each answer.
// The question lifts to full width above the respondent blocks.
export const DuoRespondents: Story = {
  args: {
    question: "Wat veranderde er na de winterstop?",
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
};

// Three-respondent panel Q&A — extends the multi-respondent rhythm.
export const PanelRespondents: Story = {
  args: {
    question: "Wat is het grootste verschil met vorig seizoen?",
    respondents: [
      {
        respondentKey: "lars",
        firstName: "Lars",
        fullName: "Lars Janssens",
        role: "AANVALLER",
        answer:
          "We laten ons niet meer omverwerpen door een vroege tegengoal. Vorig jaar was dat het einde, nu spelen we gewoon door.",
      },
      {
        respondentKey: "niels",
        firstName: "Niels",
        fullName: "Niels Peeters",
        role: "MIDDENVELDER",
        answer: "De fitheid. We sluiten elke match op dezelfde snelheid af.",
      },
      {
        respondentKey: "wim",
        firstName: "Wim",
        fullName: "Wim Govaerts",
        role: "TRAINER",
        answer:
          "De mentaliteit. Geen luchtkastelen meer. Gewoon werken, week na week.",
      },
    ],
  },
};
