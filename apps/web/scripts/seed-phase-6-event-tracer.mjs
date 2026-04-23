#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-6-event-tracer.mjs
 *
 * Creates (or updates) a tracer article on Sanity staging that exercises
 * every eventFact variant introduced in Phase 6 (#1332):
 *   - 1 × feature eventFact with full data (title, date, time range,
 *     location, address, age group, CTA, note) → absorbed by the strip
 *   - 1 × overview eventFact with a CTA (custom ticketLabel)
 *   - 1 × overview eventFact without a CTA (null-ticket fallback)
 *   - 1 × overview eventFact without a date (the `Datum volgt` branch)
 *
 * Idempotent — fixed `_id` so re-running updates the existing document.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-6-event-tracer.mjs
 *
 * Token falls back to `~/.config/sanity/config.json` (set by
 * `sanity login`). Refuses to run against the `production` dataset
 * unless `SANITY_ALLOW_PRODUCTION=1` is set explicitly.
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-phase-6-event-tracer
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-phase-6-event-tracer";
const SLUG = "phase-6-tracer-event-moves";

// Stable cover-image placeholder — reuse an existing staging asset
// (one of the player psd images) so the tracer has a 16:9-ish landscape
// on the hero without uploading a dedicated file each seed run. Real
// articles ship an editor-supplied landscape asset used for TV + Facebook.
const COVER_IMAGE_ASSET_REF =
  "image-902b92c6fbed708cec758ed4f5848f0f3d848416-350x350-jpg";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the event tracer into production — this article " +
      "is staging-only. Re-run with SANITY_DATASET=staging, or set " +
      "SANITY_ALLOW_PRODUCTION=1 if you truly meant to write to prod.",
  );
  process.exit(1);
}

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

function noteBlock(key, text) {
  return [
    {
      _key: key,
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `${key}-s`, text }],
    },
  ];
}

// Continuous multi-day overview row. Keeps the same-month range layout
// exercised on the overview stack (as opposed to the strip).
const lentetornooi = {
  _key: "evt-feature",
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
  note: noteBlock(
    "evt-feature-note",
    "Open voor spelers geboren in 2013 en 2014. Twee dagen wedstrijden en finales, met afsluiting op het terras.",
  ),
};

// Overview row — with a custom CTA label.
const afterparty = {
  _key: "evt-afterparty",
  _type: "eventFact",
  title: "Afterparty",
  date: "2026-04-25",
  startTime: "20:00",
  location: "Kantine KCVV",
  competitionTag: "Clubfeest",
  ticketUrl: "https://kcvvelewijt.be/afterparty",
  ticketLabel: "Boek je plek",
};

// Overview row — no CTA, no URL. Exercises the null-ticket fallback.
const training = {
  _key: "evt-training",
  _type: "eventFact",
  title: "Seizoensstart training",
  date: "2026-07-27",
  startTime: "18:30",
  endTime: "20:00",
  location: "Sportpark Elewijt",
  ageGroup: "Senioren",
};

// Feature eventFact — recurring event with per-day schedules. Drives
// the strip: date column shows the `20 – 22 NOV` range, right column
// lists each session (Fri 18:00→22:00, Sat 17:00→23:00, Sun
// 11:30→15:00) at display scale.
const steakfestijn = {
  _key: "evt-steakfestijn",
  _type: "eventFact",
  title: "Steakfestijn 2026",
  location: "Kantine KCVV",
  address: "Driesstraat 14, Elewijt",
  competitionTag: "Clubfeest",
  ticketUrl: "https://kcvvelewijt.be/steakfestijn",
  sessions: [
    {
      _key: "s-fri",
      date: "2026-11-20",
      startTime: "18:00",
      endTime: "22:00",
    },
    {
      _key: "s-sat",
      date: "2026-11-21",
      startTime: "17:00",
      endTime: "23:00",
    },
    {
      _key: "s-sun",
      date: "2026-11-22",
      startTime: "11:30",
      endTime: "15:00",
    },
  ],
};

// Overview row — cross-month multi-day range. Exercises the compact
// `31 JUL – 2 AUG` layout on the overview stack.
const zomerkamp = {
  _key: "evt-zomerkamp",
  _type: "eventFact",
  title: "Jeugdkamp Elewijt",
  date: "2026-07-31",
  endDate: "2026-08-02",
  location: "Sportpark Elewijt",
  ageGroup: "U7 – U11",
  ticketUrl: "https://kcvvelewijt.be/zomerkamp",
};

// Overview row — no date set. Exercises the `Datum volgt` branch.
const openVraag = {
  _key: "evt-tbd",
  _type: "eventFact",
  title: "Jeugd barbecue",
  location: "Kantine KCVV",
  ageGroup: "Alle jeugd",
};

// ─── Execute ─────────────────────────────────────────────────────────────────

const label = `[seed-phase-6-event-tracer] dataset=${DATASET}`;
console.log(`${label} upserting ${ARTICLE_ID}…`);

try {
  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "event",
    title: "Steakfestijn 2026 — drie dagen tafelen voor de club",
    slug: { _type: "slug", current: SLUG },
    // Backdate publishAt so the article clears the GROQ `publishAt <= now()`
    // filter regardless of build/timezone clock drift on the preview.
    publishAt: new Date("2026-04-22T08:00:00Z").toISOString(),
    featured: false,
    tags: ["Jeugd", "Evenementen"],
    coverImage: {
      _type: "image",
      asset: { _type: "reference", _ref: COVER_IMAGE_ASSET_REF },
    },
    body: [
      steakfestijn,
      paragraph(
        "p1",
        "Van vrijdag 20 tot zondag 22 november staat de kantine opnieuw in het teken van het jaarlijkse steakfestijn. Drie dagen vol biefstuk, frietjes en vriendschap — ten voordele van de jeugdwerking.",
      ),
      paragraph(
        "p2",
        "Per sessie zijn er aparte openingsuren. Reserveer op voorhand via de link hierboven; walk-ins zijn welkom zolang er tafels vrij zijn.",
      ),
      // Editor-authored section header — renders via the `.article-body`
      // H2 treatment (green 4 rem × 2 px bar above).
      heading("h-andere-evenementen", "Andere evenementen"),
      lentetornooi,
      afterparty,
      training,
      zomerkamp,
      openVraag,
      paragraph(
        "p3",
        "Meer info bij de jeugdvoorzitter via info@kcvvelewijt.be.",
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
