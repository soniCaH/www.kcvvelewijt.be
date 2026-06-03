#!/usr/bin/env node
/*
 * apps/web/scripts/seed-1968-merged-events-staging.mjs
 *
 * Phase 6.E (#1968) — seed example `articleType:event` ARTICLES so the merged
 * /evenementen feed can be reviewed against real Sanity data. With #1968,
 * upcoming event docs AND upcoming event articles share the one month-grouped
 * <TicketStub> list; the article tickets link to `/nieuws/[slug]` (not
 * `/evenementen/[slug]`), and their tear-off date block is colour-coded by the
 * NEW `eventFact.eventType` enum.
 *
 * Pair this with `seed-1965-events-staging.mjs` (event docs) to see both
 * sources interleaved chronologically in one feed:
 *   - event doc "Spaghetti-avond" (Clubevent, 12 Sep) → /evenementen/[slug]
 *   - this article "Najaarstornooi U13" (Jeugdwerking, 19 Sep) → /nieuws/[slug]
 *   - event doc "Supportersweekend" (Supportersactiviteit, 25 Sep) → /evenementen/[slug]
 *
 * Both articles carry an `eventFact` with a top-level `date` (required by the
 * schema and the field the feed query reads), a future date (upcoming-only),
 * an `eventType` (the colour code), and `startTime` + `location` (the meta line).
 *
 * Run (from repo root):
 *   pnpm --filter @kcvv/web exec node scripts/seed-1968-merged-events-staging.mjs
 *
 * Env:
 *   SANITY_API_TOKEN  — write token (falls back to ~/.config/sanity/config.json)
 *   SANITY_DATASET    — defaults to "staging"; refuses prod unless
 *                       SANITY_ALLOW_PRODUCTION=1
 *
 * Idempotent: createOrReplace on stable `article-seed-1968-*` ids. Cleanup —
 * delete those ids in Studio, or `*[_id match "article-seed-1968-*"]`.
 */
import {
  COVER_IMAGE_ASSET_REF,
  PUBLISHED_AT,
  assertProductionGuard,
  imageRef,
  makeClient,
  paragraph,
  ptTitle,
} from "./seeds/phase-5-shared.mjs";

assertProductionGuard();
const client = makeClient();

const slug = (current) => ({ _type: "slug", current });

const articles = [
  // Jeugdwerking · timed · location — interleaves with the #1965 September
  // event docs; ticket links to /nieuws/[slug], not /evenementen/[slug].
  {
    _id: "article-seed-1968-najaarstornooi",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "Schrijf je in voor het ",
      accent: "najaarstornooi",
      after: " U13",
      key: "seed-1968-tornooi-title",
    }),
    slug: slug("najaarstornooi-u13-2026"),
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Jeugd", "Evenement"],
    author: "Jeugdbestuur",
    lead: "Een hele zaterdag voetbalplezier op Sportpark Driesput — ploegen uit de hele regio zakken af naar Elewijt.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "seed-1968-tornooi-fact",
        _type: "eventFact",
        title: "Najaarstornooi U13",
        eventType: "Jeugdwerking",
        date: "2026-09-19",
        startTime: "10:00",
        endTime: "17:00",
        location: "Sportpark Driesput, Elewijt",
        address: "Driesstraat 14, Elewijt",
        ageGroup: "U13",
        ticketUrl: "https://kcvvelewijt.be/inschrijven/najaarstornooi",
        ticketLabel: "Inschrijven",
      },
      paragraph(
        "seed-1968-tornooi-p1",
        "Acht ploegen, één dag, en de gebruikelijke portie frietjes en supporters langs de lijn. Inschrijven kan per ploeg via de link hierboven.",
      ),
    ],
  },
  // Supportersactiviteit · timed · location — a second month (October) so the
  // article appears under its own month heading in the merged list.
  {
    _id: "article-seed-1968-supportersquiz",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "De grote ",
      accent: "supportersquiz",
      after: " keert terug",
      key: "seed-1968-quiz-title",
    }),
    slug: slug("supportersquiz-2026"),
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Supporters", "Evenement"],
    author: "Supportersclub",
    lead: "Stel je ploeg samen en strijd mee om de wisselbeker tijdens de jaarlijkse quizavond in de kantine.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "seed-1968-quiz-fact",
        _type: "eventFact",
        title: "Supportersquiz 2026",
        eventType: "Supportersactiviteit",
        date: "2026-10-17",
        startTime: "19:30",
        location: "Kantine KCVV, Elewijt",
        address: "Driesstraat 14, Elewijt",
        ticketUrl: "https://kcvvelewijt.be/quiz",
        ticketLabel: "Schrijf je ploeg in",
        capacity: 120,
      },
      paragraph(
        "seed-1968-quiz-p1",
        "Tien rondes, één winnaar, en de eer om een jaar lang met de wisselbeker te pronken. Ploegen tot zes personen.",
      ),
    ],
  },
];

async function run() {
  for (const doc of articles) {
    const res = await client.createOrReplace(doc);
    console.log(`✓ ${res._id}  →  /nieuws/${doc.slug.current}`);
  }
  console.log(
    `\nSeeded ${articles.length} event articles into "${client.config().dataset}".`,
  );
  console.log("View the merged feed: https://staging.kcvvelewijt.be/evenementen");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
