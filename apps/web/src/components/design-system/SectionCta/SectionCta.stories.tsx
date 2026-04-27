import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionCta } from "./SectionCta";

const meta = {
  title: "UI/SectionCta",
  component: SectionCta,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    heading: {
      control: "text",
      description: "Section heading",
    },
    body: {
      control: "text",
      description: "Section body text",
    },
    buttonLabel: {
      control: "text",
      description: "CTA button label",
    },
    buttonHref: {
      control: "text",
      description: "CTA button link destination",
    },
  },
} satisfies Meta<typeof SectionCta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: "Aansluiten bij KCVV Elewijt?",
    body: "Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op Sportpark Elewijt.",
    buttonLabel: "Meer info",
    buttonHref: "/club/aansluiten",
  },
};

export const Contact: Story = {
  args: {
    heading: "Vragen over de club?",
    body: "Neem contact op — we helpen je graag verder.",
    buttonLabel: "Contacteer ons",
    buttonHref: "/club/contact",
  },
};

export const Youth: Story = {
  args: {
    heading: "Interesse in onze jeugd?",
    body: "Nieuwe spelers zijn altijd welkom — van U6 tot U21.",
    buttonLabel: "Word ook lid",
    buttonHref: "/club/inschrijven",
  },
};

export const Playground: Story = {
  args: {
    heading: "Aansluiten bij KCVV Elewijt?",
    body: "Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op Sportpark Elewijt.",
    buttonLabel: "Meer info",
    buttonHref: "/club/aansluiten",
  },
};

/**
 * Dark variant — white heading and body. Use this on `kcvv-black` or
 * `kcvv-green-dark` section backgrounds. The default light variant becomes
 * unreadable (dark text on dark background) in those contexts.
 */
export const Dark: Story = {
  args: {
    heading: "Word lid van KCVV Elewijt",
    body: "Sluit je aan bij onze club en word deel van de KCVV-familie. Spelers, vrijwilligers en supporters welkom!",
    buttonLabel: "Meer info",
    buttonHref: "/club/aansluiten",
    variant: "dark",
  },
  decorators: [
    (Story) => (
      <div className="bg-kcvv-green-dark py-16">
        <Story />
      </div>
    ),
  ],
};
