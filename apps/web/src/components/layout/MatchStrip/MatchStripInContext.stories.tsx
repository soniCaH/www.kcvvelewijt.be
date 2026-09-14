import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MatchStripView } from "./MatchStripView";
import { KCVV_CLUB_ID } from "@/lib/constants";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import { teamDisplayName } from "@/lib/utils/team-display-name";
import type { ScheduleMatch } from "@/components/match/types";
import type { MatchStripData } from "@/lib/server/match-data";

/**
 * Composition stories that show `<MatchStrip>` in its real context — sticky
 * `<SiteHeader>` above, the strip directly below, then a placeholder page
 * body. Mirrors how landing pages mount `<MatchStripSlot />`.
 *
 * The async `<MatchStrip>` server component cannot run in Storybook (it
 * fetches via the BFF), so these stories compose `<MatchStripView>` directly
 * with synthetic data. The classes and JSX in `MatchStripView` are the same
 * code path the deployed page renders — no inline reimplementation.
 */

const makeTeam = (over: Partial<TeamNavVM>): TeamNavVM => ({
  id: over.slug ?? "team",
  name: over.name ?? "Team",
  displayName:
    over.displayName ??
    teamDisplayName({ slug: over.slug ?? "team", name: over.name ?? "Team" }),
  slug: over.slug ?? "team",
  age: over.age ?? null,
  psdId: null,
  division: null,
  divisionFull: null,
  teamImageUrl: null,
});

const seniorTeams: TeamNavVM[] = [
  makeTeam({ slug: "kcvv-elewijt-a", name: "KCVV Elewijt A" }),
  makeTeam({ slug: "kcvv-elewijt-b", name: "KCVV Elewijt B" }),
];

const homeResult: ScheduleMatch = {
  kind: "match",
  id: 12345,
  date: new Date("2026-08-03T15:00:00Z"),
  competition: "Tweede Provinciale A",
  status: "finished",
  homeTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  awayTeam: {
    id: 9999,
    name: "RC Mechelen",
    logo: "/images/logos/kcvv-logo.png",
  },
  homeScore: 3,
  awayScore: 1,
  isHome: true,
};

const awayFixture: ScheduleMatch = {
  kind: "match",
  id: 12346,
  date: new Date("2026-08-08T18:00:00Z"),
  time: "18:00",
  competition: "Beker van Vlaanderen",
  status: "scheduled",
  homeTeam: { id: 8888, name: "VK De Volharding" },
  awayTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  isHome: false,
};

function PageShell({
  data,
  matchDay = false,
}: {
  data: MatchStripData | null;
  matchDay?: boolean;
}) {
  return (
    <div className="bg-cream-soft min-h-screen">
      <SiteHeader seniorTeams={seniorTeams} />
      {data ? <MatchStripView data={data} matchDay={matchDay} /> : null}
      <main className="mx-auto max-w-[1200px] px-4 py-12 lg:px-8">
        <div className="border-paper-edge bg-cream rounded-none border p-8">
          <p className="font-display text-ink/60 text-[18px] italic">
            Page body placeholder — landing-page sections render here.
          </p>
        </div>
      </main>
    </div>
  );
}

const meta = {
  title: "Features/Matches/MatchStripInContext",
  component: PageShell,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResultAndFixture: Story = {
  args: { data: { result: homeResult, fixture: awayFixture } },
};

export const FixtureOnly: Story = {
  args: { data: { result: null, fixture: awayFixture } },
};

export const NoMatchData: Story = {
  args: { data: null },
};

/**
 * #2616 — the dark jersey ground in its real context: sticky `<SiteHeader>`
 * above, the cream page body below. Checks the ground swap doesn't clash with
 * the chrome immediately around it (no cream sliver, no double border).
 */
const todaysFixture: ScheduleMatch = {
  kind: "match",
  id: 12350,
  date: new Date("2026-08-15T15:00:00Z"),
  time: "15:00",
  competition: "Tweede Provinciale A",
  status: "scheduled",
  homeTeam: { id: KCVV_CLUB_ID, name: "KCVV Elewijt" },
  awayTeam: { id: 7654, name: "KFC Hofstade" },
  isHome: true,
};

export const MatchDay: Story = {
  args: {
    data: { result: homeResult, fixture: todaysFixture },
    matchDay: true,
  },
};
