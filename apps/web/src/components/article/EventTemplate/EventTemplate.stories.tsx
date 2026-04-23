import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { EventTemplate } from "./EventTemplate";

const paragraph = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

const heading = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "h2",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

const note = (key: string, text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  } as unknown as PortableTextBlock,
];

const lentetornooi = {
  _type: "eventFact",
  _key: "evt-feature",
  title: "Lentetornooi U13",
  date: "2026-04-27",
  startTime: "10:00",
  endTime: "17:00",
  location: "Sportpark Elewijt",
  address: "Driesstraat 14, Elewijt",
  ageGroup: "U13",
  ticketUrl: "https://kcvvelewijt.be/inschrijven",
  note: note(
    "evt-note",
    "Open voor spelers geboren in 2013 en 2014. Wedstrijden en finales, met afsluiting op het terras.",
  ),
} as unknown as PortableTextBlock;

const afterparty = {
  _type: "eventFact",
  _key: "evt-after",
  title: "Afterparty",
  date: "2026-04-27",
  startTime: "20:00",
  location: "Kantine KCVV",
  competitionTag: "Clubfeest",
} as unknown as PortableTextBlock;

const training = {
  _type: "eventFact",
  _key: "evt-training",
  title: "Seizoensstart training",
  date: "2026-07-27",
  startTime: "18:30",
  endTime: "20:00",
  location: "Sportpark Elewijt",
  ageGroup: "Senioren",
} as unknown as PortableTextBlock;

const meta = {
  title: "Pages/Article/Event",
  component: EventTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 6 (#1332) — full event article composition. Typographic hero (kicker + title) + §7.6 metadata bar + full-bleed `EventStrip` (date block + metadata + note + CTA) + body prose + a stack of `EventFactOverview` rows on the dark band.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullComposition: Story = {
  args: {
    title: "Lentetornooi U13 — zaterdag in Elewijt",
    publishedDate: "19 April 2026",
    readingTime: "2 min lezen",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/lentetornooi-u13",
      title: "Lentetornooi U13",
    },
    body: [
      lentetornooi,
      paragraph(
        "p1",
        "Zaterdag 27 april verwelkomen we acht ploegen voor het traditionele lentetornooi. Vijf velden, vier poules, één grote dag voor de U13-kern.",
      ),
      paragraph(
        "p2",
        "De organisatie voorziet drinken en versnaperingen. Supporters zijn welkom de hele dag door — ook voor de finale om 16u30.",
      ),
      heading("h1", "Andere evenementen"),
      afterparty,
      training,
      paragraph(
        "p3",
        "Meer info bij de jeugdvoorzitter via info@kcvvelewijt.be.",
      ),
    ],
  },
};

export const WithoutEventFact: Story = {
  args: {
    title: "Evenementenupdate volgt",
    publishedDate: "19 April 2026",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/evenementenupdate",
    },
    body: [
      paragraph(
        "p1",
        "Hieronder zonder een gestructureerd eventFact-blok: de hero gebruikt de articletitel, er is geen strip en het body blijft normale prose.",
      ),
    ],
  },
};
