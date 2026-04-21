import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { InterviewTemplate } from "./InterviewTemplate";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const block = (text: string, key: string): PortableTextBlock => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
});

const answer = (text: string, key: string) => [block(text, key)];

const playerSubject: SubjectValue = {
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
    subject: playerSubject,
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
    subject: null,
  },
};
