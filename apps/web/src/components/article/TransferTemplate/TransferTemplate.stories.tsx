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
  playerPhotoUrl:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
  position: "Middenvelder",
  age: 27,
  otherClubName: "Standard Luik",
  otherClubLogoUrl:
    "https://upload.wikimedia.org/wikipedia/en/2/25/Standard_Li%C3%A8ge_logo.svg",
  note: "Blij om thuis te zijn. Elewijt voelt onmiddellijk vertrouwd.",
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
          "Phase 5 (#1331) — full transfer article composition. `TransferHero` (no image) + §7.6 metadata bar + body with one feature transferFact block and two overview cards. Demonstrates the three directions (incoming feature, extension overview, outgoing overview) in the same page.",
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
      heading("h1", "Verdere transferbeweging"),
      paragraph(
        "p3",
        "Daarnaast verlengt de club het contract van doelman Koen Dewaele tot 2028, en neemt Bart Peeters afscheid na vier seizoenen.",
      ),
      extensionOverview,
      outgoingOverview,
    ],
  },
};

export const WithoutTransferFact: Story = {
  args: {
    title: "Transferupdate volgt",
    publishedDate: "19 April 2026",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/transferupdate",
    },
    body: [
      paragraph(
        "p1",
        "Hieronder zonder een gestructureerd transferFact-blok: de hero gebruikt de articletitel als h1 en het body blijft normale prose.",
      ),
    ],
  },
};
