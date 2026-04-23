import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { InterviewTemplate } from "./InterviewTemplate";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

const block = (text: string, key: string): PortableTextBlock => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
});

const answer = (text: string, key: string) => [block(text, key)];

const MAXIM: IndexedSubject = {
  _key: "maxim-k",
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    position: "Middenvelder",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80",
  },
};

const JEROEN: IndexedSubject = {
  _key: "jeroen-k",
  kind: "player",
  playerRef: {
    firstName: "Jeroen",
    lastName: "Van den Berghe",
    jerseyNumber: 5,
    position: "Verdediger",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&q=80",
  },
};

const THOMAS: IndexedSubject = {
  _key: "thomas-k",
  kind: "player",
  playerRef: {
    firstName: "Thomas",
    lastName: "Peeters",
    jerseyNumber: 11,
    position: "Aanvaller",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1605235186583-a65c4f4d1c3a?w=600&q=80",
  },
};

const LUC: IndexedSubject = {
  _key: "luc-k",
  kind: "player",
  playerRef: {
    firstName: "Luc",
    lastName: "Janssens",
    jerseyNumber: 3,
    position: "Keeper",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80",
  },
};

const meta = {
  title: "Pages/Article/Interview",
  component: InterviewTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full interview page composition — InterviewHero (kicker + subtitle + 4:5 portrait), §7.6 metadata bar, and a 6-pair qaBlock mixing every tag variant with a player subject.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InterviewTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullComposition: Story = {
  args: {
    title:
      "Drive, passie, doorzettingsvermogen — vijf seizoenen Maxim Breugelmans",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80",
    publishedDate: "19.04.2026",
    readingTime: "6 min lezen",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/phase-3-tracer",
      title: "Maxim Breugelmans interview",
    },
    subjects: [MAXIM],
    body: [
      {
        _type: "block",
        _key: "intro",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "intro-s",
            marks: [],
            text: "Na vijf seizoenen neemt Maxim Breugelmans afscheid van Elewijt. Een gesprek over herinneringen, gewoontes en de Plezante Compagnie.",
          },
        ],
      },
      {
        _key: "qa",
        _type: "qaBlock",
        pairs: [
          {
            _key: "p1",
            tag: "standard",
            question: "Wat is je eerste herinnering aan KCVV?",
            answer: answer(
              "Als U9 spelen op het A-terrein, met mijn grote broer in de dug-out.",
              "p1-a",
            ),
          },
          {
            _key: "p2",
            tag: "standard",
            question: "En welk advies van een coach kleefde het best?",
            answer: answer(
              "Van de Presi: “Er moet gewonnen worden.” Geen discussie mogelijk.",
              "p2-a",
            ),
          },
          {
            _key: "p3",
            tag: "key",
            question: "Je moment van de voorbije vijf jaar",
            answer: answer(
              "Eindrondewinst tegen Kraainem. Thuis 3-0, met een waanzinnig promotiefeest.",
              "p3-a",
            ),
          },
          {
            _key: "p4",
            tag: "rapid-fire",
            question: "Koffie of thee?",
            answer: answer("Koffie. Zwart.", "p4-a"),
          },
          {
            _key: "p5",
            tag: "rapid-fire",
            question: "Regen of sneeuw?",
            answer: answer("Regen. Sneeuw verpest de bal.", "p5-a"),
          },
          {
            _key: "p6",
            tag: "quote",
            question: "(hidden for quote)",
            answer: answer(
              "Een club is maar zo sterk als haar supporters — en Elewijt is een beresterke club.",
              "p6-a",
            ),
          },
        ],
      },
    ] as unknown as PortableTextBlock[],
  },
};

export const WithoutCoverImage: Story = {
  args: {
    ...FullComposition.args,
    coverImageUrl: null,
  },
};

export const WithoutSubject: Story = {
  args: {
    ...FullComposition.args,
    subjects: null,
  },
};

// Rename the N=1 baseline to match #1358 naming. FullComposition stays as
// the legacy story name; the `Single` export below is the canonical
// anchor for the new N=1/2/3/4 variants.

export const Single: Story = {
  name: "Single / N=1 baseline",
  args: {
    ...FullComposition.args,
  },
};

export const Duo: Story = {
  name: "Duo / N=2",
  args: {
    ...FullComposition.args,
    title: "Afscheid duo: Maxim en Jeroen sluiten vijf seizoenen af.",
    // Keep the full qaBlock suite from FullComposition. For duo, set the
    // respondentKey on key/quote pairs to exercise per-pair attribution —
    // real authoring requires it, and it lets the story faithfully render
    // the side-by-side hero + alternating cutout treatment.
    subjects: [MAXIM, JEROEN],
  },
};

export const Trio: Story = {
  name: "Trio / N=3 panel",
  args: {
    ...FullComposition.args,
    title: "Drie generaties, één shirt.",
    subjects: [MAXIM, JEROEN, THOMAS],
  },
};

export const Panel: Story = {
  name: "Panel / N=4 max cap",
  args: {
    ...FullComposition.args,
    title: "Vier generaties over hetzelfde shirt.",
    subjects: [MAXIM, JEROEN, THOMAS, LUC],
  },
};
