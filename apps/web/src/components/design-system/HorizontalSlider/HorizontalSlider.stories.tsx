/**
 * HorizontalSlider Component Stories
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Generic horizontal scroll container with
 * paper-card prev/next arrows. The `MatchCardLayout` story showcases the
 * locked match-card structure (mono kicker / italic Elewijt / mono score /
 * venue + CTA, sub-degree rotation per nth-child). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HorizontalSlider } from "./HorizontalSlider";

// ---------------------------------------------------------------------------
// Generic sample cards — retro paper-card vocabulary
// ---------------------------------------------------------------------------

const SampleCard = ({ label }: { label: string }) => (
  <div className="border-ink bg-cream font-display text-ink flex h-32 w-64 shrink-0 items-center justify-center border-2 text-2xl italic shadow-[var(--shadow-paper-sm)]">
    {label}
  </div>
);

const fewItems = (
  <>
    <SampleCard label="Card 1" />
    <SampleCard label="Card 2" />
    <SampleCard label="Card 3" />
  </>
);

const manyItems = (
  <>
    <SampleCard label="Card 1" />
    <SampleCard label="Card 2" />
    <SampleCard label="Card 3" />
    <SampleCard label="Card 4" />
    <SampleCard label="Card 5" />
    <SampleCard label="Card 6" />
    <SampleCard label="Card 7" />
    <SampleCard label="Card 8" />
  </>
);

// ---------------------------------------------------------------------------
// Match-card showcase — the locked Direction D layout per compare.md
// ---------------------------------------------------------------------------

interface MockMatch {
  id: string;
  competition: string;
  /** Match date, mono caps (`ZA 02 MEI`) */
  date: string;
  homeTeam: { id: string; abbr: string; name: string };
  awayTeam: { id: string; abbr: string; name: string };
  /** Kick-off time, italic Freight Display ink-muted (`20:00`) */
  time: string;
  venue: string;
  cta: string;
}

// The slider only ever renders upcoming fixtures — finished/live results
// surface elsewhere (recap cards, live-match component) once PSD has synced.
// Mock data here is upcoming-only by design.

const ROTATION_POOL = [
  "var(--rotate-tape-a)",
  "var(--rotate-tape-c)",
  "var(--rotate-tape-b)",
  "var(--rotate-tape-d)",
] as const;

const KCVV_TEAM_ID = "kcvv";

const mockMatches: MockMatch[] = [
  {
    id: "m1",
    competition: "1STE PROV.",
    date: "ZA 02 MEI",
    homeTeam: { id: "wb", abbr: "WB", name: "Wezembeek" },
    awayTeam: { id: KCVV_TEAM_ID, abbr: "KC", name: "Elewijt" },
    time: "20:00",
    venue: "WEZEMBEEK-OPPEM",
    cta: "TICKETS →",
  },
  {
    id: "m2",
    competition: "BEKER · 1/8",
    date: "WO 06 MEI",
    homeTeam: { id: KCVV_TEAM_ID, abbr: "KC", name: "Elewijt" },
    awayTeam: { id: "lb", abbr: "LB", name: "Lebbeke" },
    time: "19:30",
    venue: "DRIESSTRAAT",
    cta: "TICKETS →",
  },
  {
    id: "m3",
    competition: "1STE PROV.",
    date: "ZA 09 MEI",
    homeTeam: { id: KCVV_TEAM_ID, abbr: "KC", name: "Elewijt" },
    awayTeam: { id: "vv", abbr: "VV", name: "Vilvoorde" },
    time: "15:00",
    venue: "DRIESSTRAAT",
    cta: "TICKETS →",
  },
  {
    id: "m4",
    competition: "1STE PROV.",
    date: "ZA 16 MEI",
    homeTeam: { id: "ku", abbr: "KU", name: "Kampenhout" },
    awayTeam: { id: KCVV_TEAM_ID, abbr: "KC", name: "Elewijt" },
    time: "15:00",
    venue: "KAMPENHOUT",
    cta: "TICKETS →",
  },
];

function MatchCardCrest({ abbr }: { abbr: string }) {
  return (
    <span className="border-ink bg-cream-soft font-display text-ink inline-flex h-7 w-7 flex-shrink-0 items-center justify-center border-[1.5px] text-[11px] font-bold italic">
      {abbr}
    </span>
  );
}

function MatchCardTeam({
  team,
  alignEnd,
}: {
  team: MockMatch["homeTeam"];
  alignEnd?: boolean;
}) {
  const isKcvv = team.id === KCVV_TEAM_ID;
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${alignEnd ? "justify-end" : ""}`}
    >
      {!alignEnd && <MatchCardCrest abbr={team.abbr} />}
      <span
        className={
          isKcvv
            ? "font-display text-jersey-deep truncate text-[17px] font-bold italic"
            : "text-ink truncate text-[15px] font-semibold"
        }
      >
        {team.name}
      </span>
      {alignEnd && <MatchCardCrest abbr={team.abbr} />}
    </div>
  );
}

function MatchCard({
  match,
  rotation,
}: {
  match: MockMatch;
  rotation: string;
}) {
  return (
    <div
      className="border-ink bg-cream w-72 flex-shrink-0 border-2 p-4 shadow-[var(--shadow-paper-sm)]"
      style={{ transform: `rotate(${rotation})` }}
    >
      <div className="text-ink-muted mb-3 flex items-baseline gap-2 font-mono text-[10px] tracking-[0.08em] uppercase">
        <span>{match.competition}</span>
        <span>{match.date}</span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <MatchCardTeam team={match.homeTeam} />
        <span className="text-ink-muted font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
          VS
        </span>
        <MatchCardTeam team={match.awayTeam} alignEnd />
      </div>

      <div className="font-display text-ink-muted my-2 text-center text-[22px] font-normal italic">
        {match.time}
      </div>

      <div className="border-paper-edge flex items-center justify-between border-t border-dashed pt-2 font-mono text-[10px] tracking-[0.08em] uppercase">
        <span className="text-ink-muted">{match.venue}</span>
        <a href="#" className="text-jersey-deep font-semibold no-underline">
          {match.cta}
        </a>
      </div>
    </div>
  );
}

const matchCardChildren = mockMatches.map((match, index) => (
  <MatchCard
    key={match.id}
    match={match}
    rotation={ROTATION_POOL[index % ROTATION_POOL.length]}
  />
));

const meta = {
  title: "UI/HorizontalSlider",
  component: HorizontalSlider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'Generic horizontal scroll container with smooth scrolling, hidden scrollbar, and the canonical 48 × 48 paper-button arrows from `<ScrollArrowButton>`. Theme `"dark"` overrides the arrow shadow to the soft (ink-muted) sibling so the offset stays visible against an ink panel.',
      },
    },
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof HorizontalSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — adjust props in the controls panel. */
export const Playground: Story = {
  args: {
    title: "Horizontal Slider",
    theme: "light",
    children: manyItems,
  },
};

/** Few items — arrows may not appear if all items fit the viewport. */
export const FewItems: Story = {
  args: {
    title: "Drie items",
    children: fewItems,
  },
};

/** Many items — paper-card sample cards plus the canonical arrows. */
export const ManyItems: Story = {
  args: {
    title: "Acht items",
    children: manyItems,
  },
};

/**
 * Dark theme variant — arrows swap to the soft ink-muted shadow so the
 * offset stays visible against the ink panel.
 */
export const DarkTheme: Story = {
  args: {
    title: "Dark Theme",
    theme: "dark",
    children: manyItems,
  },
  decorators: [
    (Story) => (
      <div className="bg-ink-soft p-6">
        <Story />
      </div>
    ),
  ],
};

/** No title — slider renders without a heading. */
export const NoTitle: Story = {
  args: {
    children: manyItems,
  },
};

/**
 * Match-card layout — locked Direction D structure (mono kicker · teams ·
 * mono score · venue + CTA). KCVV is always rendered as italic Freight
 * Display "Elewijt" in jersey-deep; opponent in body sans. Sub-degree
 * rotation cycles through `--rotate-tape-a..d` per `nth-child(4n+1..4)`.
 *
 * This is a visual reference for the spec — the production match-card
 * (`<MatchTeaser>`) is reskinned in a later page-level phase, not this PR.
 */
export const MatchCardLayout: Story = {
  args: {
    title: "Wedstrijden",
    children: matchCardChildren,
  },
};

/** Match-card layout on a dark interlude panel. */
export const MatchCardLayoutDark: Story = {
  args: {
    title: "Wedstrijden",
    theme: "dark",
    children: matchCardChildren,
  },
  decorators: [
    (Story) => (
      <div className="bg-ink-soft p-6">
        <Story />
      </div>
    ),
  ],
};
