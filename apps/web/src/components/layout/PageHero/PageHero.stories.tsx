import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Crest } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { PageHero } from "./PageHero";

const meta = {
  title: "UI/PageHero",
  component: PageHero,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story, context) => {
      const dark = context.args.tone === "dark";
      // The dark band is full-bleed — it paints its own field and owns its
      // container, so wrapping it in the page frame would misrepresent it.
      if (dark && context.args.register !== "minimal") {
        return (
          <div className="min-h-screen">
            <Story />
          </div>
        );
      }
      return (
        <div
          className={cn(
            "min-h-screen px-4 py-10 md:px-10",
            dark ? "bg-jersey-deep-dark" : "bg-cream",
          )}
        >
          <div className="mx-auto max-w-5xl">
            <Story />
          </div>
        </div>
      );
    },
  ],
  argTypes: {
    kicker: { control: "text", description: "Mono kicker above the headline" },
    headline: {
      control: "text",
      description: "Headline text (upright Freight)",
    },
    accent: {
      control: "text",
      description:
        "One-word italic accent (substring of headline) — jersey-deep on cream, warm on dark",
    },
    lead: { control: "text", description: "Italic display lead (auto-hides)" },
    image: { control: "text", description: "Hero photograph URL" },
    register: {
      control: "inline-radio",
      options: ["band", "minimal"],
      description: "Front door (band) vs listing / text page (minimal)",
    },
    tone: {
      control: "inline-radio",
      options: ["cream", "dark"],
      description: "Which field the opening sits on",
    },
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
  },
};

/** /club — no image: the headline scales up to own the card, one-word accent. */
export const NoImageTypographic: Story = {
  args: {
    kicker: "Onze club",
    headline: "De plezantste compagnie",
    accent: "compagnie",
    lead: "Er is maar 1 plezante compagnie.",
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

/**
 * band · dark — `/club/bestuur`, `/club/angels`, `/club/jeugdbestuur`,
 * `/jeugd`. A page whose subject is a group of people opens with their
 * photograph; the cream `<TapedFigure>` is built to pop on the dark field.
 */
export const BandDark: Story = {
  args: {
    register: "band",
    tone: "dark",
    kicker: "De club",
    headline: "Bestuur",
    lead: "De mensen achter KCVV Elewijt",
    image: "/images/youth-trainers.jpg",
  },
};

/** band · dark with no photo — the team carries no group portrait yet. */
export const BandDarkNoPhoto: Story = {
  args: {
    register: "band",
    tone: "dark",
    kicker: "De club",
    headline: "Angels",
    lead: "De mensen achter KCVV Elewijt",
  },
};

/**
 * minimal — `/privacy`, `/ploegen`, `/galerij`, `/nieuws` and five more. A
 * listing you scroll or a text page: no band, content starts immediately.
 */
export const Minimal: Story = {
  args: {
    register: "minimal",
    kicker: "KCVV Elewijt",
    headline: "Onze ploegen",
    lead: "Van de eerste ploeg tot de allerkleinsten — 1 plezante compagnie.",
  },
};

/** minimal on a dark field — `/evenementen`, whose whole listing runs dark. */
export const MinimalDark: Story = {
  args: {
    register: "minimal",
    tone: "dark",
    kicker: "KCVV Elewijt · Agenda",
    headline: "Evenementen",
  },
};

/**
 * Mobile viewport — the split collapses to stacked words → photo (m1)
 * (#2803).
 */
export const Mobile: Story = {
  args: {
    kicker: "Kalender",
    headline: "Wedstrijdkalender",
    lead: "Alle wedstrijden en activiteiten, seizoen na seizoen.",
    image: "/images/youth-trainers.jpg",
  },
  globals: {
    viewport: { value: "kcvvMobile" },
  },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};
