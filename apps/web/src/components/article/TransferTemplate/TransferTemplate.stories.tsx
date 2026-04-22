import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { TransferTemplate } from "./TransferTemplate";

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

const incomingFeature = {
  _type: "transferFact",
  _key: "tf-incoming-feature",
  direction: "incoming",
  playerName: "Maxim Breugelmans",
  position: "Middenvelder",
  age: 27,
  otherClubName: "Standard Luik",
  otherClubLogoUrl:
    "https://upload.wikimedia.org/wikipedia/en/2/25/Standard_Li%C3%A8ge_logo.svg",
  otherClubContext: "Jupiler Pro League · U23",
  kcvvContext: "Derde Amateur · A-ploeg · #8",
  note: "Blij om thuis te zijn. Elewijt voelt onmiddellijk vertrouwd.",
  noteAttribution: "Maxim Breugelmans",
} as unknown as PortableTextBlock;

const extensionOverview = {
  _type: "transferFact",
  _key: "tf-extension",
  direction: "extension",
  playerName: "Koen Dewaele",
  position: "Keeper",
  age: 29,
  until: "2028",
} as unknown as PortableTextBlock;

const outgoingOverview = {
  _type: "transferFact",
  _key: "tf-outgoing",
  direction: "outgoing",
  playerName: "Bart Peeters",
  position: "Verdediger",
  age: 31,
  otherClubName: "KV Mechelen",
  otherClubLogoUrl:
    "https://upload.wikimedia.org/wikipedia/en/6/65/KV_Mechelen_logo.svg",
} as unknown as PortableTextBlock;

const meta = {
  title: "Pages/Article/Transfer",
  component: TransferTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 5 (#1331) — full transfer article composition. Hero absorbs the first transferFact (kicker + h1 + meta + pull-quote + cover portrait). The §7.6 metadata bar is followed by a horizontal `TransferStrip` (van → direction → naar) that carries context subtitles. Subsequent transferFacts render inline beneath an editor-authored `Ander transfernieuws` H2.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TransferTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullComposition: Story = {
  args: {
    title: "Maxim Breugelmans versterkt Elewijt",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=1000&q=80&fit=crop",
    publishedDate: "19 April 2026",
    readingTime: "3 min lezen",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/max-breugelmans-transfer",
      title: "Maxim Breugelmans versterkt Elewijt",
    },
    body: [
      incomingFeature,
      paragraph(
        "p1",
        "Met de komst van Maxim Breugelmans legt de sportieve cel een duidelijke lijn in de voorbereiding. Breugelmans brengt leiderschap in de as en ervaring op het hoogste amateurniveau.",
      ),
      paragraph(
        "p2",
        "De afgelopen seizoenen speelde hij 130 matchen bij Standard Luik en toonde hij zich een betrouwbare organisator in het middenveld.",
      ),
      heading("h1", "Ander transfernieuws"),
      extensionOverview,
      outgoingOverview,
      paragraph(
        "p3",
        "Daarnaast bedankt de club Bart Peeters voor vier seizoenen trouwe inzet en wenst hem veel succes in Mechelen. Keeper Koen Dewaele blijft de nummer 1 tot en met 2028.",
      ),
    ],
  },
};

export const WithoutTransferFact: Story = {
  args: {
    title: "Transferupdate volgt",
    coverImageUrl: null,
    publishedDate: "19 April 2026",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/transferupdate",
    },
    body: [
      paragraph(
        "p1",
        "Hieronder zonder een gestructureerd transferFact-blok: de hero gebruikt de articletitel als h1, er is geen strip en de body blijft normale prose.",
      ),
    ],
  },
};
