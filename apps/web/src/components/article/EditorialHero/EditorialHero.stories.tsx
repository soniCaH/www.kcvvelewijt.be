import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialHero, type EditorialHeroProps } from "./EditorialHero";

const meta = {
  title: "Article/EditorialHero",
  component: EditorialHero,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft px-12 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialHero>;

export default meta;
// Storybook's inferred args collapses discriminated unions to `never`,
// so override `args` with the full union — Omit drops the inferred
// shape, then we re-introduce it with the discriminated type.
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args: EditorialHeroProps;
};

const SAMPLE_KICKER = [
  { label: "ANNOUNCEMENT" },
  { label: "8 MIN" },
  { label: "06 MEI 2026" },
];

const SAMPLE_LEAD =
  "Een rustige editorial lead die de toon zet voor het artikel zonder alles te verklappen.";

const COVER = {
  url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&fm=webp&fit=max",
  alt: "Spelers vieren een doelpunt",
};

export const Playground: Story = {
  args: {
    variant: "announcement",
    title: "De zomer van 2026 begint nu.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

export const AnnouncementVariant: Story = {
  args: {
    variant: "announcement",
    title: "De zomer van 2026 begint nu.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

export const TransferVariant: Story = {
  args: {
    variant: "transfer",
    title: "Bram Vermeulen tekent voor drie seizoenen.",
    lead: "De middenvelder van A-Ploeg verlengt tot 2029. Stabiliteit op de zes.",
    kicker: [
      { label: "TRANSFER" },
      { label: "INCOMING" },
      { label: "06 MEI 2026" },
    ],
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

export const EventVariant: Story = {
  args: {
    variant: "event",
    title: "Familiedag 2026 — zaterdag 14 juni.",
    lead: "Spelletjes voor de jeugd, BBQ vanaf 16u, en een match A-Ploeg vs. oud-gedienden.",
    kicker: [{ label: "EVENT" }, { label: "06 MEI 2026" }],
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

export const InterviewVariant: Story = {
  args: {
    variant: "interview",
    title: "Een gesprek met Maxim Breugelmans.",
    lead: "Dertiende seizoen in groen-wit. Over routine, geduld, en de tweede paal.",
    kicker: [{ label: "INTERVIEW" }, { label: "A-PLOEG" }, { label: "8 MIN" }],
    author: "Lien De Smet",
    coverImage: COVER,
  },
};

export const NoCover: Story = {
  args: {
    variant: "announcement",
    title: "Een korte mededeling zonder visuele begeleiding.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
  },
};

export const NoLead: Story = {
  args: {
    variant: "announcement",
    title: "Headline-only hero met enkel kicker en byline.",
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

export const FallbackByline: Story = {
  args: {
    variant: "announcement",
    title: "Bericht zonder auteur — byline valt terug op redactie.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    coverImage: COVER,
  },
};
