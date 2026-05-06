import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  InteriorPageHero,
  type InteriorPageHeroProps,
} from "./InteriorPageHero";

// `headline` accepts arbitrary `ReactNode` (e.g. `<br />` + accented spans).
// Storybook controls require serialisable args, so we override the `headline`
// arg with a simple token-based string and convert to JSX in `renderHeadline`:
//   - `\n` → `<br />`
//   - `**text**` → `<span className="text-kcvv-green">text</span>`
type StoryArgs = Omit<InteriorPageHeroProps, "headline"> & {
  headline: string;
};

function renderHeadline(headline: string) {
  const lines = headline.split("\n");
  return (
    <>
      {lines.map((line, lineIdx) => (
        <Fragment key={lineIdx}>
          {lineIdx > 0 ? <br /> : null}
          {line.split(/(\*\*[^*]+\*\*)/).map((part, partIdx) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <span key={partIdx} className="text-kcvv-green">
                {part.slice(2, -2)}
              </span>
            ) : (
              <Fragment key={partIdx}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

const renderInteriorPageHero = (args: StoryArgs) => (
  <InteriorPageHero {...args} headline={renderHeadline(args.headline)} />
);

const meta = {
  title: "Layout/InteriorPageHero",
  component: InteriorPageHero,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    image: { control: "text", description: "Background image URL" },
    imageAlt: {
      control: "text",
      description: "Alt text for the background image",
    },
    label: { control: "text", description: "Small label above the headline" },
    headline: {
      control: "text",
      description:
        "Headline. Use \\n for line breaks and **text** for jersey-green accent.",
    },
    body: { control: "text", description: "Body text below the headline" },
    size: {
      control: "select",
      options: ["default", "compact"],
      description: "Hero height variant",
    },
    gradient: {
      control: "select",
      options: ["dark", "green", "neutral"],
      description: "Gradient preset (used when no image)",
    },
  },
  render: renderInteriorPageHero,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    image: "/images/hero-club.jpg",
    label: "Onze club",
    headline: "De plezantste\n**compagnie**",
    body: "Al meer dan 75 jaar de thuishaven voor voetballiefhebbers in Elewijt. Van de allerkleinsten tot het eerste elftal — bij KCVV is iedereen welkom.",
  },
};

export const WithCta: Story = {
  args: {
    image: "/images/hero-club.jpg",
    label: "Eerste ploeg",
    headline: "KCVV\n**Elewijt**",
    body: "3de Provinciale B",
    cta: { label: "Bekijk de A-ploeg", href: "/ploegen/kcvv-elewijt-a" },
  },
};

export const WithoutCta: Story = {
  args: {
    image: "/images/hero-jeugd.jpg",
    label: "Jeugdopleiding",
    headline: "De toekomst\nvan **Elewijt**",
    body: "Meer dan 200 jonge voetballers. Gediplomeerde trainers. Eén missie: plezier, techniek en teamspirit.",
  },
};

export const Compact: Story = {
  args: {
    image: "/images/youth-trainers.jpg",
    imageAlt: "KCVV jeugdtraining",
    label: "Kalender",
    headline: "Wedstrijdkalender",
    body: "Bekijk alle wedstrijden en activiteiten van KCVV Elewijt.",
    size: "compact",
  },
};

export const GradientDark: Story = {
  args: {
    label: "Club",
    headline: "Hulp nodig?",
    body: "Vind snel de juiste persoon bij KCVV Elewijt.",
    size: "compact",
    gradient: "dark",
  },
};

export const GradientGreen: Story = {
  args: {
    label: "Kalender",
    headline: "Wedstrijdkalender",
    body: "Bekijk alle wedstrijden en activiteiten van KCVV Elewijt.",
    size: "compact",
    gradient: "green",
  },
};

export const GradientNeutral: Story = {
  args: {
    label: "Scheurkalender",
    headline: "Scheurkalender",
    body: "Alle komende wedstrijden op een rij.",
    size: "compact",
    gradient: "neutral",
  },
};
