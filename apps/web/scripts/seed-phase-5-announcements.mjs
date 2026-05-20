#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-5-announcements.mjs
 *
 * Phase 5 closeout — announcement variants module (5 articles):
 *   - tracer-announcement-matrix  — Tier 1 exhaustive announcement body sweep
 *   - announcement-short          — Tier 2 short notice
 *   - announcement-long-form      — Tier 2 long-form with images + video
 *   - announcement-attachment-table — Tier 2 fileAttachment + htmlTable
 *   - announcement-side-transfer  — Tier 2 stretch: side-mention transferFact
 *
 * Exports `seed(client)` returning {key, articleId, slug}[].
 *
 * Standalone usage:
 *   SANITY_API_TOKEN=<token> node scripts/seed-phase-5-announcements.mjs
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COVER_IMAGE_ASSET_REF,
  FILE_ATTACHMENT_FILENAME,
  PUBLISHED_AT,
  assertProductionGuard,
  blockquote,
  fileRef,
  heading,
  imageRef,
  makeClient,
  paragraph,
  ptTitle,
  stagingUrl,
  upsertFileAsset,
} from "./seeds/phase-5-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE_ATTACHMENT_SOURCE = join(
  __dirname,
  "..",
  "public",
  "downloads",
  "insurance_medical_attest_template_nl.pdf",
);

// ─── Article 1 — tracer-announcement-matrix ─────────────────────────────────
//
// Exhaustive sweep — heading + paragraph variants + articleImage (every
// width: prose/wide/bleed) + videoBlock (embed) + fileAttachment + htmlTable
// + blockquote. The announcement body type is the catch-all, so every body
// block belongs in this tracer.

function buildTracerAnnouncementMatrix(fileAssetRef) {
  return {
    _id: "article-phase-5-tracer-announcement-matrix",
    _type: "article",
    articleType: "announcement",
    title: ptTitle({
      before: "Tracer — ",
      accent: "announcement",
      after: " body matrix",
      key: "tam-title",
    }),
    slug: { _type: "slug", current: "phase-5-tracer-announcement-matrix" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Tracer", "Phase 5"],
    author: "Bestuur",
    lead: "Exhaustive sweep van alle body-blokken die in mededelingen voorkomen — koppen, afbeeldingen in drie breedtes, video, bijlage, tabel, en blockquote.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      heading("tam-h-intro", "Inleiding", "h2"),
      paragraph(
        "tam-p1",
        "Dit document loopt alle beschikbare body-blokken in volgorde door. Bedoeld als visueel regressiebed — niet als publicabele tekst.",
      ),

      // articleImage — prose width.
      {
        _key: "tam-img-prose",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Voorbeeld op tekstbreedte (prose).",
        width: "prose",
      },

      heading("tam-h-images", "Afbeeldingen in drie breedtes", "h3"),
      paragraph(
        "tam-p2",
        "De volgende drie blokken tonen dezelfde afbeelding in `prose`, `wide` en `bleed` om de width-token-renderpaths te exerceeren.",
      ),

      // articleImage — wide.
      {
        _key: "tam-img-wide",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Voorbeeld op brede uitsnijding (wide).",
        width: "wide",
      },

      // articleImage — bleed.
      {
        _key: "tam-img-bleed",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Voorbeeld op volledige bleed-breedte.",
        width: "bleed",
      },

      heading("tam-h-video", "Video-embed", "h3"),

      // videoBlock — embed.
      {
        _key: "tam-video",
        _type: "videoBlock",
        embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Optioneel onderschrift — exerceert de caption-rij.",
        width: "wide",
      },

      heading("tam-h-attachment", "Bijlage", "h3"),
      paragraph(
        "tam-p3",
        "De volgende download-knop koppelt naar de bestaande publieke PDF — hergebruikt asset om upload-rouletes te vermijden.",
      ),

      // fileAttachment — exercises the download button.
      {
        _key: "tam-file",
        _type: "fileAttachment",
        file: fileRef(fileAssetRef),
        label: "Download voorbeeldbijlage (PDF)",
      },

      heading("tam-h-table", "HTML-tabel", "h3"),
      paragraph(
        "tam-p4",
        "De volgende tabel komt uit een Drupal-export en wordt as-is gerenderd.",
      ),

      // htmlTable — exercises the table block.
      {
        _key: "tam-table",
        _type: "htmlTable",
        html: `<table>
  <thead>
    <tr><th>Ploeg</th><th>Wedstrijden</th><th>Punten</th></tr>
  </thead>
  <tbody>
    <tr><td>KCVV A</td><td>22</td><td>54</td></tr>
    <tr><td>KCVV B</td><td>22</td><td>41</td></tr>
    <tr><td>KCVV U21</td><td>22</td><td>38</td></tr>
  </tbody>
</table>`,
      },

      heading("tam-h-quote", "Blockquote", "h3"),
      blockquote(
        "tam-quote",
        "Dit is een blockquote-blok — vaak gebruikt voor een uitspraak van een bestuurder of een citaat uit een document.",
      ),

      paragraph(
        "tam-outro",
        "Einde van de matrix. Als je hier alle blokken ziet, is de complete announcement-render-paths gedekt.",
      ),
    ],
  };
}

// ─── Article 2 — announcement-short ─────────────────────────────────────────
//
// Short notice — two paragraphs, no images, no extras. The 80% case.

function buildAnnouncementShort() {
  return {
    _id: "article-phase-5-announcement-short",
    _type: "article",
    articleType: "announcement",
    title: ptTitle({
      before: "Trainingsuren ",
      accent: "aangepast",
      after: " vanaf maandag",
      key: "as-title",
    }),
    slug: { _type: "slug", current: "phase-5-announcement-short" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Mededeling"],
    author: "Bestuur",
    lead: "Vanaf maandag 11 mei verschuiven de A-ploeg-trainingen naar 19:30. Reden: kantineplanning voor het seizoenseinde.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      paragraph(
        "as-p1",
        "De training van maandag- en donderdagavond start vanaf 11 mei een half uur later, om 19:30 in plaats van 19:00. De wijziging geldt tot het einde van het seizoen.",
      ),
      paragraph(
        "as-p2",
        "Reden: de kantine wordt op die avonden gebruikt voor de slotreceptie-voorbereidingen. Vragen kunnen via info@kcvvelewijt.be.",
      ),
    ],
  };
}

// ─── Article 3 — announcement-long-form ─────────────────────────────────────
//
// Long-form with multiple paragraphs, images, and a video embed.

function buildAnnouncementLongForm() {
  return {
    _id: "article-phase-5-announcement-long-form",
    _type: "article",
    articleType: "announcement",
    title: ptTitle({
      before: "Verbouwing kleedkamers — wat ",
      accent: "verandert",
      after: " er deze zomer",
      key: "alf-title",
    }),
    slug: { _type: "slug", current: "phase-5-announcement-long-form" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Mededeling", "Infrastructuur"],
    author: "Bestuur",
    photographer: "KCVV Mediateam",
    lead: "Tussen 1 juli en 15 augustus wordt het kleedkamergebouw volledig vernieuwd. Hieronder de planning, de impact, en wat we van iedereen vragen.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      heading("alf-h-1", "Waarom nu", "h2"),
      paragraph(
        "alf-p1",
        "Het kleedkamergebouw dateert uit 1989. De douches verlieten al een tijdje hun beste jaren, het dak lekte op twee plaatsen, en de elektriciteit kreeg in de wintermaanden niet meer alle keukens warm.",
      ),
      paragraph(
        "alf-p2",
        "Met de subsidies van de provincie en de eigen middelen kunnen we nu het hele gebouw renoveren — niet enkel oplappen. Een verschil dat zich de komende vijftien jaar zal uitbetalen.",
      ),

      {
        _key: "alf-img-1",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Het kleedkamergebouw, voor de werken.",
        width: "wide",
      },

      heading("alf-h-2", "Planning", "h2"),
      paragraph(
        "alf-p3",
        "De werken starten op 1 juli en duren tot ongeveer 15 augustus. In die zes weken zijn de kleedkamers volledig buiten gebruik. We hebben afspraken gemaakt met de Sint-Annaschool voor tijdelijke kleedkamers in hun sporthal — wandelafstand van het sportpark.",
      ),
      paragraph(
        "alf-p4",
        "Trainingsuren blijven ongewijzigd, maar A-ploeg verplaatst de voorbereiding naar het bijveld in Hofstade voor twee weken (KSK Hofstade leent ons zijn infrastructuur — dank daarvoor).",
      ),

      {
        _key: "alf-img-2",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Visualisatie van het vernieuwde kleedkamergebouw.",
        width: "bleed",
      },

      heading("alf-h-3", "Tijdelijk videoplan", "h2"),
      paragraph(
        "alf-p5",
        "Voor wie graag visueel meekijkt: hieronder een korte rondleiding door het architectenbureau over de plannen.",
      ),

      {
        _key: "alf-video",
        _type: "videoBlock",
        embedUrl: "https://vimeo.com/76979871",
        caption: "Toelichting bij de plannen door het architectenbureau.",
        width: "wide",
      },

      heading("alf-h-4", "Wat we vragen", "h2"),
      paragraph(
        "alf-p6",
        "Vrijwilligers welkom voor het ontruimen van de oude kleedkamers (weekend 28-29 juni) en het opnieuw inrichten (weekend 16-17 augustus). Aanmelden via verbouwing@kcvvelewijt.be.",
      ),
    ],
  };
}

// ─── Article 4 — announcement-attachment-table ──────────────────────────────
//
// Announcement built around a fileAttachment + htmlTable — classic
// "trainingsschema voor het nieuwe seizoen" use case.

function buildAnnouncementAttachmentTable(fileAssetRef) {
  return {
    _id: "article-phase-5-announcement-attachment-table",
    _type: "article",
    articleType: "announcement",
    title: ptTitle({
      before: "Trainingsschema 2026-27 — ",
      accent: "download",
      after: " én snel overzicht",
      key: "aat-title",
    }),
    slug: { _type: "slug", current: "phase-5-announcement-attachment-table" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Mededeling", "Jeugd"],
    author: "Jeugdvoorzitter",
    lead: "Het volledige trainingsschema voor het nieuwe seizoen — als bijlage én als overzichtstabel.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      paragraph(
        "aat-p1",
        "Hieronder vinden jullie het volledige trainingsschema voor 2026-27. De PDF bevat de details per ploeg (terrein, coach, doelman-aparte-training). De tabel hieronder is het snelle overzicht.",
      ),

      heading("aat-h-pdf", "Volledig schema", "h2"),
      {
        _key: "aat-file",
        _type: "fileAttachment",
        file: fileRef(fileAssetRef),
        label: "Trainingsschema 2026-27 (PDF)",
      },

      heading("aat-h-table", "Snel overzicht", "h2"),
      {
        _key: "aat-table",
        _type: "htmlTable",
        html: `<table>
  <thead>
    <tr><th>Ploeg</th><th>Maandag</th><th>Woensdag</th><th>Vrijdag</th></tr>
  </thead>
  <tbody>
    <tr><td>U7</td><td>17:00–18:00 (A)</td><td>—</td><td>17:00–18:00 (A)</td></tr>
    <tr><td>U9</td><td>17:30–18:30 (B)</td><td>—</td><td>17:30–18:30 (B)</td></tr>
    <tr><td>U11</td><td>18:00–19:30 (A)</td><td>18:00–19:30 (B)</td><td>18:00–19:30 (A)</td></tr>
    <tr><td>U13</td><td>—</td><td>18:30–20:00 (A)</td><td>18:30–20:00 (A)</td></tr>
    <tr><td>U15</td><td>19:00–20:30 (B)</td><td>—</td><td>19:00–20:30 (B)</td></tr>
    <tr><td>U17</td><td>—</td><td>19:30–21:00 (A)</td><td>19:30–21:00 (A)</td></tr>
  </tbody>
</table>`,
      },

      paragraph(
        "aat-outro",
        "Vragen? Trainingsschema-vragen lopen via je ploegbegeleider; algemene vragen via jeugd@kcvvelewijt.be.",
      ),
    ],
  };
}

// ─── Article 5 — announcement-side-transfer (stretch) ───────────────────────
//
// Stretch: announcement (articleType=announcement) with a side-mention
// transferFact deep in the body — exercises the rare "ik ben een mededeling
// maar wil één transfer-fact tonen" path.

function buildAnnouncementSideTransfer() {
  return {
    _id: "article-phase-5-announcement-side-transfer",
    _type: "article",
    articleType: "announcement",
    title: ptTitle({
      before: "Nieuw seizoen, nieuwe ",
      accent: "trainer",
      after: " — én een eerste handtekening",
      key: "ast-title",
    }),
    slug: { _type: "slug", current: "phase-5-announcement-side-transfer" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Mededeling", "A-ploeg"],
    author: "Bestuur",
    lead: "Tom Geens neemt vanaf juli over als hoofdtrainer van de A-ploeg. Tegelijk bevestigen we ook de eerste binnenkomende speler.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      heading("ast-h-1", "Tom Geens als hoofdtrainer", "h2"),
      paragraph(
        "ast-p1",
        "Na uitvoerige gesprekken met meerdere kandidaten kiest het bestuur voor Tom Geens als opvolger van Marc Vandeput. Geens kent het amateurniveau door en door — vijf seizoenen Berchem Sport, daarvoor drie seizoenen bij KFC Vigor Wuitens Hamme.",
      ),
      paragraph(
        "ast-p2",
        "Geens wordt op 1 juli officieel voorgesteld in de kantine. Volgens hem: rust, ritme, en geen revolutie in de tactische principes.",
      ),

      heading("ast-h-2", "Eerste binnenkomende transfer", "h2"),
      paragraph(
        "ast-p3",
        "Met de aanstelling van Tom Geens bevestigt de sportieve cel ook meteen een eerste binnenkomende transfer voor 2026-27:",
      ),

      // Side-mention transferFact — exercises the in-announcement transfer block.
      {
        _key: "ast-tf",
        _type: "transferFact",
        direction: "incoming",
        playerName: "Jonas Vermeiren",
        position: "Middenvelder",
        age: 24,
        otherClubName: "KSC Lokeren-Temse",
        otherClubContext: "Challenger Pro League",
        kcvvContext: "Derde Amateur · A-ploeg · #14",
      },

      paragraph(
        "ast-p4",
        "Verdere transfers volgen in de komende weken — Geens en de sportieve cel werken aan een lijst van twee à drie extra inkomende beweegingen vóór de zomerstop.",
      ),
    ],
  };
}

// ─── Module entry ────────────────────────────────────────────────────────────

export async function seed(client) {
  const fileAssetRef = await upsertFileAsset(
    client,
    FILE_ATTACHMENT_FILENAME,
    FILE_ATTACHMENT_SOURCE,
    "application/pdf",
  );

  const docs = [
    {
      key: "tracer-announcement-matrix",
      doc: buildTracerAnnouncementMatrix(fileAssetRef),
    },
    { key: "announcement-short", doc: buildAnnouncementShort() },
    { key: "announcement-long-form", doc: buildAnnouncementLongForm() },
    {
      key: "announcement-attachment-table",
      doc: buildAnnouncementAttachmentTable(fileAssetRef),
    },
    {
      key: "announcement-side-transfer",
      doc: buildAnnouncementSideTransfer(),
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
  console.log(`Seeding announcements into ${client.config().dataset}…`);
  const results = await seed(client);
  console.log("\nDone:");
  for (const { slug } of results) console.log(`  ${stagingUrl(slug)}`);
}
