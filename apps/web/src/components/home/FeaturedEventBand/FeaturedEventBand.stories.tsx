// apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DateTime } from "luxon";
import { FeaturedEventBand } from "./FeaturedEventBand";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Home/FeaturedEventBand",
  component: FeaturedEventBand,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Standalone band between hero and NewsGrid that surfaces the next " +
          "future event flagged `featuredOnHome` (with a coverImage). Drops " +
          "to null otherwise. Spec: " +
          "docs/design/mockups/phase-4-homepage/featuredeventband-locked.md.",
      },
    },
  },
} satisfies Meta<typeof FeaturedEventBand>;

export default meta;
type Story = StoryObj<typeof meta>;

// Pinned reference time so VR baselines remain deterministic — formatDateTime
// reads `now` only via the `now` prop, but DateTime.fromISO comparisons inside
// the component don't depend on real time when the story sets `now` too.
const REFERENCE_NOW = DateTime.fromISO("2026-04-20T12:00:00", { zone: "utc" });

const baseEvent = {
  title: "Sponsorfeest 2026",
  slug: "sponsorfeest-2026",
  // 19:00 Europe/Brussels (CEST in April) — component pins formatting to BE.
  dateStart: "2026-04-26T17:00:00.000Z",
  coverImage: {
    url: fixtureImage("event-cover", 0),
    alt: "Sponsorfeest 2026 visual",
  },
  externalLink: {
    url: "https://example.com/tickets",
    label: "Bestel je tickets",
  },
  location: "Kantine",
};

export const Default: Story = {
  args: { event: baseEvent, now: REFERENCE_NOW },
};

export const NoExternalLink: Story = {
  args: {
    event: { ...baseEvent, externalLink: null },
    now: REFERENCE_NOW,
  },
};

export const MultiDay: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "Jeugdkampweek",
      slug: "jeugdkampweek-2026",
      // 10:00 → 17:00 Europe/Brussels (CEST in July).
      dateStart: "2026-07-06T08:00:00.000Z",
      dateEnd: "2026-07-10T15:00:00.000Z",
      coverImage: {
        url: fixtureImage("event-cover", 1),
        alt: "Jeugdkampweek 2026",
      },
      location: "Sportzone Elewijt",
    },
    now: REFERENCE_NOW,
  },
};

// N=null returns null. VR captures the deliberately empty viewport so a
// regression that re-renders the band when there's no event is caught.
export const Empty: Story = {
  args: { event: null, now: REFERENCE_NOW },
};
