/**
 * Club Organigram Redesign — Visual Prototype
 *
 * Brings /club/organigram into the site design language by wrapping the
 * actual UnifiedOrganigramClient in a SectionStack with diagonal transitions.
 *
 * Key behaviour:
 * - The chart section is wider than the regular max-w-inner-lg containers
 *   (uses max-w-outer / 90rem) so the chart has room to breathe
 * - The chart wrapper uses `touch-action: pan-y` so users can scroll
 *   vertically past the chart on mobile/touch without getting trapped
 *   inside the chart's pan/zoom canvas
 * - A small "scroll-past" hint appears below the chart
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { UnifiedOrganigramClient } from "@/components/organigram/UnifiedOrganigramClient";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";

const meta = {
  title: "Pages/Club Organigram Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Redesigned: Story = {
  render: () => {
    const sections: SectionConfig[] = [
      {
        key: "hero",
        bg: "kcvv-black",
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        content: (
          <PageHero
            size="compact"
            gradient="dark"
            label="De club"
            headline="Clubstructuur"
            body="Ontdek de organisatie achter KCVV Elewijt."
          />
        ),
        transition: { type: "diagonal", direction: "right", overlap: "full" },
      },
      {
        key: "chart",
        bg: "gray-100",
        // Match production /club/organigram exactly: max-w-7xl mx-auto.
        // The responsive parts of UnifiedOrganigramClient (search, filter
        // chips, members count) reflow naturally to the viewport. The
        // chart canvas itself manages its own pan/zoom internally — we
        // don't need to wrap it in extra overflow containers.
        content: (
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <UnifiedOrganigramClient
              members={staffMembersFixture}
              responsibilityPaths={[]}
            />
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        key: "cta",
        bg: "kcvv-green-dark",
        paddingTop: "pt-16",
        paddingBottom: "pb-16",
        content: (
          <SectionCta
            variant="dark"
            heading="Wie zoek je?"
            body="Vind de juiste contactpersoon voor jouw vraag."
            buttonLabel="Naar de helppagina"
            buttonHref="/hulp"
          />
        ),
      },
    ];

    return <SectionStack sections={sections} />;
  },
};
