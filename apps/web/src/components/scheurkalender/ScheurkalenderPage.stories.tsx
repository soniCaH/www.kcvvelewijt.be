/**
 * ScheurkalenderPage Stories
 *
 * Private (noindex, unlinked) full-season A + B league fixture table — the data
 * source the club screenshots into the A2 InDesign season poster. Treatment A:
 * a print-clean white sheet (Montserrat), date·time·home·away with the KCVV side
 * bolded and the squad label inline, grouped per weekend. See #2137.
 *
 * Pages/* stories are design references and are not VR-tested (page composition
 * is the e2e suite's concern).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ScheurkalenderPage,
  type ScheurkalenderMatch,
} from "./ScheurkalenderPage";
import ScheurkalenderLoading from "@/app/(main)/scheurkalender/loading";

// ---------------------------------------------------------------------------
// Mock data — real fixtures (subset of the locked mock), A + B league across
// several weekends, mixing home/away for each squad.
// ---------------------------------------------------------------------------

const seasonFixtures: ScheurkalenderMatch[] = [
  {
    id: 1,
    date: "2025-08-30",
    time: "20:00",
    opponent: "Fc Zemst Sportief",
    kcvvLabel: "B",
    kcvvIsHome: true,
  },
  {
    id: 2,
    date: "2025-08-31",
    time: "15:00",
    opponent: "Sc City Pirates Antwerpen",
    kcvvLabel: "A",
    kcvvIsHome: true,
  },
  {
    id: 3,
    date: "2025-09-07",
    time: "20:00",
    opponent: "As Verbroedering Geel",
    kcvvLabel: "A",
    kcvvIsHome: false,
  },
  {
    id: 4,
    date: "2025-09-13",
    time: "14:30",
    opponent: "Peutie Fc",
    kcvvLabel: "B",
    kcvvIsHome: true,
  },
  {
    id: 5,
    date: "2025-09-14",
    time: "15:00",
    opponent: "Herleving Red Star Haasdonk",
    kcvvLabel: "A",
    kcvvIsHome: true,
  },
  {
    id: 6,
    date: "2025-09-20",
    time: "19:30",
    opponent: "Ksc Keerbergen",
    kcvvLabel: "B",
    kcvvIsHome: false,
  },
  {
    id: 7,
    date: "2025-09-21",
    time: "15:00",
    opponent: "Fc Turkse Rangers Waterschei",
    kcvvLabel: "A",
    kcvvIsHome: false,
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Pages/ScheurkalenderPage",
  component: ScheurkalenderPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Private InDesign-poster data source for /scheurkalender. Full-season A + B league fixtures grouped per weekend; KCVV side bolded with the squad label inline. The screen toolbar (print button) is hidden on print; the white sheet composites cleanly into the poster screenshot.",
      },
    },
  },
  args: { season: "25/26" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScheurkalenderPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Full-season A + B league table across several weekends. */
export const Default: Story = {
  args: { matches: seasonFixtures },
};

/** A single weekend (two fixtures). */
export const SingleWeekend: Story = {
  args: { matches: seasonFixtures.slice(0, 2) },
};

/** No published league fixtures — empty state. */
export const NoMatches: Story = {
  args: { matches: [] },
};

/** Mobile viewport. */
export const MobileViewport: Story = {
  args: { matches: seasonFixtures },
  globals: { viewport: { value: "kcvvMobile" } },
};

export const RouteSkeleton: StoryObj = {
  render: () => <ScheurkalenderLoading />,
  parameters: { layout: "fullscreen" },
};
