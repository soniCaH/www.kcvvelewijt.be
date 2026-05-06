import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PullQuote } from "@/components/design-system/PullQuote";
import { TransferFactStrip } from "@/components/article/blocks/TransferFactStrip";
import { EventFactStrip } from "@/components/article/blocks/EventFactStrip";
import {
  SubjectsStrip,
  type Subject,
} from "@/components/article/blocks/SubjectsStrip";
import { EndMark } from "@/components/design-system/EndMark";
import { EditorialHero, type EditorialHeroProps } from "./EditorialHero";

const meta = {
  title: "Article/EditorialHero",
  component: EditorialHero,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft px-12 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialHero>;

export default meta;
// Storybook's inferred args collapses discriminated unions to `never`,
// so override `args` with the full union — Omit drops the inferred
// shape, then we re-introduce it with the discriminated type.
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args: EditorialHeroProps;
};

const SAMPLE_KICKER = [
  { label: "ANNOUNCEMENT" },
  { label: "8 MIN" },
  { label: "06 MEI 2026" },
];

const SAMPLE_LEAD =
  "Een rustige editorial lead die de toon zet voor het artikel zonder alles te verklappen.";

const COVER = {
  url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&fm=webp&fit=max",
  alt: "Spelers vieren een doelpunt",
};

export const Playground: Story = {
  args: {
    variant: "announcement",
    title: "De zomer van 2026 begint nu.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

/**
 * Phase 3 §5.B.2 announcement-locked.md — the canonical detail-page
 * composition. Kicker reads `★ MEDEDELING · 5 MIN LEZEN · 06 MEI 2026 ★`.
 * Title carries an `accent` decorator on a single word ("kantine") that
 * renders italic + jersey-deep. Byline falls back to the "Door redactie"
 * default. Cover image at 16:9 in the right column.
 */
export const AnnouncementVariant: Story = {
  args: {
    variant: "announcement",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "De ", marks: [] },
          { _type: "span", _key: "t2", text: "kantine", marks: ["accent"] },
          { _type: "span", _key: "t3", text: " blijft open", marks: [] },
        ],
      },
    ],
    lead: "Een korte samenvatting boven het artikel — toont op homepage, news cards, hero en social shares. Kort en krachtig.",
    kicker: [
      { label: "MEDEDELING" },
      { label: "5 MIN LEZEN" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
};

/**
 * Phase 3 §5.B.2 transfer-locked.md — full transfer composition: hero
 * shell + TransferFactStrip below + PullQuote tone="jersey" between
 * strip and body when transferFact.note is set. Kicker reads
 * `★ TRANSFER · 5 MIN LEZEN · 06 MEI 2026 ★`. Title accent on "Standard".
 */
export const TransferVariant: Story = {
  args: {
    variant: "transfer",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "t1",
            text: "Maxim komt over van ",
            marks: [],
          },
          {
            _type: "span",
            _key: "t2",
            text: "Standard",
            marks: ["accent"],
          },
        ],
      },
    ],
    lead: "De 27-jarige middenvelder versterkt de zes. Drie seizoenen handtekening, jeugdig leiderschap voorop.",
    kicker: [
      { label: "TRANSFER" },
      { label: "5 MIN LEZEN" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <TransferFactStrip
        value={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          position: "Middenvelder",
          age: 27,
          otherClubName: "Standard Luik",
          otherClubLogoUrl:
            "https://placehold.co/80x80/d62828/ffffff/svg?text=STD",
          otherClubContext: "Jupiler Pro League · U23",
          kcvvContext: "Derde Amateur · A-ploeg · #8",
          note: "Hier kan ik tonen wat ik in mij heb. KCVV ademt voetbal — dat zegt me alles.",
          noteAttribution: "Maxim Breugelmans",
        }}
      />
      <div className="mx-auto max-w-[680px] py-6">
        <PullQuote tone="jersey" attribution={{ name: "Maxim Breugelmans" }}>
          {
            "Hier kan ik tonen wat ik in mij heb. KCVV ademt voetbal — dat zegt me alles."
          }
        </PullQuote>
      </div>
    </>
  ),
};

/**
 * Outgoing transfer — alert-rode pijlen op de strip (bittersweet).
 * Without a transferFact.note the PullQuote is omitted.
 */
export const TransferVariantOutgoing: Story = {
  args: {
    variant: "transfer",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "t1",
            text: "Jan Janssens trekt naar ",
            marks: [],
          },
          { _type: "span", _key: "t2", text: "Mechelen", marks: ["accent"] },
        ],
      },
    ],
    lead: "Vier seizoenen, 38 doelpunten — onze topscorer kiest voor eerste klasse.",
    kicker: [
      { label: "TRANSFER" },
      { label: "4 MIN LEZEN" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <TransferFactStrip
        value={{
          direction: "outgoing",
          playerName: "Jan Janssens",
          position: "Aanvaller",
          age: 24,
          otherClubName: "KV Mechelen",
          otherClubLogoUrl:
            "https://placehold.co/80x80/ffd60a/000000/svg?text=KVM",
          otherClubContext: "Eerste klasse",
          kcvvContext: "Vier seizoenen, 38 doelpunten",
        }}
      />
    </>
  ),
};

/** Extension — single centered card, no arrows, no PullQuote. */
export const TransferVariantExtension: Story = {
  args: {
    variant: "transfer",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Bram Vermeulen ", marks: [] },
          { _type: "span", _key: "t2", text: "verlengt", marks: ["accent"] },
        ],
      },
    ],
    lead: "Stabiele verdediger blijft tot het einde van seizoen 2027–28. Continuiteit in het hart van de defensie.",
    kicker: [
      { label: "TRANSFER" },
      { label: "3 MIN LEZEN" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <TransferFactStrip
        value={{
          direction: "extension",
          playerName: "Bram Vermeulen",
          position: "Verdediger",
          age: 28,
          until: "2027 — 28",
          kcvvContext: "Derde Amateur · A-ploeg · #4",
        }}
      />
    </>
  ),
};

/**
 * Phase 3 §5.B.2 event-locked.md — full event composition: hero shell +
 * <EventFactStrip> below. Kicker reads `★ EVENT · CLUBFEEST · 06 MEI
 * 2026 ★`. Title accent on "kantine".
 */
export const EventVariant: Story = {
  args: {
    variant: "event",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Steakfestijn in de ", marks: [] },
          { _type: "span", _key: "t2", text: "kantine", marks: ["accent"] },
        ],
      },
    ],
    lead: "Drie dagen lang vlees van de grill, frietjes uit de pan, en het kampioenenelftal in de zaal — vrijdag tot zondag in het clubhuis.",
    kicker: [
      { label: "EVENT" },
      { label: "CLUBFEEST" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <EventFactStrip
        value={{
          date: "2026-11-14",
          startTime: "19:00",
          location: "Clubhuis KCVV",
          address: "Driesstraat 14 · 1982 Elewijt",
          capacity: 80,
          ticketUrl: "https://kcvv.example/inschrijven",
          ticketLabel: "Reserveer",
        }}
      />
    </>
  ),
};

/** Recurring event — sessions[] populated, day-by-day schedule. */
export const EventVariantRecurring: Story = {
  args: {
    variant: "event",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Drie dagen ", marks: [] },
          { _type: "span", _key: "t2", text: "feest", marks: ["accent"] },
          { _type: "span", _key: "t3", text: " in de kantine", marks: [] },
        ],
      },
    ],
    lead: "Vrijdag, zaterdag en zondag — telkens vanaf de middag tot wanneer de laatste fan vertrekt.",
    kicker: [
      { label: "EVENT" },
      { label: "CLUBFEEST" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <EventFactStrip
        value={{
          sessions: [
            {
              _key: "s1",
              date: "2026-11-14",
              startTime: "12:00",
              endTime: "23:00",
            },
            {
              _key: "s2",
              date: "2026-11-15",
              startTime: "12:00",
              endTime: "23:00",
            },
            {
              _key: "s3",
              date: "2026-11-16",
              startTime: "12:00",
              endTime: "20:00",
            },
          ],
          location: "Clubhuis KCVV",
          address: "Driesstraat 14 · 1982 Elewijt",
          capacity: 120,
          ticketUrl: "https://kcvv.example/inschrijven",
          ticketLabel: "Inschrijven",
        }}
        linkedEventSlug="steakfestijn-2026"
      />
    </>
  ),
};

/**
 * Phase 3 §5.B.2 interview-locked.md — full N=1 interview composition:
 * hero shell + SubjectsStrip (single polaroid + pull-quote) + body
 * placeholder + EndMark closer. The QASectionDivider primitive (sub-
 * issue 3.A.4 / #1636) is not shipped yet — its slot is reserved with
 * a comment in the body. Kicker reads `★ INTERVIEW · 8 MIN LEZEN ★`
 * (no format token at N=1; fields.md spec).
 */
const INTERVIEW_PORTRAIT = (label: string, hue: string) =>
  `https://placehold.co/400x500/${hue}/ffffff/svg?text=${encodeURIComponent(label)}`;

const SUBJECT_MAXIM: Subject = {
  _key: "p1",
  kind: "player",
  firstName: "Maxim",
  lastName: "Breugelmans",
  jerseyNumber: 8,
  position: "Middenvelder",
  psdImageUrl: INTERVIEW_PORTRAIT("Maxim", "008755"),
};

const SUBJECT_LIEN: Subject = {
  _key: "s1",
  kind: "staff",
  firstName: "Lien",
  lastName: "De Smet",
  functionTitle: "Hoofdcoach U17",
  photoUrl: INTERVIEW_PORTRAIT("Lien", "1f3a8a"),
};

export const InterviewVariant: Story = {
  args: {
    variant: "interview",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Een gesprek met ", marks: [] },
          { _type: "span", _key: "t2", text: "Maxim", marks: ["accent"] },
        ],
      },
    ],
    lead: "Dertiende seizoen in groen-wit. Over routine, geduld, en de tweede paal.",
    kicker: [{ label: "INTERVIEW" }, { label: "8 MIN LEZEN" }],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <SubjectsStrip
        subjects={[SUBJECT_MAXIM]}
        quote={{
          text: "KCVV ademt voetbal. Hier kan ik tonen wat ik in mij heb.",
          attribution: "Maxim Breugelmans · Middenvelder",
        }}
      />
      <div className="prose mx-auto my-12 max-w-[680px] font-serif text-lg leading-relaxed">
        <p>
          Op een rustige dinsdagavond in het clubhuis vraagt iemand om koffie.
          Het kopje van Maxim staat al op tafel. Hij praat zoals hij speelt —
          rustig, onderbouwd, met een glimlach.
        </p>
        {/* QASectionDivider would land here — sub-issue #1636 (3.A.4) */}
        <p>
          De vragen komen los, het gesprek loopt. Een halfuur later is het
          dossier ingevuld én is duidelijk waarom hij volgend seizoen weer
          centraal staat.
        </p>
      </div>
      <EndMark />
    </>
  ),
};

/** N=2 duo interview — two polaroids with `&` separator, no in-strip pull-quote. */
export const InterviewVariantDuo: Story = {
  args: {
    variant: "interview",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Twee ", marks: [] },
          { _type: "span", _key: "t2", text: "generaties", marks: ["accent"] },
          { _type: "span", _key: "t3", text: " in gesprek", marks: [] },
        ],
      },
    ],
    lead: "Een speler en een coach over wat er sinds 2014 veranderd is — en wat hetzelfde bleef.",
    kicker: [
      { label: "INTERVIEW" },
      { label: "DUO" },
      { label: "10 MIN LEZEN" },
    ],
    coverImage: COVER,
  },
  render: (args) => (
    <>
      <EditorialHero {...(args as EditorialHeroProps)} />
      <SubjectsStrip subjects={[SUBJECT_MAXIM, SUBJECT_LIEN]} />
      <div className="prose mx-auto my-12 max-w-[680px] font-serif text-lg leading-relaxed">
        <p>
          Het verschil tussen een gesprek en een interview is dat in de eerste
          twee mensen luisteren. Vandaag horen we beide.
        </p>
      </div>
      <EndMark />
    </>
  ),
};

export const NoCover: Story = {
  args: {
    variant: "announcement",
    title: "Een korte mededeling zonder visuele begeleiding.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
  },
};

export const NoLead: Story = {
  args: {
    variant: "announcement",
    title: "Headline-only hero met enkel kicker en byline.",
    kicker: SAMPLE_KICKER,
    author: "Tom Janssens",
    coverImage: COVER,
  },
};

export const FallbackByline: Story = {
  args: {
    variant: "announcement",
    title: "Bericht zonder auteur — byline valt terug op redactie.",
    lead: SAMPLE_LEAD,
    kicker: SAMPLE_KICKER,
    coverImage: COVER,
  },
};

// ─── Homepage placement (`placement="homepage"`) ────────────────────────
// Per all 4 *-locked.md files: the hero is wrapped in <a href="/nieuws/{slug}">.
// At rest the composition is identical to the detail variant. On hover
// the card press-ups (translate(-2px, -2px) + grown shadow) and a small
// `★ Lees verder →` hint fades in at the bottom-right. Body content
// (factStrips, Q&A, EndMark) is article-detail-only and does not render
// in homepage placement — the call site is responsible for that gate.

/** Homepage placement — announcement variant. Hover the card to see the hint. */
export const HomepageAnnouncement: Story = {
  args: {
    variant: "announcement",
    placement: "homepage",
    slug: "kantine-blijft-open",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "De ", marks: [] },
          { _type: "span", _key: "t2", text: "kantine", marks: ["accent"] },
          { _type: "span", _key: "t3", text: " blijft open", marks: [] },
        ],
      },
    ],
    lead: "Een korte samenvatting boven het artikel — toont op homepage, news cards, hero en social shares.",
    kicker: [
      { label: "MEDEDELING" },
      { label: "5 MIN LEZEN" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
};

/** Homepage placement — transfer variant. No strip / pull-quote in homepage placement. */
export const HomepageTransfer: Story = {
  args: {
    variant: "transfer",
    placement: "homepage",
    slug: "maxim-komt-over-van-standard",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "t1",
            text: "Maxim komt over van ",
            marks: [],
          },
          { _type: "span", _key: "t2", text: "Standard", marks: ["accent"] },
        ],
      },
    ],
    lead: "De 27-jarige middenvelder versterkt de zes. Drie seizoenen handtekening, jeugdig leiderschap voorop.",
    kicker: [
      { label: "TRANSFER" },
      { label: "5 MIN LEZEN" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
};

/** Homepage placement — event variant. No EventFactStrip in homepage placement. */
export const HomepageEvent: Story = {
  args: {
    variant: "event",
    placement: "homepage",
    slug: "steakfestijn-2026",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Steakfestijn in de ", marks: [] },
          { _type: "span", _key: "t2", text: "kantine", marks: ["accent"] },
        ],
      },
    ],
    lead: "Drie dagen lang vlees van de grill, frietjes uit de pan, en het kampioenenelftal in de zaal.",
    kicker: [
      { label: "EVENT" },
      { label: "CLUBFEEST" },
      { label: "06 MEI 2026" },
    ],
    coverImage: COVER,
  },
};

/** Homepage placement — interview variant. No SubjectsStrip / Q&A / EndMark in homepage placement. */
export const HomepageInterview: Story = {
  args: {
    variant: "interview",
    placement: "homepage",
    slug: "een-gesprek-met-maxim",
    title: [
      {
        _type: "block",
        _key: "title",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "t1", text: "Een gesprek met ", marks: [] },
          { _type: "span", _key: "t2", text: "Maxim", marks: ["accent"] },
        ],
      },
    ],
    lead: "Dertiende seizoen in groen-wit. Over routine, geduld, en de tweede paal.",
    kicker: [{ label: "INTERVIEW" }, { label: "8 MIN LEZEN" }],
    coverImage: COVER,
  },
};
