/**
 * Pages / Article — composition stories per articleType.
 *
 * Mirrors the production composition shipped by
 * `apps/web/src/app/(main)/nieuws/[slug]/page.tsx` (the 5.C rewire,
 * #1800). Each story exercises one articleType through the locked
 * Phase 5 shell:
 *
 *   <EditorialHero variant placement="detail" />
 *   <ArticleMetadata />                       (share + reading-time)
 *   <SanityArticleBody />                     (legacy body renderer; #1829 tracks migration)
 *   <EventDetailBlock />                      (event variant when skip-condition passes)
 *   <ArticleCredits />                        (interview always; others when author/photographer)
 *   <VerderLezenRow items={...} />            (slider of related content)
 *
 * Not vr-tagged per the Phase 0.5 convention — these are page-level
 * compositions covered by Playwright e2e (`tests/e2e/article-detail.spec.ts`)
 * + component-level VR for each underlying primitive.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { fixtureImage } from "@test-fixtures/images";
import { EditorialHero } from "./EditorialHero";
import { ArticleMetadata } from "./ArticleMetadata";
import { ArticleBodyMotion } from "./ArticleBodyMotion";
import { SanityArticleBody } from "./SanityArticleBody/SanityArticleBody";
import { ArticleCredits } from "./ArticleCredits";
import { VerderLezenRow, type VerderLezenItem } from "./VerderLezenRow";
import { EventDetailBlock } from "./blocks/EventDetailBlock";
import type { IndexedSubject } from "./SubjectAttribution";
import type { EventFactValue } from "./blocks/EventFact";
import type { TransferFactValue } from "./blocks/TransferFact";

const meta = {
  title: "Pages/Article",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full /nieuws/[slug] page composition per articleType. Mirrors the 5.C page.tsx switch + sibling blocks. Underlying primitives each carry their own VR coverage; these page stories are autodocs + Playwright-tested, not vr-tagged.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Shared body content ────────────────────────────────────────────────────

const PROSE_LEAD: PortableTextBlock = {
  _type: "block",
  _key: "p-lead",
  style: "normal",
  children: [
    {
      _type: "span",
      _key: "p-lead-c",
      text: "KCVV Elewijt opende de wedstrijd met een vlot ritme en dwong al na een kwartier de eerste echte kans af. Het collectief lag goed in elkaar; trainer Wim Govaerts kreeg eindelijk waar hij maanden naar werkte — een ploeg die durft te voetballen onder druk.",
      marks: [],
    },
  ],
  markDefs: [],
};

const PROSE_BODY: PortableTextBlock = {
  _type: "block",
  _key: "p-body",
  style: "normal",
  children: [
    {
      _type: "span",
      _key: "p-body-c",
      text: "Na de pauze stokte het ritme even, maar het was vooral het verdedigende werk dat opviel: organisatie, kort kop-tegen-kop, en weinig ruimte voor de tegenpartij om gevaarlijk uit de counter te komen.",
      marks: [],
    },
  ],
  markDefs: [],
};

const SHARED_BODY: PortableTextBlock[] = [PROSE_LEAD, PROSE_BODY];

// ─── Subjects + factual blocks ──────────────────────────────────────────────

const COACH_SUBJECT: IndexedSubject = {
  _key: "subj-coach",
  kind: "staff",
  staffRef: {
    firstName: "Wim",
    lastName: "Govaerts",
    functionTitle: "TRAINER",
    photoUrl: fixtureImage("staff-portrait", 0),
  },
};

const EVENT_FACT: EventFactValue = {
  _key: "evt-1",
  _type: "eventFact",
  title: "Steakfestijn 2026",
  date: "2026-09-25",
  endDate: "2026-09-27",
  sessions: [
    { _key: "s1", date: "2026-09-25", startTime: "18:00", endTime: "22:00" },
    { _key: "s2", date: "2026-09-26", startTime: "17:00", endTime: "23:00" },
    { _key: "s3", date: "2026-09-27", startTime: "11:30", endTime: "15:00" },
  ],
  location: "Sportpark Elewijt",
  address: "Driesstraat 14, Elewijt",
  capacity: 250,
  competitionTag: "Clubfeest",
  ticketUrl: "https://kcvvelewijt.be/tickets/steakfestijn",
  ticketLabel: "Bestel je tafel",
};

const TRANSFER_FACT: TransferFactValue = {
  _key: "tf-1",
  _type: "transferFact",
  direction: "incoming",
  playerName: "Maxim Breugelmans",
  position: "Spits",
  age: 21,
  otherClubName: "Tienen",
  kcvvContext: "#9",
};

// ─── Related-content fixtures ───────────────────────────────────────────────

const RELATED_ITEMS: VerderLezenItem[] = [
  {
    title: "Wim Govaerts: 'De kleedkamer is wakker'",
    href: "/nieuws/wim-govaerts-interview",
    imageUrl: fixtureImage("article-hero-interview", 0),
    imageAlt: "Wim Govaerts in de dug-out",
    badge: "INTERVIEW",
    date: "23 mei 2026",
    articleType: "interview",
  },
  {
    title: "Maxim Breugelmans versterkt Elewijt",
    href: "/nieuws/maxim-breugelmans-transfer",
    imageUrl: fixtureImage("article-hero-transfer", 0),
    imageAlt: "Maxim Breugelmans bij zijn aankomst",
    badge: "TRANSFER",
    date: "18 mei 2026",
    articleType: "transfer",
  },
  {
    title: "Algemene vergadering op 12 juni",
    href: "/nieuws/algemene-vergadering-juni",
    imageUrl: fixtureImage("article-hero-generic", 0),
    imageAlt: "Driesstraat 32, hoofdingang",
    badge: "MEDEDELING",
    date: "15 mei 2026",
    articleType: "announcement",
  },
];

const SHARE_CONFIG = {
  url: "https://www.kcvvelewijt.be/nieuws/sample",
  title: "Sample article",
};

// ─── Per-articleType page stories ───────────────────────────────────────────

export const Announcement: Story = {
  render: () => (
    <>
      <EditorialHero
        variant="announcement"
        placement="detail"
        title="Algemene vergadering op 12 juni"
        lead="De jaarlijkse algemene vergadering vindt plaats in de kantine op 12 juni 2026. Stemrecht voor alle aangesloten leden."
        author="Tom Janssens"
        date="15 mei 2026"
        category="Bestuur"
        coverImage={{
          url: fixtureImage("article-hero-generic", 0),
          alt: "Hoofdingang Driesstraat",
        }}
      />
      <ArticleMetadata
        date="15 mei 2026"
        readingTime="2 min lezen"
        shareConfig={SHARE_CONFIG}
        articleType="announcement"
        className="mt-10"
      />
      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        <ArticleBodyMotion>
          <SanityArticleBody className="article-body" content={SHARED_BODY} />
        </ArticleBodyMotion>
      </div>
      <ArticleCredits
        author="Tom Janssens"
        photographer="Karen De Smet"
        publishedAt="2026-05-15T08:00:00.000Z"
      />
      <VerderLezenRow items={RELATED_ITEMS} />
    </>
  ),
};

export const Interview: Story = {
  render: () => (
    <>
      <EditorialHero
        variant="interview"
        placement="detail"
        title="'De kleedkamer is wakker'"
        lead="Trainer Wim Govaerts blikt terug op een seizoen waarin hij vooral mentale slag wist te winnen."
        author="Sofie Berthels"
        date="23 mei 2026"
        subjects={[COACH_SUBJECT]}
        coverImage={{
          url: fixtureImage("article-hero-interview", 0),
          alt: "Wim Govaerts in de dug-out",
        }}
      />
      <ArticleMetadata
        date="23 mei 2026"
        readingTime="6 min lezen"
        shareConfig={SHARE_CONFIG}
        articleType="interview"
        className="mt-10"
      />
      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        <ArticleBodyMotion>
          <SanityArticleBody
            className="article-body"
            content={SHARED_BODY}
            subjects={[COACH_SUBJECT]}
          />
        </ArticleBodyMotion>
      </div>
      <ArticleCredits
        author="Sofie Berthels"
        photographer="Karen De Smet"
        subjects={[COACH_SUBJECT]}
        publishedAt="2026-05-23T08:00:00.000Z"
      />
      <VerderLezenRow items={RELATED_ITEMS} />
    </>
  ),
};

export const Transfer: Story = {
  render: () => (
    <>
      <EditorialHero
        variant="transfer"
        placement="detail"
        title="Maxim Breugelmans versterkt Elewijt"
        lead="De 21-jarige spits ondertekent voor twee seizoenen en komt over van Tienen."
        author="Tom Janssens"
        date="18 mei 2026"
        feature={TRANSFER_FACT}
        coverImage={{
          url: fixtureImage("article-hero-transfer", 0),
          alt: "Maxim Breugelmans bij zijn aankomst",
        }}
      />
      <ArticleMetadata
        date="18 mei 2026"
        readingTime="3 min lezen"
        shareConfig={SHARE_CONFIG}
        articleType="transfer"
        className="mt-10"
      />
      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        <ArticleBodyMotion>
          <SanityArticleBody className="article-body" content={SHARED_BODY} />
        </ArticleBodyMotion>
      </div>
      <ArticleCredits
        author="Tom Janssens"
        photographer="Karen De Smet"
        publishedAt="2026-05-18T08:00:00.000Z"
      />
      <VerderLezenRow items={RELATED_ITEMS} />
    </>
  ),
};

export const Event: Story = {
  render: () => (
    <>
      <EditorialHero
        variant="event"
        placement="detail"
        title="Steakfestijn 2026: drie dagen feest"
        lead="Het Steakfestijn keert terug op 25, 26 en 27 september. Inschrijven kan vanaf morgen."
        author="Tom Janssens"
        date="10 mei 2026"
        feature={EVENT_FACT}
        coverImage={{
          url: fixtureImage("article-hero-evenement", 0),
          alt: "Sportpark Elewijt bij avond",
        }}
      />
      <ArticleMetadata
        date="10 mei 2026"
        readingTime="2 min lezen"
        shareConfig={SHARE_CONFIG}
        articleType="event"
        className="mt-10"
      />
      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        <ArticleBodyMotion>
          <SanityArticleBody className="article-body" content={SHARED_BODY} />
        </ArticleBodyMotion>
      </div>
      <EventDetailBlock value={EVENT_FACT} isPast={false} />
      <ArticleCredits
        author="Tom Janssens"
        photographer="Karen De Smet"
        publishedAt="2026-05-10T08:00:00.000Z"
      />
      <VerderLezenRow items={RELATED_ITEMS} />
    </>
  ),
};

export const EventPast: Story = {
  render: () => (
    <>
      <EditorialHero
        variant="event"
        placement="detail"
        title="Steakfestijn 2026: drie dagen feest"
        lead="Het Steakfestijn vond plaats op 25, 26 en 27 september 2026. Bedankt voor de geweldige opkomst."
        author="Tom Janssens"
        date="28 sep 2026"
        feature={EVENT_FACT}
        coverImage={{
          url: fixtureImage("article-hero-evenement", 0),
          alt: "Sportpark Elewijt bij avond",
        }}
      />
      <ArticleMetadata
        date="28 sep 2026"
        readingTime="2 min lezen"
        shareConfig={SHARE_CONFIG}
        articleType="event"
        className="mt-10"
      />
      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        <ArticleBodyMotion>
          <SanityArticleBody className="article-body" content={SHARED_BODY} />
        </ArticleBodyMotion>
      </div>
      <EventDetailBlock value={EVENT_FACT} isPast={true} />
      <ArticleCredits
        author="Tom Janssens"
        photographer="Karen De Smet"
        publishedAt="2026-09-28T08:00:00.000Z"
      />
      <VerderLezenRow items={RELATED_ITEMS} />
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Same event article rendered after the event end-date. EventDetailBlock swaps the tag pill to 'Afgelopen' and hides the CTA; rest of the card stays readable as a historical record.",
      },
    },
  },
};

// Accent-decorator title — Sanity's constrained-PT `article.title`
// emits an `accent` mark on one or more spans inside the H1, which
// `<EditorialHeading>` renders italic + jersey-deep. #1830 wires
// this through `page.tsx` via `toPortableTextBlocks(article.titleRich)`
// — the page picks the PT shape when present, falling back to plain
// `article.title` otherwise. This story exercises the rich path so
// the visual treatment is reviewable end-to-end.
const ACCENT_TITLE: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "accent-title-block",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: "a1", text: "De ", marks: [] },
      {
        _type: "span",
        _key: "a2",
        text: "wakker-roeper",
        marks: ["accent"],
      },
      { _type: "span", _key: "a3", text: " staat klaar.", marks: [] },
    ],
  } as PortableTextBlock,
];

export const InterviewWithAccentTitle: Story = {
  render: () => (
    <>
      <EditorialHero
        variant="interview"
        placement="detail"
        title={ACCENT_TITLE}
        lead="Trainer Wim Govaerts over de mentale switch die het seizoen kantelde."
        author="Sofie Berthels"
        date="23 mei 2026"
        subjects={[COACH_SUBJECT]}
        coverImage={{
          url: fixtureImage("article-hero-interview", 0),
          alt: "Wim Govaerts in de dug-out",
        }}
      />
      <ArticleMetadata
        date="23 mei 2026"
        readingTime="6 min lezen"
        shareConfig={SHARE_CONFIG}
        articleType="interview"
        className="mt-10"
      />
      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        <ArticleBodyMotion>
          <SanityArticleBody
            className="article-body"
            content={SHARED_BODY}
            subjects={[COACH_SUBJECT]}
          />
        </ArticleBodyMotion>
      </div>
      <ArticleCredits
        author="Sofie Berthels"
        photographer="Karen De Smet"
        subjects={[COACH_SUBJECT]}
        publishedAt="2026-05-23T08:00:00.000Z"
      />
      <VerderLezenRow items={RELATED_ITEMS} />
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Interview article whose H1 carries an `accent` decorator on the substring `wakker-roeper`. `<EditorialHeading>` renders the accented span italic + jersey-deep; the surrounding words stay in the regular H1 treatment. Exercises the `titleRich` → `<EditorialHero title={PT[]}>` path wired at #1830.",
      },
    },
  },
};
