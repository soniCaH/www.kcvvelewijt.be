#!/usr/bin/env node
/*
 * apps/web/scripts/seed-issue-2122-club-page.mjs
 *
 * Phase 10 (#2122) — seed one generic CMS `page` document so the rebuilt
 * `/club/[slug]` surface (PageHero + ArticleBody) can be verified end-to-end
 * on staging. The body exercises every block the page schema now declares:
 *   - intro paragraph (renders as the <DropCapParagraph>)
 *   - `h2` headings (Freight + warm ".")
 *   - an `articleImage` (width: prose) → <TapedFigure> with caption
 *   - a bullet list
 *   - a `fileAttachment` → <DownloadButton variant="card">
 *
 * The `articleImage` block is authored in its post-migration shape directly,
 * so a freshly-seeded page needs no migration pass to render correctly.
 *
 * Exports `seed(client)` returning {pageId, slug}. Reuses the Phase 5 seed
 * helpers (client construction, asset upsert, PT constructors).
 *
 * Standalone usage (staging is the default dataset):
 *   SANITY_API_TOKEN=<token> node scripts/seed-issue-2122-club-page.mjs
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COVER_IMAGE_ASSET_REF,
  assertProductionGuard,
  fileRef,
  heading,
  imageRef,
  makeClient,
  paragraph,
  upsertFileAsset,
} from "./seeds/phase-5-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PAGE_ID = "page-issue-2122-praktische-info";
const PAGE_SLUG = "praktische-info-2122-seed";

// Reuse an existing public PDF so the seed has no external filesystem deps.
const FILE_ATTACHMENT_FILENAME = "seed-issue-2122-wegbeschrijving.pdf";
const FILE_ATTACHMENT_SOURCE = join(
  __dirname,
  "..",
  "public",
  "downloads",
  "reglement_inwendige_orde_2022.pdf",
);

/** A bullet-list item block (the shared module only ships paragraph/heading). */
function bullet(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  };
}

/** An `articleImage` body block in its post-#2122 shape. */
function articleImage(key, assetRef, alt, width = "prose") {
  return {
    _key: key,
    _type: "articleImage",
    image: imageRef(assetRef),
    alt,
    width,
  };
}

function buildPage(fileAssetRef) {
  return {
    _id: PAGE_ID,
    _type: "page",
    title: "Praktische info",
    slug: { _type: "slug", current: PAGE_SLUG },
    heroImage: imageRef(COVER_IMAGE_ASSET_REF),
    metaDescription:
      "Alles wat je moet weten voor een bezoek aan Sportpark Elewijt — bereikbaarheid, kantine-uren en meer.",
    body: [
      paragraph(
        "p-intro",
        "Alles wat je moet weten voor een bezoek aan Sportpark Elewijt — van bereikbaarheid tot de kantine-uren. Heb je nog vragen? De mensen aan de toog helpen je graag verder.",
      ),
      heading("h-bereik", "Bereikbaarheid"),
      paragraph(
        "p-bereik",
        "Het sportpark ligt aan de Driesstraat in Elewijt. Parkeren kan gratis op het terrein. Met het openbaar vervoer neem je bus 285 tot halte Elewijt Dorp, op vijf minuten wandelen.",
      ),
      articleImage(
        "img-ingang",
        COVER_IMAGE_ASSET_REF,
        "De ingang van Sportpark Elewijt",
      ),
      heading("h-kantine", "Kantine"),
      paragraph(
        "p-kantine",
        "De kantine is open op wedstrijddagen en tijdens trainingen. Een greep uit het aanbod:",
      ),
      bullet("li-1", "Vers getapte pint en frisdrank"),
      bullet("li-2", "Croque, frikandel en de befaamde KCVV-hotdog"),
      bullet("li-3", "Koffie en taart op zondagvoormiddag"),
      {
        _key: "file-wegbeschrijving",
        _type: "fileAttachment",
        file: fileRef(fileAssetRef),
        label: "Wegbeschrijving (PDF)",
      },
    ],
  };
}

export async function seed(client) {
  const fileAssetRef = await upsertFileAsset(
    client,
    FILE_ATTACHMENT_FILENAME,
    FILE_ATTACHMENT_SOURCE,
    "application/pdf",
  );
  const doc = buildPage(fileAssetRef);
  await client.createOrReplace(doc);
  console.log(`  ✓ ${doc.title.padEnd(20)} → /club/${doc.slug.current}`);
  return { pageId: doc._id, slug: doc.slug.current };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertProductionGuard();
  const client = makeClient();
  console.log(`Seeding /club/[slug] CMS page into ${client.config().dataset}…`);
  const { slug } = await seed(client);
  console.log("\nDone:");
  console.log(`  /club/${slug}`);
}
