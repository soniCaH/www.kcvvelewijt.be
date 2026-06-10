import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CtaBand } from "./CtaBand";

const meta = {
  title: "UI/CtaBand",
  component: CtaBand,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The redesign's closing CTA band: a leading `<StripedSeam>` + a full-width `bg-jersey-deep-dark` section (`border-y-2 border-ink`) with an italic-display question + sub-line + a `warm` paper-stamp button. Shared by `<SponsorCtaBand>` and `<JeugdCtaBand>`. Render full-bleed as the last element of a page.",
      },
    },
  },
} satisfies Meta<typeof CtaBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — tweak the copy + href via Controls. */
export const Playground: Story = {
  args: {
    ariaLabel: "Schrijf je in",
    heading: "Interesse in onze jeugd?",
    emphasis: { text: "onze jeugd", tone: "warm" },
    lead: "Nieuwe spelers zijn altijd welkom — van U6 tot U21. Kom gerust eens langs op training.",
    buttonLabel: "Schrijf je in +",
    href: "/hulp",
  },
};

/** Internal route target → renders a `<LinkButton>`. */
export const InternalLink: Story = {
  args: {
    ariaLabel: "Word sponsor",
    heading: "Jouw zaak ook langs de zijlijn?",
    emphasis: { text: "langs de zijlijn", tone: "warm" },
    lead: "Word partner van de plezantste compagnie en steun onze jeugd en eerste ploegen!",
    buttonLabel: "Word sponsor +",
    href: "/club/contact",
  },
};

/** A `mailto:` target → renders a plain styled `<a>` (no new-tab target). */
export const MailtoLink: Story = {
  args: {
    ariaLabel: "Schrijf je in",
    heading: "Interesse in onze jeugd?",
    emphasis: { text: "onze jeugd", tone: "warm" },
    lead: "Nieuwe spelers zijn altijd welkom — van U6 tot U21.",
    buttonLabel: "Schrijf je in +",
    href: "mailto:jeugd@kcvvelewijt.be",
  },
};
