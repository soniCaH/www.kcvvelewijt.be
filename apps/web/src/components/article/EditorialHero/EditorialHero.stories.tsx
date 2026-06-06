import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialHero, type EditorialHeroProps } from "./EditorialHero";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Article/EditorialHero",
  component: EditorialHero,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Per-articleType editorial hero (R1.5, #1749). Four variants share a 50/50 shell + landscape cover but render variant-specific kicker, below-H1 (interview credit chips, transfer meta line), and below-hero (event compressed strip) artefacts. `placement` controls whether the hero wraps in a `<Link>` (homepage) or renders bare (detail).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft px-12 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialHero>;

export default meta;
// Each story's `args` carries a literal `variant` discriminator. To
// keep TypeScript happy through the discriminated union we narrow
// each story's type to its specific variant — `StoryObj<typeof meta>`
// collapses `Partial<EditorialHeroProps>` to `never`, and a
// generic `StoryObj<EditorialHeroProps>` breaks on cross-branch spreads.
type StoryFor<V extends EditorialHeroProps["variant"]> = StoryObj<
  Extract<EditorialHeroProps, { variant: V }>
>;
type AnnouncementStory = StoryFor<"announcement">;
type InterviewStory = StoryFor<"interview">;
type EventStory = StoryFor<"event">;
type TransferStory = StoryFor<"transfer">;
// matchPreview / matchRecap share a single props member whose `variant` is a
// 2-literal union, so `Extract<..., { variant: "matchPreview" }>` collapses to
// never. Extract on the full union recovers the member; each story sets its
// own literal variant.
type MatchStory = StoryObj<
  Extract<EditorialHeroProps, { variant: "matchPreview" | "matchRecap" }>
>;

const COVER_GENERIC = {
  url: fixtureImage("article-hero-generic", 0),
  alt: "Spelers vieren een doelpunt",
};
const COVER_INTERVIEW = {
  url: fixtureImage("article-hero-interview", 0),
  alt: "Jens De Smet in gesprek na de wedstrijd",
};
const COVER_TRANSFER = {
  url: fixtureImage("article-hero-transfer", 0),
  alt: "Bocar Sarr in trainingstenue",
};
const COVER_EVENT = {
  url: fixtureImage("article-hero-evenement", 0),
  alt: "Sfeerbeeld jeugdtoernooi",
};

const PLAYER_PORTRAIT = fixtureImage("player-portrait", 0);

// ─── Announcement ──────────────────────────────────────────────────────────

export const AnnouncementDetail: AnnouncementStory = {
  args: {
    variant: "announcement",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
    lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks. Zaterdag wordt gevierd op het sportpark.",
    author: "Redactie",
    category: "Clubnieuws",
    date: "3 mei 2026",
    coverImage: COVER_GENERIC,
  },
};

export const AnnouncementHomepage: AnnouncementStory = {
  args: {
    variant: "announcement",
    placement: "homepage",
    slug: "kampioen-58-punten",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
    lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks. Zaterdag wordt gevierd op het sportpark.",
    author: "Redactie",
    category: "Clubnieuws",
    date: "3 mei 2026",
    coverImage: COVER_GENERIC,
  },
};

// Phase 4.5.C.1 (#1754) — the static homepage hero swaps the canonical
// 2px paper-stamp press-down for the `tilt-photo` treatment: only the
// framed cover image tilts + scales on hover; the editorial column
// stays still. Hover/focus the story to see the cover tilt.
export const AnnouncementHomepageTiltPhoto: AnnouncementStory = {
  args: {
    variant: "announcement",
    placement: "homepage",
    hoverStyle: "tilt-photo",
    slug: "kampioen-58-punten",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
    lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks. Zaterdag wordt gevierd op het sportpark.",
    author: "Redactie",
    category: "Clubnieuws",
    date: "3 mei 2026",
    coverImage: COVER_GENERIC,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Static homepage hero hover treatment. Used on `/` from #1754 onward — the full-width hero spans the inner content column, so the canonical 2px press-down reads as a twitch. `hoverStyle="tilt-photo"` lets the framed `<TapedFigure>` tilt -1° + scale 1.02× on group-hover instead; the editorial column stays still and "★ Lees verder →" reveals at the bottom-right.',
      },
    },
  },
};

export const AnnouncementNoCategory: AnnouncementStory = {
  args: {
    variant: "announcement",
    title: "Algemene mededeling van het bestuur.",
    lead: "Korte update over het komende seizoen.",
    author: "Bestuur",
    date: "1 mei 2026",
    coverImage: COVER_GENERIC,
  },
};

// ─── Interview ─────────────────────────────────────────────────────────────

const subjectJens = {
  kind: "player" as const,
  playerRef: {
    firstName: "Jens",
    lastName: "De Smet",
    jerseyNumber: 10,
    position: "Middenvelder",
    psdImageUrl: PLAYER_PORTRAIT,
  },
};
const subjectLars = {
  kind: "player" as const,
  playerRef: {
    firstName: "Lars",
    lastName: "Peeters",
    jerseyNumber: 7,
    position: "Aanvaller",
    psdImageUrl: PLAYER_PORTRAIT,
  },
};
const subjectThomas = {
  kind: "player" as const,
  playerRef: {
    firstName: "Thomas",
    lastName: "Vermeulen",
    jerseyNumber: 3,
    position: "Verdediger",
    psdImageUrl: PLAYER_PORTRAIT,
  },
};

export const InterviewSingleSubject: InterviewStory = {
  args: {
    variant: "interview",
    title: '"Met deze ploeg kunnen we ver geraken."',
    lead: "Aanvoerder Jens De Smet over de promotiekansen en het nieuwe trainingsritme.",
    author: "Tom Janssens",
    date: "5 mei 2026",
    coverImage: COVER_INTERVIEW,
    subjects: [subjectJens],
  },
};

export const InterviewTwoSubjects: InterviewStory = {
  args: {
    variant: "interview",
    title: '"Met deze ploeg kunnen we ver geraken."',
    lead: "Aanvoerder Jens De Smet over de promotiekansen en het nieuwe trainingsritme.",
    author: "Tom Janssens",
    date: "5 mei 2026",
    coverImage: COVER_INTERVIEW,
    subjects: [subjectJens, subjectLars],
  },
};

export const InterviewThreeSubjects: InterviewStory = {
  args: {
    variant: "interview",
    title: '"Met deze ploeg kunnen we ver geraken."',
    lead: "Aanvoerder Jens De Smet over de promotiekansen en het nieuwe trainingsritme.",
    author: "Tom Janssens",
    date: "5 mei 2026",
    coverImage: COVER_INTERVIEW,
    subjects: [subjectJens, subjectLars, subjectThomas],
  },
};

export const InterviewHomepage: InterviewStory = {
  args: {
    variant: "interview",
    placement: "homepage",
    slug: "kapitein-jens",
    title: '"Met deze ploeg kunnen we ver geraken."',
    lead: "Aanvoerder Jens De Smet over de promotiekansen en het nieuwe trainingsritme.",
    author: "Tom Janssens",
    date: "5 mei 2026",
    coverImage: COVER_INTERVIEW,
    subjects: [subjectJens],
  },
};

// ─── Event ─────────────────────────────────────────────────────────────────

export const EventDetail: EventStory = {
  args: {
    variant: "event",
    title: "Spelerstornooi U13 — zaterdag 15 juni",
    lead: "Acht ploegen, één toernooi. Inschrijven kan tot 1 juni.",
    author: "Jeugdwerking",
    date: "15 juni 2026",
    coverImage: COVER_EVENT,
    feature: {
      title: "Spelerstornooi U13",
      date: "2026-06-15",
      startTime: "09:00",
      endTime: "17:00",
      location: "Sportpark Elewijt",
      ageGroup: "U13",
    },
  },
};

export const EventHomepage: EventStory = {
  args: {
    variant: "event",
    placement: "homepage",
    slug: "spelerstornooi-u13",
    title: "Spelerstornooi U13 — zaterdag 15 juni",
    lead: "Acht ploegen, één toernooi. Inschrijven kan tot 1 juni.",
    author: "Jeugdwerking",
    date: "15 juni 2026",
    coverImage: COVER_EVENT,
    feature: {
      title: "Spelerstornooi U13",
      date: "2026-06-15",
      startTime: "09:00",
      endTime: "17:00",
      location: "Sportpark Elewijt",
      ageGroup: "U13",
    },
  },
};

export const EventCompetitionTag: EventStory = {
  args: {
    variant: "event",
    title: "Spelerstornooi U13 — zaterdag 15 juni",
    lead: "Acht ploegen, één toernooi. Inschrijven kan tot 1 juni.",
    author: "Jeugdwerking",
    date: "15 juni 2026",
    coverImage: COVER_EVENT,
    feature: {
      title: "Vriendschappelijk",
      date: "2026-06-15",
      startTime: "20:00",
      endTime: "22:00",
      location: "Sportpark Elewijt",
      competitionTag: "Vriendschappelijk",
    },
  },
};

// ─── Transfer ─────────────────────────────────────────────────────────────

export const TransferIncoming: TransferStory = {
  args: {
    variant: "transfer",
    title: "Aanvalsversterking voor volgend seizoen.",
    lead: "Bocar Sarr tekent voor twee seizoenen.",
    author: "Redactie",
    date: "30 april 2026",
    coverImage: COVER_TRANSFER,
    feature: {
      direction: "incoming",
      playerName: "Bocar Sarr",
      position: "Aanvaller",
      age: 24,
      otherClubName: "KV Mechelen B",
    },
  },
};

export const TransferOutgoing: TransferStory = {
  args: {
    variant: "transfer",
    title: "Tom De Bie verlaat KCVV richting Sporting Mechelen.",
    lead: "Bocar Sarr tekent voor twee seizoenen.",
    author: "Redactie",
    date: "30 april 2026",
    coverImage: COVER_TRANSFER,
    feature: {
      direction: "outgoing",
      playerName: "Tom De Bie",
      position: "Middenvelder",
      age: 22,
      otherClubName: "Sporting Mechelen",
    },
  },
};

export const TransferExtension: TransferStory = {
  args: {
    variant: "transfer",
    title: "Verlenging voor kapitein Frédéric Maes.",
    lead: "Bocar Sarr tekent voor twee seizoenen.",
    author: "Redactie",
    date: "30 april 2026",
    coverImage: COVER_TRANSFER,
    feature: {
      direction: "extension",
      playerName: "Frédéric Maes",
      position: "Verdediger",
      age: 28,
      until: "2028",
    },
  },
};

export const TransferHomepage: TransferStory = {
  args: {
    variant: "transfer",
    placement: "homepage",
    slug: "transfer-bocar-sarr",
    title: "Aanvalsversterking voor volgend seizoen.",
    lead: "Bocar Sarr tekent voor twee seizoenen.",
    author: "Redactie",
    date: "30 april 2026",
    coverImage: COVER_TRANSFER,
    feature: {
      direction: "incoming",
      playerName: "Bocar Sarr",
      position: "Aanvaller",
      age: 24,
      otherClubName: "KV Mechelen B",
    },
  },
};

// ─── Match preview / recap (5.d-mat H3 score-forward hero) ──────────────────

const MATCH_RECAP_DATA = {
  homeTeam: { name: "KCVV Elewijt" },
  awayTeam: { name: "Racing Mechelen" },
  kcvvSide: "home" as const,
  homeScore: 2,
  awayScore: 1,
  status: "finished" as const,
  competition: "3e Provinciale",
  matchDate: "Za 13 september",
};

const MATCH_PREVIEW_DATA = {
  homeTeam: { name: "KCVV Elewijt" },
  awayTeam: { name: "Racing Mechelen" },
  kcvvSide: "home" as const,
  kickoffTime: "15:00",
  status: "scheduled" as const,
  competition: "3e Provinciale",
  matchDate: "Za 13 september",
};

export const MatchRecapDetail: MatchStory = {
  args: {
    variant: "matchRecap",
    title: "KCVV pakt de drie punten in de slotfase.",
    lead: "Een koele strafschop besliste een taaie partij tegen Racing.",
    author: "Redactie",
    date: "13 september 2026",
    coverImage: COVER_GENERIC,
    match: MATCH_RECAP_DATA,
  },
};

export const MatchPreviewDetail: MatchStory = {
  args: {
    variant: "matchPreview",
    title: "Topper tegen Racing wacht.",
    lead: "Een driepunter tilt KCVV naar de subtop.",
    author: "Redactie",
    date: "10 september 2026",
    coverImage: COVER_GENERIC,
    match: MATCH_PREVIEW_DATA,
  },
};

// Graceful degradation: the linked match 404'd, so no `match` data reaches
// the hero. It falls back to the kicker-only editorial shell (no score bar).
export const MatchRecapNoMatch: MatchStory = {
  args: {
    variant: "matchRecap",
    title: "KCVV pakt de drie punten in de slotfase.",
    lead: "Een koele strafschop besliste een taaie partij tegen Racing.",
    author: "Redactie",
    date: "13 september 2026",
    coverImage: COVER_GENERIC,
    match: null,
  },
};

export const TransferMissingFields: TransferStory = {
  args: {
    variant: "transfer",
    title: "Naamloze transfer (graceful-omit demo).",
    lead: "Bocar Sarr tekent voor twee seizoenen.",
    author: "Redactie",
    date: "30 april 2026",
    coverImage: COVER_TRANSFER,
    feature: {
      direction: "incoming",
      playerName: "Onbekende speler",
      otherClubName: "KV Mechelen B",
    },
  },
};
