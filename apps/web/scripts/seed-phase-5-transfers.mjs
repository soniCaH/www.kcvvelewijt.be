#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-5-transfers.mjs
 *
 * Phase 5 closeout — transfer variants module (5 articles):
 *   - tracer-transfer-matrix    — Tier 1 exhaustive transferFact sweep
 *   - transfer-incoming         — Tier 2 single incoming with hero strip
 *   - transfer-outgoing         — Tier 2 outgoing with full context
 *   - transfer-extension        — Tier 2 contract extension
 *   - transfer-multi            — Tier 2 multi-transfer roundup (3 transferFacts)
 *
 * Exports `seed(client)` returning {key, articleId, slug}[].
 *
 * Standalone usage:
 *   SANITY_API_TOKEN=<token> node scripts/seed-phase-5-transfers.mjs
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COVER_IMAGE_ASSET_REF,
  OPPONENT_LOGO_FILENAME,
  PUBLISHED_AT,
  assertProductionGuard,
  heading,
  imageRef,
  makeClient,
  paragraph,
  ptTitle,
  stagingUrl,
  upsertImageAsset,
} from "./seeds/phase-5-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPPONENT_LOGO_SOURCE = join(
  __dirname,
  "..",
  "public",
  "images",
  "logos",
  "kcvv-logo.png",
);

// ─── Article 1 — tracer-transfer-matrix ─────────────────────────────────────
//
// Exhaustive sweep of every transferFact variant (incoming feature with
// note+attribution, extension, outgoing with logo, outgoing without logo)
// plus side blocks editors sometimes add to a transfer article
// (qaBlock side-mention, eventFact side-mention).

function buildTracerTransferMatrix(opponentLogoRef) {
  return {
    _id: "article-phase-5-tracer-transfer-matrix",
    _type: "article",
    articleType: "transfer",
    title: ptTitle({
      before: "Tracer — ",
      accent: "transferFact",
      after: " variant sweep",
      key: "ttm-title",
    }),
    slug: { _type: "slug", current: "phase-5-tracer-transfer-matrix" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Tracer", "Phase 5", "Transfer"],
    author: "Sportieve cel",
    lead: "Exhaustive sweep van elke transferFact-variant en de zijde-blokken die in transferartikels voorkomen.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      // Hero transferFact — incoming with full note + attribution.
      {
        _key: "ttm-tf-incoming",
        _type: "transferFact",
        direction: "incoming",
        playerName: "Maxim Breugelmans",
        position: "Middenvelder",
        age: 27,
        otherClubName: "Standard Luik",
        otherClubLogo: imageRef(opponentLogoRef),
        otherClubContext: "Jupiler Pro League · U23",
        kcvvContext: "Derde Amateur · A-ploeg · #8",
        note: "Blij om thuis te zijn. Elewijt voelt onmiddellijk vertrouwd.",
        noteAttribution: "Maxim Breugelmans",
      },
      paragraph(
        "ttm-p1",
        "Met de komst van Breugelmans legt de sportieve cel een duidelijke lijn in de voorbereiding op het nieuwe seizoen. Hieronder de overige bewegingen, één per variant.",
      ),
      heading("ttm-h-rest", "Ander transfernieuws"),

      // Overview — extension.
      {
        _key: "ttm-tf-extension",
        _type: "transferFact",
        direction: "extension",
        playerName: "Koen Dewaele",
        position: "Keeper",
        age: 29,
        until: "2028",
        kcvvContext: "Derde Amateur · A-ploeg",
      },

      // Overview — outgoing with logo.
      {
        _key: "ttm-tf-outgoing-logo",
        _type: "transferFact",
        direction: "outgoing",
        playerName: "Bart Peeters",
        position: "Verdediger",
        age: 31,
        otherClubName: "KV Mechelen",
        otherClubLogo: imageRef(opponentLogoRef),
        otherClubContext: "Challenger Pro League",
      },

      // Overview — outgoing without logo (null-logo fallback).
      {
        _key: "ttm-tf-outgoing-no-logo",
        _type: "transferFact",
        direction: "outgoing",
        playerName: "Sam De Clercq",
        position: "Aanvaller",
        age: 23,
        otherClubName: "KFC Dessel Sport",
      },

      // qaBlock side-mention — exercises the rare case of a Q&A inside
      // a transfer article (e.g. a short quote from the sportief manager).
      {
        _key: "ttm-qa",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          {
            _key: "ttm-qa-1",
            _type: "qaPair",
            question: "Wat zoeken jullie deze zomer nog?",
            tag: "standard",
            respondents: [
              {
                _key: "ttm-qa-1-r",
                _type: "qaPairRespondent",
                answer: [
                  paragraph(
                    "ttm-qa-1-p",
                    "Ervaring in de as. Eén of twee jongens die de kern compleet maken.",
                  ),
                ],
              },
            ],
          },
        ],
      },

      // eventFact side-mention — sometimes editors close transfer-windows
      // with a "Presentatieavond" calendar item. The CTA path is exercised
      // here so the tracer surfaces the "Aanmelden" button rendering.
      {
        _key: "ttm-ev",
        _type: "eventFact",
        title: "Presentatieavond nieuwe lichting",
        date: "2026-07-04",
        startTime: "19:30",
        endTime: "21:30",
        location: "Kantine KCVV",
        ageGroup: "Iedereen welkom",
        competitionTag: "Clubmoment",
        ticketUrl: "https://kcvvelewijt.be/presentatieavond",
        ticketLabel: "Aanmelden",
      },

      paragraph(
        "ttm-outro",
        "Meer transfer-updates volgen wanneer het seizoen écht van start gaat. Daarna kunnen we ook met de jongens praten.",
      ),
    ],
  };
}

// ─── Article 2 — transfer-incoming ──────────────────────────────────────────

function buildTransferIncoming(opponentLogoRef) {
  return {
    _id: "article-phase-5-transfer-incoming",
    _type: "article",
    articleType: "transfer",
    title: ptTitle({
      before: "Yannick Vermeulen versterkt de ",
      accent: "verdediging",
      after: "",
      key: "ti-title",
    }),
    slug: { _type: "slug", current: "phase-5-transfer-incoming" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Transfer", "A-ploeg"],
    author: "Sportieve cel",
    lead: "De 26-jarige centrale verdediger tekent voor twee seizoenen. Brengt leiderschap én rust mee.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "ti-fact",
        _type: "transferFact",
        direction: "incoming",
        playerName: "Yannick Vermeulen",
        position: "Verdediger",
        age: 26,
        otherClubName: "KAS Eupen",
        otherClubLogo: imageRef(opponentLogoRef),
        otherClubContext: "Challenger Pro League",
        kcvvContext: "Derde Amateur · A-ploeg · #4",
        note: "Ik wou opnieuw plezier in het voetbal. Elewijt voelt direct als thuis.",
        noteAttribution: "Yannick Vermeulen",
      },
      paragraph(
        "ti-p1",
        "Vermeulen versterkt de defensie waar in het voorjaar nog te vaak kleine fouten werden gemaakt. Hij brengt 90+ wedstrijden ervaring op het hoogste amateurniveau mee.",
      ),
      paragraph(
        "ti-p2",
        "De sportieve cel rondde de deal vrijdagavond af, na drie weken contact. De medische test volgt komende maandag.",
      ),
    ],
  };
}

// ─── Article 3 — transfer-outgoing ──────────────────────────────────────────

function buildTransferOutgoing(opponentLogoRef) {
  return {
    _id: "article-phase-5-transfer-outgoing",
    _type: "article",
    articleType: "transfer",
    title: ptTitle({
      before: "Bedankt en succes — ",
      accent: "Jens",
      after: " kiest voor het buitenland",
      key: "to-title",
    }),
    slug: { _type: "slug", current: "phase-5-transfer-outgoing" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Transfer", "Afscheid"],
    author: "Sportieve cel",
    lead: "Na vier seizoenen Elewijt trekt Jens De Backer naar de Oostenrijkse tweede klasse. Een verhaal van geduld en geluk.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "to-fact",
        _type: "transferFact",
        direction: "outgoing",
        playerName: "Jens De Backer",
        position: "Aanvaller",
        age: 24,
        otherClubName: "SK Sturm Graz II",
        otherClubLogo: imageRef(opponentLogoRef),
        otherClubContext: "Österreichische 2. Liga",
        kcvvContext: "Derde Amateur · A-ploeg · #9",
        note: "Vier jaar Elewijt heeft me gevormd. Tijd voor een volgende stap.",
        noteAttribution: "Jens De Backer",
      },
      paragraph(
        "to-p1",
        "De Backer kwam in 2022 over van de provinciale reeksen en groeide bij KCVV uit tot vaste waarde voorin: 27 doelpunten in vier seizoenen, drie titels onder de tien beste assists van de reeks.",
      ),
      paragraph(
        "to-p2",
        "Sturm Graz II ontdekte hem via een Oostenrijkse scout tijdens de oefencampagne in september. De overgang werd dinsdagavond officieel bevestigd.",
      ),
      paragraph(
        "to-p3",
        "Voor de club is het een mooi verhaal: een speler die binnenkomt zonder grote naam en vertrekt naar het buitenland. De staf bedankt Jens voor vier jaar inzet en wenst hem veel succes.",
      ),
    ],
  };
}

// ─── Article 4 — transfer-extension ─────────────────────────────────────────

function buildTransferExtension() {
  return {
    _id: "article-phase-5-transfer-extension",
    _type: "article",
    articleType: "transfer",
    title: ptTitle({
      before: "Tom blijft tot ",
      accent: "2028",
      after: " bij Elewijt",
      key: "te-title",
    }),
    slug: { _type: "slug", current: "phase-5-transfer-extension" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Transfer", "Verlenging"],
    author: "Sportieve cel",
    lead: "De aanvoerder van de A-ploeg verlengt voor twee extra seizoenen. Continuïteit in de spelersgroep.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      {
        _key: "te-fact",
        _type: "transferFact",
        direction: "extension",
        playerName: "Tom Janssens",
        position: "Middenvelder",
        age: 28,
        until: "einde seizoen 2027-28",
        kcvvContext: "Derde Amateur · A-ploeg · #6 · Aanvoerder",
        note: "Ik weet wat ik hier heb. Dit was geen lange beslissing.",
        noteAttribution: "Tom Janssens",
      },
      paragraph(
        "te-p1",
        "Janssens stond al sinds zijn 16e in groen-wit. De verlenging tot eind seizoen 2027-28 betekent dat hij minimum elf seizoenen in totaal kapitein van de A-ploeg zal zijn.",
      ),
      paragraph(
        "te-p2",
        "De sportieve cel zag het gesprek snel klaargemaakt. Tom kreeg een aanbod, vroeg een week bedenktijd, en zette donderdag zijn handtekening.",
      ),
    ],
  };
}

// ─── Article 5 — transfer-multi (multi-transfer roundup) ────────────────────

function buildTransferMulti(opponentLogoRef) {
  return {
    _id: "article-phase-5-transfer-multi",
    _type: "article",
    articleType: "transfer",
    title: ptTitle({
      before: "Drie nieuwe ",
      accent: "namen",
      after: " voor de zomercampagne",
      key: "tm-title",
    }),
    slug: { _type: "slug", current: "phase-5-transfer-multi" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Transfer", "Roundup"],
    author: "Sportieve cel",
    lead: "Een keeper, een middenvelder en een spits — KCVV bouwt de kern voor 2026-27 verder uit.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      paragraph(
        "tm-intro",
        "Drie tegelijk dit keer. De sportieve cel bevestigt de volgende inkomende transfers, één per linie.",
      ),
      // Hero transferFact — first incoming powers the strip.
      {
        _key: "tm-tf-1",
        _type: "transferFact",
        direction: "incoming",
        playerName: "Robin Claes",
        position: "Keeper",
        age: 25,
        otherClubName: "KV Oostende",
        otherClubLogo: imageRef(opponentLogoRef),
        otherClubContext: "Challenger Pro League",
        kcvvContext: "Derde Amateur · A-ploeg · #1",
        note: "Een ploeg die me uitnodigt om mezelf te zijn — dat zoek ik al een tijd.",
        noteAttribution: "Robin Claes",
      },
      heading("tm-h-meer", "Verder versterkt"),
      // Overview row 2.
      {
        _key: "tm-tf-2",
        _type: "transferFact",
        direction: "incoming",
        playerName: "Pieter Coppens",
        position: "Middenvelder",
        age: 23,
        otherClubName: "RWDM",
        otherClubLogo: imageRef(opponentLogoRef),
        otherClubContext: "Challenger Pro League · U23",
      },
      // Overview row 3 — no logo, exercises null-logo fallback.
      {
        _key: "tm-tf-3",
        _type: "transferFact",
        direction: "incoming",
        playerName: "Dries Vermeersch",
        position: "Aanvaller",
        age: 21,
        otherClubName: "KSV Roeselare",
      },
      paragraph(
        "tm-outro",
        "Met deze drie versterkingen ligt de kern voor het nieuwe seizoen op 24 spelers. Er volgt mogelijk nog één afsluitende transfer, afhankelijk van uitgaande beweging in juli.",
      ),
    ],
  };
}

// ─── Module entry ────────────────────────────────────────────────────────────

export async function seed(client) {
  const opponentLogoRef = await upsertImageAsset(
    client,
    OPPONENT_LOGO_FILENAME,
    OPPONENT_LOGO_SOURCE,
  );

  const docs = [
    {
      key: "tracer-transfer-matrix",
      doc: buildTracerTransferMatrix(opponentLogoRef),
    },
    {
      key: "transfer-incoming",
      doc: buildTransferIncoming(opponentLogoRef),
    },
    {
      key: "transfer-outgoing",
      doc: buildTransferOutgoing(opponentLogoRef),
    },
    {
      key: "transfer-extension",
      doc: buildTransferExtension(),
    },
    {
      key: "transfer-multi",
      doc: buildTransferMulti(opponentLogoRef),
    },
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
  console.log(`Seeding transfers into ${client.config().dataset}…`);
  const results = await seed(client);
  console.log("\nDone:");
  for (const { slug } of results) console.log(`  ${stagingUrl(slug)}`);
}
