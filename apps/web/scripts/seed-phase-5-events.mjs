#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-5-events.mjs
 *
 * Phase 5 closeout — event variants module (5 articles):
 *   - tracer-event-matrix    — Tier 1 exhaustive eventFact sweep
 *   - event-matchday         — Tier 2 single-day match-day-style
 *   - event-multiday         — Tier 2 multi-day tournament (sessions[])
 *   - event-past-recap       — Tier 2 past event recap
 *   - event-rapid-fire       — Tier 2 stretch: event article with rapid-fire Q&A
 *
 * Exports `seed(client)` returning {key, articleId, slug}[].
 *
 * Standalone usage:
 *   SANITY_API_TOKEN=<token> node scripts/seed-phase-5-events.mjs
 */

import {
  COVER_IMAGE_ASSET_REF,
  PUBLISHED_AT,
  articleRefs,
  assertProductionGuard,
  blockquote,
  heading,
  imageRef,
  makeClient,
  paragraph,
  ptTitle,
  qaPair,
  respondent,
  stagingUrl,
} from "./seeds/phase-5-shared.mjs";

function noteBlocks(key, text) {
  return [paragraph(key, text)];
}

// ─── Article 1 — tracer-event-matrix ────────────────────────────────────────
//
// Exhaustive sweep of every eventFact variant (feature with full data,
// overview with custom CTA, overview without CTA, overview with no date —
// the `Datum volgt` branch, multi-day continuous range, sessions[]
// per-day schedule, cross-month range) plus side blocks (qaSectionDivider,
// articleImage, fileAttachment side-mention).

function buildTracerEventMatrix() {
  return {
    _id: "article-phase-5-tracer-event-matrix",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "Tracer — ",
      accent: "eventFact",
      after: " variant sweep",
      key: "tem-title",
    }),
    slug: { _type: "slug", current: "phase-5-tracer-event-matrix" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Tracer", "Phase 5", "Evenement"],
    author: "Jeugdvoorzitter",
    lead: "Exhaustive sweep van elke eventFact-variant — feature, overview met CTA, zonder CTA, zonder datum, sessies[], en cross-month range.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    // Cross-links so <VerderLezenRow> renders on this tracer.
    relatedContent: articleRefs([
      "article-phase-5-event-matchday",
      "article-phase-5-event-multiday",
      "article-phase-5-event-past-recap",
      "article-phase-5-announcement-short",
    ]),
    body: [
      // Feature eventFact — sessions[] driving the strip.
      {
        _key: "tem-ev-feature",
        _type: "eventFact",
        title: "Steakfestijn 2026",
        location: "Kantine KCVV",
        address: "Driesstraat 14, Elewijt",
        competitionTag: "Clubfeest",
        ticketUrl: "https://kcvvelewijt.be/steakfestijn",
        sessions: [
          {
            _key: "tem-s-fri",
            date: "2026-11-20",
            startTime: "18:00",
            endTime: "22:00",
          },
          {
            _key: "tem-s-sat",
            date: "2026-11-21",
            startTime: "17:00",
            endTime: "23:00",
          },
          {
            _key: "tem-s-sun",
            date: "2026-11-22",
            startTime: "11:30",
            endTime: "15:00",
          },
        ],
        note: noteBlocks(
          "tem-ev-feature-note",
          "Drie dagen vol biefstuk, frietjes en vriendschap — ten voordele van de jeugdwerking.",
        ),
      },
      paragraph(
        "tem-p1",
        "Van vrijdag 20 tot zondag 22 november staat de kantine opnieuw in het teken van het jaarlijkse steakfestijn. Reserveer op voorhand of kom als walk-in zolang er tafels vrij zijn.",
      ),
      heading("tem-h-meer", "Andere evenementen"),

      // Overview — multi-day continuous range (same month).
      {
        _key: "tem-ev-tornooi",
        _type: "eventFact",
        title: "Lentetornooi U13",
        date: "2026-04-25",
        endDate: "2026-04-26",
        startTime: "10:00",
        endTime: "17:00",
        location: "Sportpark Elewijt",
        address: "Driesstraat 14, Elewijt",
        ageGroup: "U13",
        ticketUrl: "https://kcvvelewijt.be/inschrijven",
        ticketLabel: "Inschrijven",
        capacity: 64,
      },

      // Overview — single day with custom CTA label.
      {
        _key: "tem-ev-afterparty",
        _type: "eventFact",
        title: "Afterparty",
        date: "2026-04-25",
        startTime: "20:00",
        location: "Kantine KCVV",
        competitionTag: "Clubfeest",
        ticketUrl: "https://kcvvelewijt.be/afterparty",
        ticketLabel: "Boek je plek",
      },

      // Overview — null-ticket fallback (no URL, no CTA).
      {
        _key: "tem-ev-training",
        _type: "eventFact",
        title: "Seizoensstart training",
        date: "2026-07-27",
        startTime: "18:30",
        endTime: "20:00",
        location: "Sportpark Elewijt",
        ageGroup: "Senioren",
      },

      // Overview — cross-month multi-day range.
      {
        _key: "tem-ev-kamp",
        _type: "eventFact",
        title: "Jeugdkamp Elewijt",
        date: "2026-07-31",
        endDate: "2026-08-02",
        location: "Sportpark Elewijt",
        ageGroup: "U7 – U11",
        ticketUrl: "https://kcvvelewijt.be/zomerkamp",
      },

      // qaSectionDivider — exercises act-divider inside an event article.
      {
        _key: "tem-divider",
        _type: "qaSectionDivider",
        title: ptTitle({
          before: "Praktisch",
          accent: "",
          after: "",
          key: "tem-div",
        }),
        kicker: "INFO · INSCHRIJVEN · CONTACT",
      },

      paragraph(
        "tem-outro",
        "Vragen over een specifiek evenement? De jeugdvoorzitter is bereikbaar via info@kcvvelewijt.be.",
      ),
    ],
  };
}

// ─── Article 2 — event-matchday ─────────────────────────────────────────────
//
// Single-day, single eventFact — typical "kom kijken zaterdag" article.

function buildEventMatchday() {
  return {
    _id: "article-phase-5-event-matchday",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "Topper tegen ",
      accent: "Tisselt",
      after: " — kom mee de boel op stelten zetten",
      key: "ema-title",
    }),
    slug: { _type: "slug", current: "phase-5-event-matchday" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Evenement", "A-ploeg"],
    author: "Redactie",
    lead: "Zaterdagavond 16 mei. Tweede tegen vierde. Een topper die we niet alleen willen spelen.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "ema-ev",
        _type: "eventFact",
        title: "KCVV Elewijt — KFC Tisselt",
        date: "2026-05-16",
        startTime: "19:30",
        endTime: "21:30",
        location: "Sportpark Elewijt",
        address: "Driesstraat 14, Elewijt",
        competitionTag: "Derde Amateur",
        ticketUrl: "https://kcvvelewijt.be/tickets-tisselt",
        ticketLabel: "Bestel tickets",
      },
      paragraph(
        "ema-p1",
        "Drie speeldagen voor het einde van het seizoen, en de kalender bezorgt ons de tweede tegen vierde uit de stand. Een rechtstreeks duel voor de tweede plaats.",
      ),
      paragraph(
        "ema-p2",
        "Tribunes open vanaf 18:30. Kantine open vanaf 18:00 — gezond én ongezond eten beide te verkrijgen.",
      ),
    ],
  };
}

// ─── Article 3 — event-multiday ─────────────────────────────────────────────
//
// Multi-day tournament with per-day sessions[] — exercises the strip's
// per-day schedule rendering.

function buildEventMultiday() {
  return {
    _id: "article-phase-5-event-multiday",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "Pinkstertornooi U11 — drie dagen, ",
      accent: "twaalf",
      after: " ploegen",
      key: "emu-title",
    }),
    slug: { _type: "slug", current: "phase-5-event-multiday" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Evenement", "Jeugd"],
    author: "Jeugdvoorzitter",
    photographer: "KCVV Mediateam",
    lead: "Het jaarlijkse Pinkstertornooi keert terug. Drie dagen voetbal, twaalf gastploegen uit binnen- en buitenland.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "emu-ev",
        _type: "eventFact",
        title: "Pinkstertornooi U11",
        location: "Sportpark Elewijt",
        address: "Driesstraat 14, Elewijt",
        ageGroup: "U11",
        competitionTag: "Tornooi",
        ticketUrl: "https://kcvvelewijt.be/pinkstertornooi",
        ticketLabel: "Inschrijven",
        capacity: 144,
        sessions: [
          {
            _key: "emu-s-1",
            date: "2026-05-22",
            startTime: "16:00",
            endTime: "20:00",
          },
          {
            _key: "emu-s-2",
            date: "2026-05-23",
            startTime: "09:00",
            endTime: "19:00",
          },
          {
            _key: "emu-s-3",
            date: "2026-05-24",
            startTime: "09:00",
            endTime: "16:00",
          },
        ],
        note: noteBlocks(
          "emu-ev-note",
          "Vrijdagavond opening van de poules, zaterdag de groepsfase, zondag halve finales en finale.",
        ),
      },
      paragraph(
        "emu-p1",
        "Twaalf ploegen uit twee landen: KCVV, KV Mechelen, RWDM, KAA Gent, FC Eindhoven, en zeven provinciale ploegen vullen het deelnemersveld.",
      ),
      paragraph(
        "emu-p2",
        "Vrijwilligers welkom — alle hulp aan de kantine, parking en wedstrijdtafels is meer dan welkom. Aanmelden via dezelfde link als de inschrijving.",
      ),
    ],
  };
}

// ─── Article 4 — event-past-recap ───────────────────────────────────────────
//
// Past event recap — uses an eventFact with a date in the past, no CTA.
// Editor-style "wat een dag" recap with an articleImage in the body.

function buildEventPastRecap() {
  return {
    _id: "article-phase-5-event-past-recap",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "Wat een dag — de ",
      accent: "scholentornooi",
      after: " in cijfers",
      key: "epr-title",
    }),
    slug: { _type: "slug", current: "phase-5-event-past-recap" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Evenement", "Recap"],
    author: "Jeugdvoorzitter",
    photographer: "KCVV Mediateam",
    lead: "Zes scholen, 240 leerlingen, achttien wedstrijden op één namiddag — een terugblik in cijfers en beelden.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "epr-ev",
        _type: "eventFact",
        title: "Scholentornooi 2026",
        date: "2026-04-18",
        startTime: "13:00",
        endTime: "17:30",
        location: "Sportpark Elewijt",
        ageGroup: "Lagere school 4 t/m 6",
        competitionTag: "Schoolsport",
      },
      paragraph(
        "epr-p1",
        "Zaterdagnamiddag transformeerden onze velden voor de derde keer in een vat met groene en witte trainingstruitjes. Zes lagere scholen uit de buurt, achttien wedstrijden, en niet één traan over een te zachte voetbalwedstrijd.",
      ),
      {
        _key: "epr-img",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Kinderen vieren een doelpunt op het bijveld tijdens het scholentornooi.",
        width: "wide",
      },
      paragraph(
        "epr-p2",
        "De winnaars: Sint-Hubertus pakte de zesde-jaars-poule, Don Bosco knokte zich naar de overwinning in de vijfde-jaars-poule, en de vierde-jaars hadden vier ex-aequos.",
      ),
      blockquote(
        "epr-q",
        "Volgend jaar opnieuw — zoals altijd. Bedankt aan iedereen die meegewerkt heeft.",
      ),
    ],
  };
}

// ─── Article 5 — event-rapid-fire (stretch) ─────────────────────────────────
//
// Stretch case: event article that ends on a qaBlock with rapid-fire pairs —
// a short interview with the event organiser.

function buildEventRapidFire() {
  const sKey = "erf-subject";
  const rapid = (k, q, a) =>
    qaPair({
      key: `erf-${k}`,
      question: q,
      tag: "rapid-fire",
      respondents: [
        respondent(`erf-${k}-r`, sKey, [paragraph(`erf-${k}-p`, a)]),
      ],
    });

  return {
    _id: "article-phase-5-event-rapid-fire",
    _type: "article",
    articleType: "event",
    title: ptTitle({
      before: "Quiznight — de ",
      accent: "organisator",
      after: " in tien snelle vragen",
      key: "erf-title",
    }),
    slug: { _type: "slug", current: "phase-5-event-rapid-fire" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Evenement", "Quiz"],
    author: "Redactie",
    lead: "Vrijdag 5 juni, eerste editie KCVV-quiznight in de kantine. We vroegen de organisator om alvast te warmen.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    subjects: [
      {
        _key: sKey,
        _type: "subject",
        kind: "custom",
        customName: "Sofie Vandevelde",
        customRole: "Organisator quiznight",
      },
    ],
    body: [
      {
        _key: "erf-ev",
        _type: "eventFact",
        title: "KCVV-quiznight 2026",
        date: "2026-06-05",
        startTime: "20:00",
        endTime: "23:30",
        location: "Kantine KCVV",
        address: "Driesstraat 14, Elewijt",
        competitionTag: "Clubmoment",
        ticketUrl: "https://kcvvelewijt.be/quiznight",
        ticketLabel: "Schrijf je team in",
        capacity: 96,
        note: noteBlocks(
          "erf-ev-note",
          "Ploegen van 4 tot 6 personen. Mengvorm van algemene kennis, voetbal en KCVV-trivia.",
        ),
      },
      paragraph(
        "erf-intro",
        "We vroegen Sofie, die de quiz schrijft en presenteert, om in tien snelle vragen door te lopen wat ons te wachten staat.",
      ),
      {
        _key: "erf-qa",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          rapid("1", "Algemene kennis of voetbalkennis?", "50/50 — niemand wint op één been."),
          rapid("2", "Moeilijkste vragenronde?", "De muziekronde — altijd."),
          rapid("3", "Lievelingsronde om te presenteren?", "De fotoronde van oud-spelers."),
          rapid("4", "Aantal vragen?", "Tien rondes van tien."),
          rapid("5", "Welk team won vorig jaar?", "Er was geen vorig jaar — dit is editie één."),
          rapid("6", "Inschrijfgeld?", "Tien euro per persoon."),
          rapid("7", "Eten?", "Ja — vol bord pasta inbegrepen."),
          rapid("8", "Prijzen?", "Drie levensgrote pokalen + een verrassing."),
          rapid("9", "Tip voor de winnaars?", "Schrijf in voor 20 mei — daarna gaat de inschrijving dicht."),
          rapid("10", "Eén woord dat de avond samenvat?", "Gezellig."),
          qaPair({
            key: "erf-close",
            question: "En als alles tegenvalt?",
            tag: "key",
            respondents: [
              respondent("erf-close-r", sKey, [
                paragraph(
                  "erf-close-p",
                  "Dan staat de bar nog wel open. Dat lost veel op.",
                ),
              ]),
            ],
          }),
        ],
      },
    ],
  };
}

// ─── Module entry ────────────────────────────────────────────────────────────

export async function seed(client) {
  const docs = [
    { key: "tracer-event-matrix", doc: buildTracerEventMatrix() },
    { key: "event-matchday", doc: buildEventMatchday() },
    { key: "event-multiday", doc: buildEventMultiday() },
    { key: "event-past-recap", doc: buildEventPastRecap() },
    { key: "event-rapid-fire", doc: buildEventRapidFire() },
  ];

  const results = [];
  for (const { key, doc } of docs) {
    await client.createOrReplace(doc);
    const slug = doc.slug.current;
    console.log(`  ✓ ${key.padEnd(34)} → /nieuws/${slug}`);
    results.push({ key, articleId: doc._id, slug });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertProductionGuard();
  const client = makeClient();
  console.log(`Seeding events into ${client.config().dataset}…`);
  const results = await seed(client);
  console.log("\nDone:");
  for (const { slug } of results) console.log(`  ${stagingUrl(slug)}`);
}
