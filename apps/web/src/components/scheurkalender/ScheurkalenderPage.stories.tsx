/**
 * ScheurkalenderPage Stories
 *
 * Private (noindex, unlinked) full-season A + B league fixture list — the data
 * source the club screenshots into the InDesign season poster. Poster layout:
 * two columns split on the calendar year, Freight Big month headings with an
 * italic jersey-deep year, and a fixed weekday · day · kickoff date tab.
 *
 * The poster block is 340 × 567 mm; screenshot at roughly 860 px browser width,
 * which prints the club names at ~5.5 mm.
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
// Mock data
// ---------------------------------------------------------------------------

/**
 * The complete 26/27 league season — all 56 A + B fixtures, verbatim from the
 * BFF. Kept as a compact tuple table rather than 56 object literals so the data
 * stays readable; `seasonFixtures` below expands it to `ScheurkalenderMatch[]`.
 * Opponent names are stored as the BFF now emits them — casing-normalised at the
 * transform sites ("KSC Blankenberge", not PSD's raw "Ksc Blankenberge"), since
 * #2336 moved that job out of this component.
 *
 * Tuple order: [date, kickoff, squad, kcvvIsHome, opponent]
 */
type FixtureTuple = [string, string, "A" | "B", boolean, string];

const SEASON_26_27: FixtureTuple[] = [
  ["2026-08-29", "20:00", "B", true, "Fenixx Beigem Humbeek"],
  ["2026-08-30", "15:00", "A", true, "KSC Blankenberge"],
  ["2026-09-05", "19:30", "A", false, "KSV Rumbeke"],
  ["2026-09-06", "17:00", "B", false, "KCS Machelen"],
  ["2026-09-12", "20:00", "B", true, "Perk Steenokkerzeel Verenigd 1820"],
  ["2026-09-13", "15:00", "A", true, "KVV St-Denijs Sport"],
  ["2026-09-19", "20:00", "B", false, "Peutie FC"],
  ["2026-09-20", "15:00", "A", false, "KFC Wambeek Ternat"],
  ["2026-09-26", "20:00", "B", true, "K SP Amicii Tange"],
  ["2026-09-27", "15:00", "A", true, "KVE Drongen"],
  ["2026-10-04", "15:00", "A", false, "KVK Ieper"],
  ["2026-10-10", "20:00", "B", true, "FC Inkad Diegem"],
  ["2026-10-11", "15:00", "A", true, "K Berchem Sport 2004"],
  ["2026-10-18", "15:00", "A", false, "Erpe-Mere United"],
  ["2026-10-24", "20:00", "B", true, "KFC Eppegem"],
  ["2026-10-25", "14:30", "A", true, "Football Club Gullegem"],
  ["2026-10-31", "18:00", "B", false, "FC Zemst Sportief"],
  ["2026-11-01", "14:30", "A", false, "Eendr Elene-Grotenberge"],
  ["2026-11-08", "14:30", "A", false, "Avanti Stekene"],
  ["2026-11-08", "15:00", "B", false, "AC Bormstraat Kapelle"],
  ["2026-11-14", "20:00", "B", true, "KV Woluwe-Zaventem"],
  ["2026-11-15", "14:30", "A", true, "KWS Club Lauwe"],
  ["2026-11-21", "20:00", "A", false, "SC City Pirates Antwerpen"],
  ["2026-11-22", "14:30", "B", false, "Infinity FC Vilvoorde"],
  ["2026-11-28", "20:00", "B", true, "SK Laar"],
  ["2026-11-29", "14:30", "A", true, "Olsa Brakel"],
  ["2026-12-05", "17:30", "B", false, "VV Groot Kapelle"],
  ["2026-12-05", "18:00", "A", false, "Zwevegem Sport"],
  ["2026-12-13", "15:00", "A", false, "KSC Blankenberge"],
  ["2026-12-13", "17:00", "B", false, "Fenixx Beigem Humbeek"],
  ["2027-01-09", "20:00", "B", true, "KCS Machelen"],
  ["2027-01-10", "14:30", "A", true, "KSV Rumbeke"],
  ["2027-01-16", "19:30", "B", false, "K SP Amicii Tange"],
  ["2027-01-17", "15:00", "A", false, "KVE Drongen"],
  ["2027-01-23", "20:00", "B", true, "Peutie FC"],
  ["2027-01-24", "14:30", "A", true, "KFC Wambeek Ternat"],
  ["2027-01-31", "14:30", "A", false, "KWS Club Lauwe"],
  ["2027-01-31", "14:30", "B", false, "KV Woluwe-Zaventem"],
  ["2027-02-14", "15:00", "A", true, "Erpe-Mere United"],
  ["2027-02-20", "19:30", "B", false, "Perk Steenokkerzeel Verenigd 1820"],
  ["2027-02-21", "15:00", "A", false, "KVV St-Denijs Sport"],
  ["2027-02-28", "15:00", "A", true, "KVK Ieper"],
  ["2027-03-06", "18:00", "B", false, "FC Inkad Diegem"],
  ["2027-03-06", "20:00", "A", false, "K Berchem Sport 2004"],
  ["2027-03-13", "20:00", "B", true, "VV Groot Kapelle"],
  ["2027-03-14", "15:00", "A", true, "Zwevegem Sport"],
  ["2027-03-21", "15:00", "A", false, "Olsa Brakel"],
  ["2027-03-21", "15:00", "B", false, "SK Laar"],
  ["2027-04-03", "20:00", "B", true, "Infinity FC Vilvoorde"],
  ["2027-04-04", "15:00", "A", true, "SC City Pirates Antwerpen"],
  ["2027-04-10", "20:00", "B", true, "AC Bormstraat Kapelle"],
  ["2027-04-11", "15:00", "A", true, "Avanti Stekene"],
  ["2027-04-17", "19:30", "B", false, "KFC Eppegem"],
  ["2027-04-18", "15:00", "A", false, "Football Club Gullegem"],
  ["2027-04-25", "15:00", "A", true, "Eendr Elene-Grotenberge"],
  ["2027-04-25", "15:00", "B", true, "FC Zemst Sportief"],
];

const seasonFixtures: ScheurkalenderMatch[] = SEASON_26_27.map(
  ([date, time, kcvvLabel, kcvvIsHome, opponent], index) => ({
    id: index + 1,
    date,
    time,
    opponent,
    kcvvLabel,
    kcvvIsHome,
  }),
);

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
          "Private InDesign-poster data source for /scheurkalender. Full-season A + B league fixtures split across two columns on the calendar year, with Freight Big month headings and a fixed weekday · day · kickoff date tab. The screen toolbar (print button) is hidden on print; the white sheet composites cleanly into the poster screenshot.",
      },
    },
  },
  args: { season: "’26/’27" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScheurkalenderPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Full season — both calendar years, so the two-column split is visible. */
export const Default: Story = {
  args: { matches: seasonFixtures },
};

/**
 * Poster width — the ~860 px render the owner used to screenshot, which prints
 * the club names at roughly 5.5 mm inside the 340 × 567 mm block but wraps the
 * longest two. The PDF export lays out wider than this so none of them wrap
 * (`poster-geometry.ts`); this story is the narrow end of the range.
 */
export const PosterWidth: Story = {
  args: { matches: seasonFixtures },
  parameters: { viewport: { defaultViewport: "kcvvTablet" } },
};

/** First half of the season only — falls back to a single full-width column. */
export const SingleYear: Story = {
  args: { matches: seasonFixtures.filter((m) => m.date.startsWith("2026")) },
};

/** One weekend, both squads. */
export const SingleWeekend: Story = {
  args: { matches: seasonFixtures.slice(0, 2) },
};

/** No published league fixtures — empty state. */
export const NoMatches: Story = {
  args: { matches: [] },
};

/** Mobile viewport. The sheet keeps its two columns — it is a poster source, not a responsive page. */
export const MobileViewport: Story = {
  args: { matches: seasonFixtures },
  globals: { viewport: { value: "kcvvMobile" } },
};

export const RouteSkeleton: StoryObj = {
  render: () => <ScheurkalenderLoading />,
  parameters: { layout: "fullscreen" },
};
