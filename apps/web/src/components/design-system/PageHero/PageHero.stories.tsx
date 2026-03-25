import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHero } from "./PageHero";

const meta = {
  title: "Features/PageHero",
  component: PageHero,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    image: { control: "text", description: "Background image URL" },
    imageAlt: {
      control: "text",
      description: "Alt text for the background image",
    },
    label: { control: "text", description: "Small label above the headline" },
    body: { control: "text", description: "Body text below the headline" },
  },
} satisfies Meta<typeof PageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    image: "/images/hero-club.jpg",
    label: "Onze club",
    headline: (
      <>
        De plezantste
        <br />
        <span className="text-kcvv-green">compagnie</span>
      </>
    ),
    body: "Al meer dan 75 jaar de thuishaven voor voetballiefhebbers in Elewijt. Van de allerkleinsten tot het eerste elftal — bij KCVV is iedereen welkom.",
  },
};

export const WithCta: Story = {
  args: {
    image: "/images/hero-club.jpg",
    label: "Eerste ploeg",
    headline: (
      <>
        KCVV
        <br />
        <span className="text-kcvv-green">Elewijt</span>
      </>
    ),
    body: "3de Provinciale B",
    cta: { label: "Bekijk de A-ploeg", href: "/team/kcvv-elewijt-a" },
  },
};

export const WithoutCta: Story = {
  args: {
    image: "/images/hero-jeugd.jpg",
    label: "Jeugdopleiding",
    headline: (
      <>
        De toekomst
        <br />
        van <span className="text-kcvv-green">Elewijt</span>
      </>
    ),
    body: "Meer dan 200 jonge voetballers. Gediplomeerde trainers. Eén missie: plezier, techniek en teamspirit.",
  },
};
