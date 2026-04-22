#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-5-transfer-tracer.mjs
 *
 * Creates (or updates) a tracer article on Sanity staging that exercises
 * every transferFact variant introduced in Phase 5 (#1331):
 *   - 1 × incoming  → powers the hero + horizontal van → naar strip
 *   - 1 × extension → renders as an overview row (with `until`)
 *   - 1 × outgoing with logo → renders as an overview row (amber kicker)
 *   - 1 × outgoing without logo → exercises the null-logo fallback
 *
 * Idempotent — uses a fixed `_id` so re-running the script updates the
 * existing document instead of creating duplicates.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-5-transfer-tracer.mjs
 *
 * The token falls back to `~/.config/sanity/config.json` (set by
 * `sanity login`) when `SANITY_API_TOKEN` is unset — matching the
 * convention used by `scripts/board-cleanup/` and `scripts/staff-cleanup/`.
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-phase-5-transfer-tracer
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-phase-5-transfer-tracer";
const SLUG = "phase-5-tracer-transfer-moves";

// Safety net — refuse to write a tracer article to the production dataset
// unless the operator explicitly opts in. Matches the convention used by
// `scripts/board-cleanup/` and `scripts/staff-cleanup/`.
if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the transfer tracer into production — this article " +
      "is staging-only. Re-run with SANITY_DATASET=staging, or set " +
      "SANITY_ALLOW_PRODUCTION=1 if you truly meant to write to prod.",
  );
  process.exit(1);
}

// Stable placeholder logo — uploaded once and re-used on subsequent runs via
// `originalFilename` lookup so re-running the seed doesn't orphan assets.
const OPPONENT_LOGO_FILENAME = "seed-phase-5-opponent-logo.png";
const OPPONENT_LOGO_SOURCE = join(
  __dirname,
  "..",
  "public",
  "images",
  "logos",
  "kcvv-logo.png",
);

// Stable cover-image placeholder — reuse an existing asset to avoid uploading
// a second file. Pulled from one of the existing player documents on staging
// (a green-on-pattern crop that matches the interview-hero aesthetic).
const COVER_IMAGE_ASSET_REF =
  "image-902b92c6fbed708cec758ed4f5848f0f3d848416-350x350-jpg";

function resolveToken() {
  if (process.env.SANITY_API_TOKEN) return process.env.SANITY_API_TOKEN;
  try {
    const configPath = join(homedir(), ".config", "sanity", "config.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (config.authToken) return config.authToken;
  } catch {
    /* fall through */
  }
  console.error(
    "No Sanity auth token found. Set SANITY_API_TOKEN or run `sanity login`.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  token: resolveToken(),
  useCdn: false,
});

// ─── Body blocks ─────────────────────────────────────────────────────────────

function paragraph(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text }],
  };
}

function heading(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "h2",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text }],
  };
}

function imageRef(ref) {
  return { _type: "image", asset: { _type: "reference", _ref: ref } };
}

function buildBody(opponentLogoRef) {
  // Feature transferFact — absorbed by the hero + strip. Exercises:
  //   - `noteAttribution` override (editorial "Sportieve cel" byline)
  //   - `otherClubContext` + `kcvvContext` subtitles on the strip
  const incomingFeature = {
    _key: "tf-incoming",
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
  };

  // Overview row — extension. Status label reads "tot 2028", no arrow.
  const extensionOverview = {
    _key: "tf-extension",
    _type: "transferFact",
    direction: "extension",
    playerName: "Koen Dewaele",
    position: "Keeper",
    age: 29,
    until: "2028",
    kcvvContext: "Derde Amateur · A-ploeg",
  };

  // Overview row — outgoing with a populated other-club logo. Kicker +
  // arrow in amber.
  const outgoingOverview = {
    _key: "tf-outgoing",
    _type: "transferFact",
    direction: "outgoing",
    playerName: "Bart Peeters",
    position: "Verdediger",
    age: 31,
    otherClubName: "KV Mechelen",
    otherClubLogo: imageRef(opponentLogoRef),
  };

  // Overview row — outgoing without a logo. Exercises the null-logo
  // fallback that is the 95 %-editor case.
  const outgoingOverviewNoLogo = {
    _key: "tf-outgoing-no-logo",
    _type: "transferFact",
    direction: "outgoing",
    playerName: "Sam De Clercq",
    position: "Aanvaller",
    age: 23,
    otherClubName: "KFC Dessel Sport",
  };

  return {
    incomingFeature,
    extensionOverview,
    outgoingOverview,
    outgoingOverviewNoLogo,
  };
}

// ─── Asset upload (idempotent) ───────────────────────────────────────────────

async function upsertOpponentLogoAsset() {
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $name][0]{_id}`,
    { name: OPPONENT_LOGO_FILENAME },
  );
  if (existing?._id) return existing._id;

  const buffer = readFileSync(OPPONENT_LOGO_SOURCE);
  const asset = await client.assets.upload("image", buffer, {
    filename: OPPONENT_LOGO_FILENAME,
  });
  return asset._id;
}

// ─── Execute ─────────────────────────────────────────────────────────────────

const label = `[seed-phase-5-transfer-tracer] dataset=${DATASET}`;
console.log(`${label} upserting ${ARTICLE_ID}…`);

try {
  const opponentLogoRef = await upsertOpponentLogoAsset();
  console.log(`${label} opponent logo asset _id=${opponentLogoRef}`);

  const {
    incomingFeature,
    extensionOverview,
    outgoingOverview,
    outgoingOverviewNoLogo,
  } = buildBody(opponentLogoRef);

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "transfer",
    title: "Transfermoves voor het nieuwe seizoen",
    slug: { _type: "slug", current: SLUG },
    publishAt: new Date("2026-04-22T08:00:00Z").toISOString(),
    featured: false,
    tags: ["Transfers"],
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      incomingFeature,
      paragraph(
        "p1",
        "Met de komst van Maxim Breugelmans legt de sportieve cel een duidelijke lijn in de voorbereiding op het nieuwe seizoen. Breugelmans brengt leiderschap in de as en ervaring op het hoogste amateurniveau.",
      ),
      paragraph(
        "p2",
        "Daarnaast bevestigt de club drie verdere bewegingen: een contractverlenging en twee afscheiden.",
      ),
      // Editor-authored section header — rendered via the `.article-body`
      // H2 treatment (green 4 rem × 2 px bar above).
      heading("h-ander-transfernieuws", "Ander transfernieuws"),
      extensionOverview,
      outgoingOverview,
      outgoingOverviewNoLogo,
      paragraph(
        "p3",
        "De staf bedankt Bart Peeters en Sam De Clercq voor hun seizoenen bij Elewijt en wenst hen veel succes bij hun nieuwe clubs. Keeper Koen Dewaele blijft de nummer 1 tot en met 2028.",
      ),
    ],
  };

  const result = await client.createOrReplace(doc);
  console.log(`${label} ✓ upserted _id=${result._id}`);
  console.log(
    `${label} staging URL: https://staging.kcvvelewijt.be/nieuws/${SLUG}`,
  );
} catch (err) {
  console.error(`${label} ✗ failed`, err);
  process.exit(1);
}
