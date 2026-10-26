import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UltrasHero } from "./UltrasHero";
import { UltrasSection } from "./UltrasSection";
import { RaffleCallout } from "./RaffleCallout";
import { PullQuote } from "@/components/design-system/PullQuote";

/**
 * Storybook doc story for the reskinned `/club/ultras` page (Phase 7, design
 * contract 7u1). The opening is `<UltrasHero>`. Page-level
 * visual coverage moves to the Playwright e2e suite
 * (docs/prd/archive/2026/page-level-testing-rework.md).
 */
const meta = {
  title: "Pages/Ultras",
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hero: Story = {
  render: () => <UltrasHero />,
};

export const BodySection: Story = {
  render: () => (
    <div className="bg-cream py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        <UltrasSection kicker="Onze missie" heading="Wat doen we" accent=".">
          <PullQuote attribution={{ name: "KCVV Ultra's 55" }}>
            Negentig minuten zingen. En op de bus naar huis nog wat langer.
          </PullQuote>
          <p>
            De Ultra&apos;s zijn een sfeergroep. We staan er om onze eigen ploeg
            te steunen, met trommels, vlaggen, spandoeken en vooral veel stem.
          </p>
        </UltrasSection>
      </div>
    </div>
  ),
};

export const Callout: Story = {
  render: () => (
    <div className="bg-cream py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        <RaffleCallout />
      </div>
    </div>
  ),
};
