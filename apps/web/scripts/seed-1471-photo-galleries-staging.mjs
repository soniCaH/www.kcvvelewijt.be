#!/usr/bin/env node
/*
 * apps/web/scripts/seed-1471-photo-galleries-staging.mjs
 *
 * #1471 — seed example `photoGallery` documents so /galerij (list), the
 * /galerij/[slug] lightbox, and the match/event detail gallery sections can be
 * reviewed against real Sanity data. Covers:
 *   - a many-image gallery linked to an event (event-detail section demo)
 *   - a gallery with per-image credits overriding the defaultCredit + a
 *     linkedMatch id (match-detail section demo — set a real PSD id to see it)
 *   - a gallery with a portable-text intro and NO defaultCredit (no-credit path)
 *   - a single-image gallery (degenerate grid / lightbox)
 *
 * Run (from repo root):
 *   pnpm --filter @kcvv/web exec node scripts/seed-1471-photo-galleries-staging.mjs
 *
 * Env:
 *   SANITY_API_TOKEN  — write token (falls back to ~/.config/sanity/config.json)
 *   SANITY_DATASET    — defaults to "staging"; refuses prod unless
 *                       SANITY_ALLOW_PRODUCTION=1
 *
 * Idempotent: createOrReplace on stable `photoGallery-seed-1471-*` ids; images
 * upserted by originalFilename. Cleanup — delete those ids in Studio, or
 * `*[_id match "photoGallery-seed-1471-*"]`.
 */
import { fileURLToPath } from "node:url";
import {
  assertProductionGuard,
  makeClient,
  imageRef,
  upsertImageAsset,
  paragraph,
} from "./seeds/phase-5-shared.mjs";

assertProductionGuard();
const client = makeClient();

const slug = (current) => ({ _type: "slug", current });
const fixturePath = (filename) =>
  fileURLToPath(new URL(`../test/fixtures/images/${filename}`, import.meta.url));

// Upload a fixture image (idempotent by filename) → a gallery-image array item.
async function galleryImage(key, filename, { caption, credit } = {}) {
  const assetId = await upsertImageAsset(client, filename, fixturePath(filename));
  const item = { _key: key, _type: "galleryImage", image: imageRef(assetId) };
  if (caption) item.caption = caption;
  if (credit) item.credit = credit;
  return item;
}

const CROWD = [
  "crowd-atmosphere-2019-08-20-den-beker-van-ons-16-9-ce9a2d.webp",
  "crowd-atmosphere-2020-07-26-covid-19-geen-senior-wedstrij-16-9-bd4fc4.webp",
  "crowd-atmosphere-2022-07-26-beker-van-zemst-2022-16-9-89ad5e.webp",
];
const TEAM = [
  "team-group-2019-07-10-voorstelling-joeri-bonsels-16-9-4b456f.webp",
  "team-group-2019-07-11-neem-zelf-de-leiding-van-kcvv-16-9-1aba14.webp",
  "team-group-2019-07-11-voorstelling-ran-dondeyne-16-9-99049c.webp",
];
const EVENTC = [
  "event-cover-event-drupal-71124c57-cd49-43a8-beeb-c15-16-9-965067.webp",
  "event-cover-event-drupal-c8c38a5e-c6ae-4fa6-b661-833-16-9-140ff7.webp",
];
const MATCH = [
  "match-action-2021-12-17-stemming-speler-van-de-heenro-16-9-daeed8.webp",
  "match-action-2021-12-23-kcvv-versterkt-sportieve-cel--16-9-7745fe.webp",
  "match-action-2022-05-11-kcvv-volgend-seizoen-zonder-w-16-9-72ebfb.webp",
];
const MATCH_P = [
  "match-action-portrait-2021-12-17-stemming-speler-van-de-heenro-3-4-a110c2.webp",
  "match-action-portrait-2021-12-23-kcvv-versterkt-sportieve-cel--3-4-383388.webp",
];
const TRAINING = [
  "training-2020-08-14-covid-19-wedstrijden-opnieuw--16-9-0862b8.webp",
  "training-2020-09-22-herfststage-kcvv-elewijt-u6-t-16-9-505ec1.webp",
];

async function buildImages(prefix, specs) {
  return Promise.all(
    specs.map((s, i) => galleryImage(`${prefix}-${i}`, s.file, s)),
  );
}

async function run() {
  // Prefer a known #1965 event; fall back to the most recent event so the
  // event-detail section has something to render against on staging.
  const linkedEventId =
    (await client.fetch(
      `coalesce(*[_type=="event" && _id=="event-seed-1965-mosselfestijn"][0]._id, *[_type=="event"]|order(_createdAt desc)[0]._id)`,
    )) ?? null;

  const galleries = [
    {
      _id: "photoGallery-seed-1471-mosselfestijn",
      title: "Mosselfestijn 2026 — de beelden",
      slug: slug("mosselfestijn-2026-beelden"),
      publishedAt: "2026-05-06T18:00:00Z",
      defaultCredit: "Foto: Jan Janssens",
      ...(linkedEventId
        ? { linkedEvent: { _type: "reference", _ref: linkedEventId } }
        : {}),
      images: await buildImages("mf", [
        { file: CROWD[0], caption: "Volle kantine bij de start" },
        { file: TEAM[0], caption: "De vrijwilligersploeg" },
        { file: EVENTC[0] },
        { file: CROWD[1], caption: "Sfeer aan de toog" },
        { file: TEAM[1] },
        { file: EVENTC[1], caption: "Borden vol" },
        { file: CROWD[2], credit: "Foto: An Peeters" },
        { file: TEAM[2] },
      ]),
    },
    {
      _id: "photoGallery-seed-1471-zemst",
      title: "3-1 tegen Zemst — sfeerbeelden",
      slug: slug("zemst-derby-2026"),
      publishedAt: "2026-04-12T16:00:00Z",
      defaultCredit: "Foto: Jan Janssens",
      // Placeholder PSD match id — set this to a real /wedstrijd/[id] to see
      // the gallery on that match's detail page.
      linkedMatch: "0",
      images: await buildImages("zb", [
        { file: MATCH[0], caption: "Openingsdoelpunt", credit: "Foto: An Peeters" },
        { file: MATCH_P[0], caption: "Strijd om de bal" },
        { file: MATCH[1], credit: "Foto: An Peeters" },
        { file: MATCH_P[1], caption: "Hoekschop in de slotfase" },
        { file: MATCH[2], caption: "De 3-1", credit: "Foto: Tom Claes" },
        { file: CROWD[2], caption: "Vieren met de supporters" },
      ]),
    },
    {
      _id: "photoGallery-seed-1471-jeugdtornooi",
      title: "Jeugdtornooi U10 — zondagochtend",
      slug: slug("jeugdtornooi-u10-2026"),
      publishedAt: "2026-03-22T09:00:00Z",
      // No defaultCredit + no per-image credit → exercises the no-credit path.
      description: [
        paragraph(
          "jt-intro",
          "Onze U10 ontving acht ploegen voor het jaarlijkse paastornooi. " +
            "Een zonnige ochtend vol voetbalplezier op Sportpark Driesput.",
        ),
      ],
      images: await buildImages("jt", [
        { file: TEAM[0], caption: "Groepsfoto voor de aftrap" },
        { file: TRAINING[0] },
        { file: TEAM[1], caption: "De finale" },
        { file: TRAINING[1] },
        { file: TEAM[2] },
        { file: CROWD[0], caption: "Ouders langs de lijn" },
      ]),
    },
    {
      _id: "photoGallery-seed-1471-bekerwinst",
      title: "Bekerwinst 2022 — één beeld",
      slug: slug("bekerwinst-2022"),
      publishedAt: "2026-02-01T12:00:00Z",
      images: await buildImages("bw", [
        { file: CROWD[2], caption: "Den beker van ons" },
      ]),
    },
  ];

  for (const g of galleries) {
    const res = await client.createOrReplace({ _type: "photoGallery", ...g });
    console.log(
      `✓ ${res._id}  →  /galerij/${g.slug.current}  (${g.images.length} foto's)`,
    );
  }

  console.log(
    `\nSeeded ${galleries.length} galleries into "${client.config().dataset}".`,
  );
  if (linkedEventId) {
    console.log(`Linked the Mosselfestijn gallery to event ${linkedEventId}.`);
  } else {
    console.log("No event found to link — seed events first (#1965) to demo the event section.");
  }
  // Base URL is operator-supplied (the per-branch preview host changes); fall
  // back to the bare path so the hint never points at a stale/dead deployment.
  const base = process.env.SEED_PREVIEW_BASE_URL ?? "";
  console.log(`View: ${base}/galerij`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
