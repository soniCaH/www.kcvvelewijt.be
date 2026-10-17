import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { MatchHero } from "./MatchHero";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Matches/MatchHero",
  component: MatchHero,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story, { parameters }) => (
      // `phoneFrame` mirrors the live page at phone width (16px gutters); the
      // default frame's 40px would squeeze the card well below what ships.
      <div
        className={`bg-cream-soft min-h-[400px] ${parameters.phoneFrame ? "p-4" : "p-10"}`}
      >
        <div className="mx-auto max-w-[760px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MatchHero>;

export default meta;
type Story = StoryObj<typeof meta>;

const KCVV_LOGO = fixtureImage("sponsor-logo", 0);
const OPPONENT_LOGO = fixtureImage("sponsor-logo", 1);

const defaultHomeTeam = {
  id: 1235,
  name: "KCVV Elewijt",
  logo: KCVV_LOGO,
};
const defaultAwayTeam = {
  id: 9999,
  name: "RC Mechelen",
  logo: OPPONENT_LOGO,
};

const upcomingDate = new Date("2025-09-13T13:30:00Z");
const finishedDate = new Date("2025-09-06T13:30:00Z");

const baseMatch = {
  kind: "match",
  homeTeam: defaultHomeTeam,
  awayTeam: defaultAwayTeam,
  date: upcomingDate,
  time: "14:30",
  venue: "Sportpark Elewijt",
  competition: "3e provinciale A",
  kcvvTeamLabel: "KCVV-A",
} as const;

export const Upcoming: Story = {
  args: { match: { ...baseMatch, status: "scheduled" } },
};

/**
 * The travel target (#3397): with the match `id` set (the match page always
 * does) the card is a `<ViewTransition name="match-travel-<id>">` boundary (`<TravelDestination>`), the
 * end a tapped fixture row grows into. It renders exactly as `Upcoming` — the
 * boundary is invisible at rest — so this story only keeps the named path
 * rendering and covered.
 */
export const TravelTarget: Story = {
  args: { match: { ...baseMatch, id: 3740, status: "scheduled" } },
};

export const Finished: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 3 },
      awayTeam: { ...defaultAwayTeam, score: 1 },
      status: "finished",
    },
  },
};

export const Forfeited: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 5 },
      awayTeam: { ...defaultAwayTeam, score: 0 },
      status: "forfeited",
    },
  },
};

export const Postponed: Story = {
  args: { match: { ...baseMatch, status: "postponed" } },
};

export const Cancelled: Story = {
  args: { match: { ...baseMatch, status: "cancelled" } },
};

export const Stopped: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 1 },
      awayTeam: { ...defaultAwayTeam, score: 1 },
      status: "stopped",
    },
  },
};

export const LongTeamNames: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: {
        id: defaultHomeTeam.id,
        name: "KFC Sint-Stevens-Woluwe-Diegem",
        logo: defaultHomeTeam.logo,
        score: 2,
      },
      awayTeam: {
        id: defaultAwayTeam.id,
        name: "Royal Antwerpen-Borgerhout SK",
        logo: defaultAwayTeam.logo,
        score: 2,
      },
      status: "finished",
    },
  },
};

export const NoLogos: Story = {
  args: {
    match: {
      ...baseMatch,
      homeTeam: { id: defaultHomeTeam.id, name: "KCVV Elewijt" },
      awayTeam: { id: defaultAwayTeam.id, name: "RC Mechelen" },
      status: "scheduled",
    },
  },
};

export const MinimalData: Story = {
  args: {
    match: {
      kind: "match",
      homeTeam: defaultHomeTeam,
      awayTeam: defaultAwayTeam,
      date: upcomingDate,
      status: "scheduled",
    },
  },
};

/**
 * A pitch-reservation placeholder (#2606) — both sides upstream are the same
 * club. One crest, no "vs" a second one, no score region: the subject
 * ("Tornooi") and real kickoff replace the competition/score vocabulary,
 * and the meta line names the squad that reserved the slot (#2688).
 *
 * The fullest layout is the only one kept: the defensive no-competition
 * fallback and the no-squad-label variant differ from this one only in the
 * meta line's text, which `MatchHero.test.tsx` already pins at the unit
 * level — a pixel diff cannot uniquely surface a string variant, so a
 * separate baseline for each was three VR captures for one component.
 */
export const Reservation: Story = {
  args: {
    match: {
      kind: "reservation",
      team: defaultHomeTeam,
      date: upcomingDate,
      time: "09:30",
      venue: "Sportpark Elewijt",
      competition: "Tornooi",
      kcvvTeamLabel: "U13",
      status: "scheduled",
    },
  },
};

/**
 * A tournament fixture with no result yet (#2696/#2802) — a real named
 * opponent, not a self-match. Same one-crest reduced register as
 * `Reservation` above, but the subject names the other club ("TORNOOI · FC
 * ZEMST SPORTIEF") and the crest is the opponent's, resolved by club id —
 * the gap this ticket closes: before it, `/wedstrijd/[matchId]` rendered an
 * ordinary two-crest "vs" scoreboard against a club PSD hasn't confirmed as
 * a genuine opponent.
 */
export const TournamentPending: Story = {
  args: {
    match: {
      kind: "reduced",
      team: { id: 1391, name: "FC Zemst Sportief" },
      date: upcomingDate,
      time: "09:30",
      venue: "Sportpark Elewijt",
      competition: "Tornooi",
      kcvvTeamLabel: "U9",
      status: "scheduled",
    },
  },
};

/**
 * The same tournament fixture once a result exists (#2696 review) — the
 * named club really was the opponent, so the hero reverts to the ordinary
 * two-crest scoreboard instead of staying reduced.
 */
export const TournamentPlayed: Story = {
  args: {
    match: {
      kind: "match",
      homeTeam: { ...defaultHomeTeam, score: 4 },
      awayTeam: { id: 1391, name: "FC Zemst Sportief", score: 1 },
      date: finishedDate,
      venue: "Sportpark Elewijt",
      competition: "Tornooi",
      kcvvTeamLabel: "U9",
      status: "finished",
    },
  },
};

/**
 * Mobile collapse — at narrow widths the two-zone grid stacks vertically,
 * the divider rotates from vertical-right to horizontal-bottom, and the
 * status badge stays anchored to the card's top-right.
 */
export const MobileCollapse: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 3 },
      awayTeam: { ...defaultAwayTeam, score: 1 },
      status: "finished",
    },
  },
  parameters: {
    // Locks the stacked-grid collapse, which only shows at narrow widths
    // (#2803).
    vr: { viewports: ["mobile"] },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[600px] p-4">
        <div className="mx-auto max-w-[360px]">
          <Story />
        </div>
      </div>
    ),
  ],
};

// ── Mobile stacked layout (#3503) ───────────────────────────────────────────
// Below `md` each team stacks crest-over-name and the score centres on the
// crest row. These are layout facts, so they are asserted at runtime in the
// named viewports (`globals.viewport`, honoured by `pnpm test:storybook`) —
// happy-dom has no layout. Names wrap, so the assertions compare the two
// sides to each other rather than hard-code a line count a fallback font
// could change. `!vr`: assertion-only — the VR runner screenshots at its own
// 375px mobile width whatever `globals.viewport` says, and the refreshed
// mobile baselines of the stories above already show the stacked look.

interface HeroGeometry {
  crests: HTMLElement[];
  names: HTMLElement[];
  score: HTMLElement;
}

async function heroGeometry(canvasElement: HTMLElement): Promise<HeroGeometry> {
  await document.fonts.ready;
  const h1 = canvasElement.querySelector("h1") as HTMLElement;
  const all = (part: string) =>
    Array.from(h1.querySelectorAll<HTMLElement>(`[data-team-part="${part}"]`));
  return {
    crests: all("crest"),
    names: all("name"),
    score: h1.querySelector<HTMLElement>("[data-score-state]") as HTMLElement,
  };
}

const mid = (r: DOMRect) => r.top + r.height / 2;

function assertStackedHero({ crests, names, score }: HeroGeometry) {
  expect(crests).toHaveLength(2);
  expect(names).toHaveLength(2);
  for (const name of names) {
    expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
  }
  const [c0, c1] = crests.map((el) => el.getBoundingClientRect());
  expect(Math.abs(c0.top - c1.top)).toBeLessThanOrEqual(1);
  const [n0, n1] = names.map((el) => el.getBoundingClientRect());
  expect(Math.abs(n0.top - n1.top)).toBeLessThanOrEqual(1);
  // Crest ABOVE name, not beside it — on both sides.
  expect(n0.top).toBeGreaterThanOrEqual(c0.bottom);
  expect(n1.top).toBeGreaterThanOrEqual(c1.bottom);
  expect(
    Math.abs(mid(score.getBoundingClientRect()) - mid(c0)),
  ).toBeLessThanOrEqual(2);
}

/** The shared check for the short-name-beside-long-name pair. */
const playShortBesideLong: Story["play"] = async ({ canvasElement }) => {
  const geometry = await heroGeometry(canvasElement);
  assertStackedHero(geometry);
  const [home, away] = geometry.names;
  // The long name takes more lines than the short one.
  expect(away.getBoundingClientRect().height).toBeGreaterThan(
    home.getBoundingClientRect().height,
  );
};

// 6 + 8 + 6 letters: three lines at both 320px and 375px, 22 characters.
const threeLineName = "Lierse Sporting Kempen";

const stackedMatch = {
  ...baseMatch,
  date: finishedDate,
  homeTeam: { ...defaultHomeTeam, score: 3 },
  awayTeam: { ...defaultAwayTeam, name: threeLineName, score: 1 },
  status: "finished",
} as const;

/**
 * A short name beside a 22-character one at 320px, the narrowest phone the
 * club supports: both crests and both names start on the same line, nothing
 * overflows, the score sits on the crest row.
 */
export const MobileStacked320: Story = {
  args: { match: stackedMatch },
  globals: { viewport: { value: "mobile1" } },
  parameters: { phoneFrame: true },
  tags: ["!vr"],
  play: playShortBesideLong,
};

/** The same pair at 375px. */
export const MobileStacked375: Story = {
  args: { match: stackedMatch },
  globals: { viewport: { value: "kcvvMobile" } },
  parameters: { phoneFrame: true },
  tags: ["!vr"],
  play: playShortBesideLong,
};

/**
 * A club without a logo: `TeamShieldFallback` takes the same 40x40 slot as a
 * crest, so the crest row stays level.
 */
export const MobileNoLogo: Story = {
  args: {
    match: {
      ...stackedMatch,
      homeTeam: { id: defaultHomeTeam.id, name: "KCVV Elewijt", score: 3 },
    },
  },
  globals: { viewport: { value: "mobile1" } },
  parameters: { phoneFrame: true },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    assertStackedHero(await heroGeometry(canvasElement));
  },
};

/** The scheduled "vs" mark centres on the crest row, not on the name rows. */
export const MobileScheduledVs: Story = {
  args: {
    match: {
      ...baseMatch,
      awayTeam: { ...defaultAwayTeam, name: threeLineName },
      status: "scheduled",
    },
  },
  globals: { viewport: { value: "mobile1" } },
  parameters: { phoneFrame: true },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const geometry = await heroGeometry(canvasElement);
    assertStackedHero(geometry);
    expect(geometry.score).toHaveAttribute("data-score-state", "vs");
  },
};

/**
 * A 30-character name at 320px caps at three lines; the full name stays in
 * `title`.
 */
export const MobileThirtyCharName: Story = {
  args: {
    match: {
      ...stackedMatch,
      awayTeam: {
        ...defaultAwayTeam,
        name: "Boortmeerbeek-Hever-Schiplaken",
        score: 1,
      },
    },
  },
  globals: { viewport: { value: "mobile1" } },
  parameters: { phoneFrame: true },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const geometry = await heroGeometry(canvasElement);
    assertStackedHero(geometry);
    const away = geometry.names[1];
    expect(away).toHaveAttribute("title", "Boortmeerbeek-Hever-Schiplaken");
    const lineHeight = parseFloat(getComputedStyle(away).lineHeight);
    const height = away.getBoundingClientRect().height;
    // Wraps (no ellipsis on one line) and stops at three lines.
    expect(height).toBeGreaterThan(lineHeight * 1.5);
    expect(height).toBeLessThanOrEqual(lineHeight * 3 + 1);
  },
};
