import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MatchStripView } from "./MatchStripView";
import { KCVV_FIRST_TEAM_CLUB_ID } from "@/lib/constants";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import type { UpcomingMatch } from "@/components/match/types";

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
  slug: over.slug ?? "team",
  age: over.age ?? null,
  psdId: null,
  division: null,
  divisionFull: null,
  tagline: null,
  teamImageUrl: null,
});

const seniorTeams: TeamNavVM[] = [
  makeTeam({ slug: "kcvv-elewijt-a", name: "KCVV Elewijt A" }),
  makeTeam({ slug: "kcvv-elewijt-b", name: "KCVV Elewijt B" }),
];
const youthTeams: TeamNavVM[] = [
  makeTeam({ slug: "u15", name: "U15", age: "U15" }),
  makeTeam({ slug: "u13", name: "U13", age: "U13" }),
];

const homeMatch: UpcomingMatch = {
  id: 12345,
  date: new Date("2026-05-10T19:30:00Z"),
  time: "19:30",
  venue: "De Schalk",
  competition: "Tweede Provinciale A",
  status: "scheduled",
  homeTeam: { id: KCVV_FIRST_TEAM_CLUB_ID, name: "KCVV" },
  awayTeam: {
    id: 9999,
    name: "RC Mechelen",
    logo: "/images/logos/kcvv-logo.png",
  },
};

const awayMatch: UpcomingMatch = {
  ...homeMatch,
  homeTeam: { id: 9999, name: "VK De Volharding" },
  awayTeam: { id: KCVV_FIRST_TEAM_CLUB_ID, name: "KCVV" },
};

function PageShell({ match }: { match: UpcomingMatch | null }) {
  return (
    <div className="bg-cream-soft min-h-screen">
      <SiteHeader seniorTeams={seniorTeams} youthTeams={youthTeams} />
      {match ? <MatchStripView match={match} /> : null}
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
  title: "Layout/MatchStripInContext",
  component: PageShell,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeFixture: Story = {
  args: { match: homeMatch },
};

export const AwayFixture: Story = {
  args: { match: awayMatch },
};

export const NoUpcomingMatch: Story = {
  args: { match: null },
};
