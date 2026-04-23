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

// Feature eventFact — absorbed by the strip. Exercises every field at
// once so the full visual is on the preview.
const lentetornooi = {
  _key: "evt-feature",
  _type: "eventFact",
  title: "Lentetornooi U13",
  date: "2026-04-25",
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
    "Open voor spelers geboren in 2013 en 2014. Wedstrijden en finales, met afsluiting op het terras.",
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
    title: "Lentetornooi U13 — zaterdag in Elewijt",
    slug: { _type: "slug", current: SLUG },
    // Backdate publishAt so the article clears the GROQ `publishAt <= now()`
    // filter regardless of build/timezone clock drift on the preview.
    publishAt: new Date("2026-04-22T08:00:00Z").toISOString(),
    featured: false,
    tags: ["Jeugd", "Evenementen"],
    body: [
      lentetornooi,
      paragraph(
        "p1",
        "Zaterdag 25 april verwelkomen we acht ploegen voor het traditionele lentetornooi. Vijf velden, vier poules, één grote dag voor de U13-kern.",
      ),
      paragraph(
        "p2",
        "De organisatie voorziet drinken en versnaperingen. Supporters zijn welkom de hele dag door — ook voor de finale om 16u30.",
      ),
      // Editor-authored section header — renders via the `.article-body`
      // H2 treatment (green 4 rem × 2 px bar above).
      heading("h-andere-evenementen", "Andere evenementen"),
      afterparty,
      training,
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
