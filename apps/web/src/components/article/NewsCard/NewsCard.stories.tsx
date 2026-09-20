// apps/web/src/components/article/NewsCard/NewsCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewsCard } from "./NewsCard";
import { fixtureImage } from "@test-fixtures/images";
import { getCardSubjectArtefact } from "@/lib/utils/card-subject-artefact";

const meta = {
  title: "Features/Articles/NewsCard",
  component: NewsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Flush-edge news card (R10) — image fills the outer card top region; meta panel " +
          "below an ink rule. `standard` and `featured` variants differ in heading size and " +
          "internal padding only; surface (`bg`) and rotation are surface-level concerns.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["standard", "featured"],
    },
    badge: { control: "text" },
    date: { control: "text" },
    imageUrl: { control: "text" },
  },
} satisfies Meta<typeof NewsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    href: "/nieuws/derby-overwinning",
    imageUrl: fixtureImage("article-hero-matchverslag", 0),
    badge: "Competitie",
    date: "15 januari 2025",
    variant: "standard",
  },
};

export const Featured: Story = {
  args: {
    title:
      "Spelersvoorstelling seizoen 2025-2026: versterkingen voor nationaal debuut",
    href: "/nieuws/spelersvoorstelling",
    imageUrl: fixtureImage("article-hero-generic", 0),
    badge: "Selectie",
    date: "14 maart 2026",
    variant: "featured",
  },
};

// Three-up archive grid — formerly `ListingGrid` while the `listing`
// variant existed. Post-R10 there's no visual difference between
// listing and standard; the grid composition still proves the surface
// behaves under realistic archive-page constraints.
export const Grid: Story = {
  args: {
    title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
    href: "/nieuws/derby-overwinning",
    imageUrl: fixtureImage("article-hero-matchverslag", 2),
    badge: "Competitie",
    date: "15 januari 2025",
    variant: "standard",
  },
  decorators: [
    (Story) => (
      <div className="grid max-w-5xl grid-cols-3 gap-6">
        <Story />
        <NewsCard
          title="Spelersvoorstelling seizoen 2025-2026"
          href="/nieuws/spelersvoorstelling"
          imageUrl={fixtureImage("article-hero-jeugd", 0)}
          badge="Selectie"
          date="14 maart 2026"
          variant="standard"
        />
        <NewsCard
          title="Nieuwe trainingsschema bekendgemaakt"
          href="/nieuws/trainingsschema"
          badge="Club"
          date="12 januari 2025"
          variant="standard"
        />
      </div>
    ),
  ],
};

export const WithoutImage: Story = {
  args: {
    title: "Nieuwe trainingsschema seizoen 2025-2026 bekendgemaakt",
    href: "/nieuws/trainingsschema",
    badge: "Club",
    date: "12 januari 2025",
    variant: "standard",
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/nieuws/titel",
    imageUrl: fixtureImage("article-hero-generic", 2),
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "standard",
  },
};

export const FeaturedLongTitle: Story = {
  args: {
    title:
      "KCVV Elewijt pakt de titel in eerste provinciale na een ijzersterk seizoen met maar liefst 17 overwinningen en 58 punten",
    href: "/nieuws/titel",
    imageUrl: fixtureImage("article-hero-generic", 1),
    badge: "Clubnieuws",
    date: "5 mei 2025",
    variant: "featured",
  },
};

export const NoBadge: Story = {
  args: {
    title: "Clubbericht zonder categorie",
    href: "/nieuws/bericht",
    imageUrl: fixtureImage("article-hero-generic", 0),
    date: "10 januari 2025",
    variant: "standard",
  },
};

export const MobileView: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: "mobile1" } },
};

// ===== Phase 4 / NewsGrid prop additions =====
//
// The four stories below exist to capture VR baselines for the new
// `aspectRatio` and `rotation` props introduced for `<NewsGrid>` (#1672).
// They are vr-tagged individually rather than via meta.tags so the existing
// 14 legacy NewsCard stories don't get baselined as a side effect.

// Local fixture URLs are deterministic across viewports and runs, so VR
// baselines are stable regardless of upstream width Next.js Image requests.
const phase4SharedArgs = {
  title: "KCVV Elewijt behaalt belangrijke overwinning in Zemst derby",
  href: "/nieuws/derby-overwinning",
  imageUrl: fixtureImage("article-hero-matchverslag", 0),
  badge: "Competitie",
  date: "15 januari 2025",
  variant: "standard" as const,
};

export const Lead: Story = {
  args: {
    ...phase4SharedArgs,
    variant: "featured",
    title: "Spelersvoorstelling seizoen 2025-2026: versterkingen voor debuut",
    aspectRatio: "landscape-16-9",
    rotation: "a",
  },
  tags: ["vr"],
};

export const SquareAspect: Story = {
  args: { ...phase4SharedArgs, aspectRatio: "square" },
  tags: ["vr"],
};

export const PortraitAspect: Story = {
  args: { ...phase4SharedArgs, aspectRatio: "portrait-3-4" },
  tags: ["vr"],
};

// All four rotation slots in one story so reviewers can scan the cycle as a
// unit in Storybook. Matches the `[a, b, c, d]` pool consumed by `<NewsGrid>`
// (#1672) per the locked NewsGrid spec.
//
// Intentionally NOT tagged "vr": cards a (-0.5°) and d (+0.5°) both pull
// `pool[i % 3] = fixture[0]` and carry the largest pool angles. At tablet
// width the grid's `<Image fill sizes="33vw">` resolves to two srcset
// candidates whose selection races between identical CI runs (the bot's
// `vr:ci:update` and the verify `vr:ci` on the same SHA disagreed by ~1.36%,
// concentrated on cards a + d in lockstep). Per-rotation coverage runs
// through `Lead` / `BgCream` / etc. (rotation "a") and the
// `deriveTapeRotations` unit tests (rotations b/c/d). Re-tag when this story
// is split into per-rotation stories with fixed fixtures (#1858).
export const RotationCycle: Story = {
  args: phase4SharedArgs,
  render: () => (
    <div className="grid max-w-5xl grid-cols-2 gap-12 p-12">
      {(["a", "b", "c", "d"] as const).map((r, i) => (
        <NewsCard
          key={r}
          {...phase4SharedArgs}
          rotation={r}
          aspectRatio="landscape-16-9"
          imageUrl={fixtureImage("article-hero-matchverslag", i)}
        />
      ))}
    </div>
  ),
};

// ===== Phase 4.A.2 / paper-card bg variants =====
//
// One story per `<TapedCardBg>` surface so `<NewsGrid>` slot-bg patterns can
// be reviewed against locked baselines without spinning up the full grid.

const bgSharedArgs = {
  ...phase4SharedArgs,
  dek: "Een korte samenvatting van het artikel — drie regels mogelijk voor de paper-card variant.",
  rotation: "a" as const,
};

export const BgCream: Story = {
  args: { ...bgSharedArgs, bg: "cream" },
  tags: ["vr"],
};

export const BgCreamSoft: Story = {
  args: { ...bgSharedArgs, bg: "cream-soft" },
  tags: ["vr"],
};

export const BgJersey: Story = {
  args: { ...bgSharedArgs, bg: "jersey" },
  tags: ["vr"],
};

export const BgJerseyDeep: Story = {
  args: { ...bgSharedArgs, bg: "jersey-deep" },
  tags: ["vr"],
};

export const BgInk: Story = {
  args: { ...bgSharedArgs, bg: "ink" },
  tags: ["vr"],
};

export const FeaturedLead: Story = {
  args: {
    ...bgSharedArgs,
    variant: "featured",
    bg: "cream",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
  },
  tags: ["vr"],
};

export const NoImagePlaceholder: Story = {
  args: { ...bgSharedArgs, bg: "cream", imageUrl: undefined },
  tags: ["vr"],
};

// ===== 5.d-mat-refine Card B — match type kicker =====
//
// matchPreview / matchRecap cards on the news index gain a jersey-deep type
// kicker (dot + label) ahead of the category badge. Match cards sit on cream
// per `card-semantics-locked.md`.

export const MatchRecapType: Story = {
  args: {
    ...bgSharedArgs,
    bg: "cream",
    typeLabel: "Matchverslag",
    title: "KCVV pakt de drie punten in de slotfase.",
  },
  tags: ["vr"],
};

export const MatchPreviewType: Story = {
  args: {
    ...bgSharedArgs,
    bg: "cream",
    typeLabel: "Voorbeschouwing",
    title: "Topper tegen Racing wacht.",
  },
  tags: ["vr"],
};

// Regression guard: a long Dutch compound title in a narrow card must clamp
// cleanly via `line-clamp-3`, with no mid-word hyphen or break. #2549 rule 5
// measured this exact word ("Voorbeschouwing") against the loaded Typekit
// faces and found `hyphens-auto` an inert no-op at every REAL slot width on
// this site (319px+) — every long word already fits a whole line on its own
// there — so the title carries neither `hyphens-auto` nor `break-words` any
// more. That finding does not extend below 319px: at the previous 200px
// canvas (narrower than any real `<NewsCard>` consumer — `<RelatedRow>`'s
// 288px slider slot is the site's narrowest) the word genuinely cannot fit a
// line, so removing the hyphenator produced a real mid-word clip
// ("Voorbesch / op de"). Wrapped at 288px — the narrowest real slot, not an
// arbitrary stress width — so this guard exercises production reality
// instead of a width nothing on the site ever renders at.
export const LongCompoundTitle: Story = {
  args: {
    ...phase4SharedArgs,
    variant: "featured",
    aspectRatio: "landscape-16-9",
    title: "Voorbeschouwing op de competitiestart van het tornooi",
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[288px]">
        <StoryFn />
      </div>
    ),
  ],
  tags: ["vr"],
};

// ===== #2574 — imageless card artefact (#2462 / #2472 / #2485) =====
//
// "A card without a photo shows its own subject's artefact — a team's
// shirt, a club's crest — rather than a generic texture." The hatch stays
// this card's own default (see `NoImagePlaceholder` above) and is still
// correct for the one subject kind with nothing to depict: a document.
// State coverage below is every other subject kind `getCardSubjectArtefact`
// resolves, plus #2472's placeholder-crest state — accepted unchanged, at
// this card's scale, with no detection of any kind.
//
// All new baselines (#2574 ships no change to any existing story above).

const artefactSharedArgs = {
  ...bgSharedArgs,
  imageUrl: undefined,
};

// The real card width these artefacts render into — `<RelatedRow>`'s
// slider slot is `w-72 md:w-80` (288/320px, see RelatedRow.tsx). The
// bare 1440px canvas these stories rendered on before (code review #2574
// finding #4) locked baselines at a card width no page produces — the
// exact gap that let finding #1's inert Tailwind override through
// un-caught. Mirrors the framing `JerseyIllustration.stories.tsx` already
// uses for the same reason.
const ARTEFACT_CARD_DECORATOR: NonNullable<Story["decorators"]> = [
  (StoryFn) => (
    <div className="w-72">
      <StoryFn />
    </div>
  ),
];

export const ArtefactPersonPlayer: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Wie is de nieuwe aanwinst op links?",
    badge: "SPELER",
    artefact: getCardSubjectArtefact({
      kind: "person",
      personType: "player",
      id: "storybook-player-1",
    }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
  tags: ["vr"],
};

/** #2485's amendment — a staff document takes the coat, not the jersey. */
export const ArtefactPersonStaff: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Kennismaking met de nieuwe jeugdcoördinator",
    badge: "STAF",
    artefact: getCardSubjectArtefact({
      kind: "person",
      personType: "staff",
      id: "storybook-staff-1",
    }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
  tags: ["vr"],
};

export const ArtefactTeam: Story = {
  args: {
    ...artefactSharedArgs,
    title: "U14 sluit de heenronde af op de tweede plaats",
    badge: "PLOEG",
    artefact: getCardSubjectArtefact({ kind: "team", ageLabel: "U14" }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
  tags: ["vr"],
};

/** A team subject with no age label — `<JerseyShirt>` renders no chest overlay. */
export const ArtefactTeamNoAgeLabel: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Reserven sluiten af op de vijfde plaats",
    badge: "PLOEG",
    artefact: getCardSubjectArtefact({ kind: "team" }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
  tags: ["vr"],
};

export const ArtefactClubCrest: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Onderlinge geschiedenis tegen KFC Zemst",
    badge: "TEGENSTANDER",
    artefact: getCardSubjectArtefact({
      kind: "club",
      name: "KFC Zemst",
      logoUrl: "/images/logos/clubs/dummy-vert.svg",
    }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
  tags: ["vr"],
};

/**
 * #2472 — PSD's generic grey-shield placeholder, rendered through the exact
 * same `<Crest>` path as a real crest above: no detection, no substitution.
 * `/images/logos/clubs/dummy-grey.svg` stands in for the real PSD asset
 * (out of reach from Storybook) — a flat grey shield with no distinguishing
 * marks, matching #2472's own measurement that every placeholder id hashes
 * identically. The point this story makes is that nothing here looks
 * different from `ArtefactClubCrest` above beyond the source image itself —
 * which is also why it carries no `vr` tag: DESIGN.md's rule says no code
 * will ever distinguish the two, so this baseline cannot regress
 * independently of `ArtefactClubCrest`'s.
 */
export const ArtefactClubPlaceholderCrest: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Onderlinge geschiedenis tegen SK Laar",
    badge: "TEGENSTANDER",
    artefact: getCardSubjectArtefact({
      kind: "club",
      name: "SK Laar",
      logoUrl: "/images/logos/clubs/dummy-grey.svg",
    }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
};

/**
 * A club subject with no logo at all — falls through to `<Crest>`'s own
 * initialled-disc fallback (never invented by `getCardSubjectArtefact`
 * itself). The likeliest real PSD state to actually ship, per #2472's own
 * measurement that a name-only club record is common upstream.
 */
export const ArtefactClubNoLogo: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Onderlinge geschiedenis tegen SK Laar",
    badge: "TEGENSTANDER",
    artefact: getCardSubjectArtefact({ kind: "club", name: "SK Laar" }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
  tags: ["vr"],
};

/**
 * The document path — no artefact, the hatch keeps its job (#2462 rule 2).
 * No `vr` tag: this exercises the same "no image, no artefact → hatch"
 * render path `NoImagePlaceholder` above already guards a baseline for —
 * only the title/badge text differ, which the hatch itself doesn't render.
 */
export const ArtefactDocument: Story = {
  args: {
    ...artefactSharedArgs,
    title: "Nieuw op de website: het clubreglement",
    badge: "PAGINA",
    artefact: getCardSubjectArtefact({ kind: "document" }),
  },
  decorators: ARTEFACT_CARD_DECORATOR,
};
