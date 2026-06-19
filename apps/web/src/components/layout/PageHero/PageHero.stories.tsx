import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Crest } from "@/components/design-system";
import { PageHero } from "./PageHero";

const meta = {
  title: "UI/PageHero",
  component: PageHero,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-screen px-4 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    kicker: { control: "text", description: "Mono kicker above the headline" },
    headline: {
      control: "text",
      description: "Headline text (upright Freight)",
    },
    accent: {
      control: "text",
      description: "One-word italic jersey-deep accent (substring of headline)",
    },
    lead: { control: "text", description: "Italic display lead (auto-hides)" },
    image: { control: "text", description: "Landscape hero image URL" },
    imageAlt: { control: "text", description: "Alt text for the hero image" },
    size: {
      control: "select",
      options: ["default", "compact"],
      description: "Hero size variant (compact suppresses the image)",
    },
  },
} satisfies Meta<typeof PageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** /kalender — split layout: words left, newsprint photo right (desktop). */
export const WithImage: Story = {
  args: {
    kicker: "Kalender",
    headline: "Wedstrijdkalender",
    lead: "Alle wedstrijden en activiteiten van KCVV Elewijt, seizoen na seizoen.",
    image: "/images/youth-trainers.jpg",
    imageAlt: "KCVV jeugdtraining",
  },
};

/** /club — no image: the headline scales up to own the card, one-word accent. */
export const NoImageTypographic: Story = {
  args: {
    kicker: "Onze club",
    headline: "De plezantste compagnie",
    accent: "compagnie",
    lead: "Er is maar één plezante compagnie.",
  },
};

/** /scheurkalender + loading skeletons — tighter padding, no image. */
export const Compact: Story = {
  args: {
    kicker: "Kalender",
    headline: "Scheurkalender",
    size: "compact",
  },
};

/** /club/[slug] — CMS title with an optional CTA slot. */
export const WithCta: Story = {
  args: {
    kicker: "Club",
    headline: "Het verhaal van de Klakkei",
    accent: "de Klakkei",
    cta: { label: "Lees meer", href: "/club/geschiedenis" },
  },
};

/** Long headline wraps inside the card without breaking the split layout. */
export const LongHeadline: Story = {
  args: {
    kicker: "Onze club",
    headline: "Al meer dan honderd jaar de plezantste compagnie van Elewijt",
    accent: "compagnie",
    lead: "Van de allerkleinsten tot het eerste elftal — bij KCVV is iedereen welkom.",
    image: "/images/youth-trainers.jpg",
    imageAlt: "KCVV jeugdtraining",
  },
};

/** /tegenstander — typographic hero with an opponent crest adornment. */
export const WithAdornment: Story = {
  args: {
    kicker: "Onderlinge geschiedenis",
    headline: "OHR Huldenberg",
    lead: "Alle onderlinge duels tussen KCVV Elewijt en deze tegenstander, per seizoen.",
    adornment: (
      <Crest
        name="OHR Huldenberg"
        size={64}
        className="border-ink bg-cream-soft shadow-paper-sm rounded-full border-2"
      />
    ),
  },
};

/** Mobile viewport — the split collapses to stacked words → photo (m1). */
export const Mobile: Story = {
  args: {
    kicker: "Kalender",
    headline: "Wedstrijdkalender",
    lead: "Alle wedstrijden en activiteiten, seizoen na seizoen.",
    image: "/images/youth-trainers.jpg",
    imageAlt: "KCVV jeugdtraining",
  },
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};
