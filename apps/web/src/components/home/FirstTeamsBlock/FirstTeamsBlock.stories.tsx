// apps/web/src/components/home/FirstTeamsBlock/FirstTeamsBlock.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FirstTeamsBlock } from "./FirstTeamsBlock";
import type { FirstTeamVM } from "./first-teams";
import type {
  ScheduleMatch,
  ScheduleReservation,
} from "@/components/match/types";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Home/FirstTeamsBlock",
  component: FirstTeamsBlock,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage 'Eerste ploegen' eyecatcher — a full-bleed jersey-deep-dark " +
          "matchday-desk band (StripedSeam top + bottom) with one full-width row " +
          "per senior team: [team label] · [last result] · [next fixture]. Both " +
          "the result and the next fixture render as the shared unified " +
          "<TeamAgendaRow> (same row as team pages + /kalender, #2301) — the " +
          "result as a cream row, the next fixture as the featured jersey-deep " +
          "card. Each row deep-links to its own match detail. A missing side " +
          "drops to a skip placeholder; a team with neither is omitted. When " +
          "that leaves no rows at all the band still renders, with a held-open " +
          "notice that distinguishes an empty feed from a failed read (#2399). " +
          "Spec: " +
          "docs/design/mockups/eerste-ploegen/eerste-ploegen-locked.md.",
      },
    },
  },
} satisfies Meta<typeof FirstTeamsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// Fixed dates → deterministic VR (the band reads no `now`; it renders the VMs).
// Both result + fixture are `ScheduleMatch`, fed straight into <TeamAgendaRow>.
// Hoisted so the Outcomes story can spread it without a non-null assertion.
const aResult: ScheduleMatch = {
  kind: "match",
  id: 101,
  date: new Date("2026-06-21T15:00:00Z"),
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
  awayTeam: { id: 42, name: "SK Londerzeel" },
  homeScore: 3,
  awayScore: 1,
  isHome: true,
  status: "finished",
  competition: "3de Nationale",
};

const aFixture: ScheduleMatch = {
  kind: "match",
  id: 102,
  date: new Date("2026-06-29T13:00:00Z"),
  time: "15:00",
  // KCVV plays away → opponent (Sporting Hasselt) is the home side.
  homeTeam: { id: 77, name: "Sporting Hasselt" },
  awayTeam: { id: 1235, name: "KCVV Elewijt" },
  isHome: false,
  status: "scheduled",
  competition: "3de Nationale",
};

const aTeam: FirstTeamVM = {
  label: "A-ploeg",
  slug: "a-ploeg",
  division: "3de Nationale",
  result: aResult,
  fixture: aFixture,
};

const bResult: ScheduleMatch = {
  kind: "match",
  id: 201,
  date: new Date("2026-06-22T13:30:00Z"),
  homeTeam: { id: 88, name: "Tempo Overijse" },
  awayTeam: { id: 1236, name: "KCVV Elewijt B" },
  homeScore: 2,
  awayScore: 0,
  isHome: false,
  status: "finished",
  competition: "2de Provinciale",
};

const bFixture: ScheduleMatch = {
  kind: "match",
  id: 202,
  date: new Date("2026-06-28T17:30:00Z"),
  time: "19:30",
  homeTeam: { id: 1236, name: "KCVV Elewijt B" },
  awayTeam: { id: 99, name: "VK Liedekerke" },
  isHome: true,
  status: "scheduled",
  competition: "2de Provinciale",
};

const bTeam: FirstTeamVM = {
  label: "B-ploeg",
  slug: "b-ploeg",
  division: "2de Provinciale",
  result: bResult,
  fixture: bFixture,
};

export const Default: Story = {
  args: { teams: [aTeam, bTeam] },
};

// A draw + a loss, to exercise the draw's own ink-muted underline (#2512/
// #2656) against the loss underline, alongside Default's win. Outcome is
// recomputed inside <TeamAgendaRow> from scores + isHome + status.
export const Outcomes: Story = {
  args: {
    teams: [
      {
        ...aTeam,
        result: { ...aResult, homeScore: 1, awayScore: 1 },
      },
      bTeam,
    ],
  },
};

/**
 * The #2423 live case: a cup tie awarded 5-0 by forfeit before its kickoff.
 * It used to be invisible — neither `finished` nor `scheduled` — and the block
 * showed the match after it as though this one did not exist. It now takes the
 * result slot, and the caption names it so the score is not left unexplained.
 */
export const ForfeitedResult: Story = {
  args: {
    teams: [
      {
        ...aTeam,
        result: {
          ...aResult,
          id: 103,
          date: new Date("2026-06-28T16:30:00Z"),
          homeTeam: { id: 55, name: "SK Nossegem" },
          awayTeam: { id: 1235, name: "KCVV Elewijt" },
          homeScore: 5,
          awayScore: 0,
          isHome: false,
          status: "forfeited",
          competition: "Beker van Vlaams-Brabant",
        },
      },
      bTeam,
    ],
  },
};

/**
 * The #2390 live case: B-ploeg played FC Zemst Sportief on a Thursday evening,
 * and until PSD published the score the match was `scheduled` with a past
 * kickoff — in neither slot, so the homepage showed the match *before* it as
 * the result. It now headlines the result slot scoreless.
 *
 * The row says the result is coming (#2587): `–` in the score slot, in the
 * demoted mono register, and the caption opens on "Uitslag volgt". It used to
 * print the kickoff time there — a meaningless number in the slot a score
 * would occupy. No outcome underline. The A-ploeg row above it is the settled
 * counterpart, for contrast in the same band.
 */
export const AwaitingResult: Story = {
  args: {
    teams: [
      aTeam,
      {
        ...bTeam,
        result: {
          kind: "match",
          id: 203,
          date: new Date("2026-06-25T17:30:00Z"),
          time: "19:30",
          homeTeam: { id: 1236, name: "KCVV Elewijt B" },
          awayTeam: { id: 91, name: "FC Zemst Sportief" },
          isHome: true,
          status: "scheduled",
          competition: "2de Provinciale",
        },
      },
    ],
  },
};

/**
 * The #2397 live case: real opponents, each carrying the `A` designation the
 * BFF sends, which is what pushed these names past their half of the row.
 * "Ritterklub Vsv Jette A" is the longest that occurs in the current fixture
 * list and the widest the row must seat unclipped at 1440px.
 *
 * The score stays dead centre in every one of these rows — a scoreboard whose
 * score wanders with the club names reads as a broken table.
 */
export const LongOpponentNames: Story = {
  args: {
    teams: [
      {
        ...aTeam,
        result: {
          ...aResult,
          homeTeam: { id: 61, name: "Ohr Huldenberg", teamLabel: "A" },
          awayTeam: { id: 1235, name: "KCVV Elewijt" },
          isHome: false,
        },
        fixture: {
          ...aFixture,
          homeTeam: { id: 62, name: "VK Ninove", teamLabel: "A" },
        },
      },
      {
        ...bTeam,
        result: {
          ...bResult,
          homeTeam: { id: 63, name: "SK Nossegem", teamLabel: "A" },
        },
        fixture: {
          ...bFixture,
          awayTeam: {
            id: 64,
            name: "Ritterklub Vsv Jette",
            teamLabel: "A",
          },
        },
      },
    ],
  },
};

/**
 * A youth-May-tournament placeholder (#2606) in the B-ploeg fixture slot —
 * deliberate coverage for a state that, before #2688, only rendered
 * correctly on the homepage as an incidental side effect of #2632's shared
 * `<TeamAgendaRow>` fix. One crest, the competition subject, the real
 * kickoff — no opponent, no score, no link.
 */
const bFixtureReservation: ScheduleReservation = {
  kind: "reservation",
  id: 204,
  date: new Date("2026-06-28T09:30:00Z"),
  time: "09:30",
  team: { id: 1236, name: "KCVV Elewijt B" },
  status: "scheduled",
  competition: "Tornooi",
};

export const ReservationFixture: Story = {
  args: {
    teams: [aTeam, { ...bTeam, fixture: bFixtureReservation }],
  },
};

// Both no-row states pass the heading the page actually derives for them:
// `firstTeamsHeading` sees no fixture, so it never claims "Dit weekend."
const NO_ROWS_ARGS = {
  teams: [{ label: "A-ploeg", slug: "a-ploeg" }],
  heading: "Volgende wedstrijd.",
};

/** #2399 — the read succeeded and the feed is genuinely empty (mid-summer). */
export const NoMatches: Story = { args: NO_ROWS_ARGS };

/** #2399 — the same empty band, but the BFF read failed. Only the copy differs. */
export const FeedUnavailable: Story = {
  args: { ...NO_ROWS_ARGS, unavailable: true },
};

// #2505/#2844 — the Studio-authored off-season notice. `now` is fixed so the
// countdown's day count doesn't drift between renders/CI runs.
const PLACEHOLDER_NOW = new Date("2026-07-10T12:00:00Z");
// The live production mededeling as of 2026-07-13 (#2844), shared by every
// story below that authors one — `satisfies MatchesSliderPlaceholderVM` on
// each `placeholder` object was redundant (#2505 round-3 review finding S8):
// `StoryObj<typeof meta>` already type-checks `args`, excess properties
// included.
const MEDEDELING_TEXT =
  "Groenwit maakt zich klaar voor seizoen 2026-2027 in 3e Nationale.";

/** Kickoff authored, in the future, no mededeling. */
export const PlaceholderCountdown: Story = {
  args: {
    ...NO_ROWS_ARGS,
    placeholder: { nextSeasonKickoff: new Date("2026-08-02T00:00:00Z") },
    now: PLACEHOLDER_NOW,
  },
};

/** Kickoff falls on the current calendar day. */
export const PlaceholderToday: Story = {
  args: {
    ...NO_ROWS_ARGS,
    placeholder: { nextSeasonKickoff: new Date("2026-07-10T18:00:00Z") },
    now: PLACEHOLDER_NOW,
  },
};

/** No kickoff authored (or already past) — falls through to the mededeling.
 *  Plain text: no `announcementHref` authored. */
export const PlaceholderMededeling: Story = {
  args: {
    ...NO_ROWS_ARGS,
    placeholder: { announcementText: MEDEDELING_TEXT },
    now: PLACEHOLDER_NOW,
  },
};

/** Same mededeling, this time with `announcementHref` authored — renders as
 *  a link rather than plain text. */
export const PlaceholderMededelingWithLink: Story = {
  args: {
    ...NO_ROWS_ARGS,
    placeholder: {
      announcementText: MEDEDELING_TEXT,
      announcementHref: "/kalender",
    },
    now: PLACEHOLDER_NOW,
  },
};

/** `highlightImage` authored alongside the mededeling — renders inside the
 *  dashed frame, above the sentence, at a capped height (#2844). */
export const PlaceholderWithImage: Story = {
  args: {
    ...NO_ROWS_ARGS,
    placeholder: {
      announcementText: MEDEDELING_TEXT,
      highlightImage: {
        alt: "De A-kern tijdens de eerste training van het nieuwe seizoen",
        url: fixtureImage("team-group"),
      },
    },
    now: PLACEHOLDER_NOW,
  },
};

// Graceful skip: A has no upcoming fixture (season end), B has no recent result.
export const MissingSides: Story = {
  args: {
    teams: [
      {
        label: aTeam.label,
        slug: aTeam.slug,
        division: aTeam.division,
        result: aTeam.result,
      },
      {
        label: bTeam.label,
        slug: bTeam.slug,
        division: bTeam.division,
        fixture: bTeam.fixture,
      },
    ],
  },
};
