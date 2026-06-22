import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UltrasHero } from "./UltrasHero";
import { UltrasSection } from "./UltrasSection";
import { RaffleCallout } from "./RaffleCallout";
import { PullQuote } from "@/components/design-system/PullQuote";

/**
 * Storybook doc story for the reskinned `/club/ultras` page (Phase 7, design
 * contracts 7u1 + 7u2). Page-level visual coverage moves to the Playwright e2e
 * suite (docs/prd/page-level-testing-rework.md); the hero + sections carry
 * their own VR via their component stories.
 */
const meta = {
  title: "Pages/Ultras",
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PosterHero: Story = {
  render: () => (
    <UltrasHero joinHref="https://www.facebook.com/KCVV.ULTRAS.55/" />
  ),
};

export const BodySection: Story = {
  render: () => (
    <div className="bg-cream py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        <UltrasSection kicker="Onze missie" heading="Wat doen we" accent=".">
          <PullQuote attribution={{ name: "KCVV Ultra's 55" }}>
            Positief aanmoedigen van de eigen ploeg; vocaal, met trommels, met
            sfeermateriaal, met bussen enz...
          </PullQuote>
          <p>
            Het doel van de KCVV Ultras is om onze eigen ploeg positief aan te
            moedigen! Met sfeermateriaal en vocale steun proberen we zo vaak
            mogelijk aanwezig te zijn op wedstrijden.
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
