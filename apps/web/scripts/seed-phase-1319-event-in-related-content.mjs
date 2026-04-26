#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-1319-event-in-related-content.mjs
 *
 * Phase 4 tracer for the related-content extension (#1319).
 *
 * Creates (or updates) a tracer article on Sanity staging that curates
 * an event in `relatedContent`. Proves end-to-end:
 *
 *   1. Sanity schema accepts an event reference in the relatedContent array.
 *   2. The GROQ projection in article.repository.ts reads the event branch
 *      via _type-conditional spreads.
 *   3. mapCuratedRelatedContent maps the event entry to a RelatedEventItem.
 *   4. RelatedContentSection renders the event card with the "Evenement"
 *      badge and a Calendar-icon date footer, linking to /events/[slug].
 *
 * Idempotent — uses fixed `_id`s so re-runs update existing documents.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login`.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-1319-event-in-related-content.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-phase-1319-event-related-tracer
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-phase-1319-event-related-tracer";
const SLUG = "phase-1319-tracer-event-in-related-content";
const EVENT_ID = "event-phase-1318-detail-tracer";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the related-content event tracer into production — " +
      "this article is staging-only. Re-run with SANITY_DATASET=staging, or " +
      "set SANITY_ALLOW_PRODUCTION=1 if you truly meant to write to prod.",
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

const label = `[seed-phase-1319-event-in-related-content] dataset=${DATASET}`;
console.log(`${label} upserting ${ARTICLE_ID}…`);

try {
  // Resolve the event seeded in #1318. If absent, fall back to any event
  // that has a slug — the test still exercises the code path. The query
  // returns the matched _id string (or undefined when absent), so we use
  // the fetched value directly rather than re-deriving it.
  const existingEventId = await client.fetch(
    `*[_id == $id && _type == "event"][0]._id`,
    { id: EVENT_ID },
  );
  let eventId;
  if (existingEventId) {
    eventId = existingEventId;
    console.log(`${label} curated event _id=${eventId}`);
  } else {
    const fallback = await client.fetch(
      `*[_type == "event" && defined(slug.current)] | order(_updatedAt desc)[0]._id`,
    );
    if (!fallback) {
      throw new Error(
        "No event documents with a slug found in dataset — run the #1318 backfill migration first.",
      );
    }
    eventId = fallback;
    console.log(
      `${label} primary event ${EVENT_ID} not found; using fallback ${fallback}`,
    );
  }

  const eventRef = { _type: "reference", _ref: eventId };

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "announcement",
    title: "Tracer — gerelateerd evenement uit relatedContent",
    slug: { _type: "slug", current: SLUG },
    publishAt: new Date("2026-04-25T08:00:00Z").toISOString(),
    featured: false,
    tags: ["Eerste ploeg"],
    body: [
      {
        _key: "p1",
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "p1-s1",
            text: "Dit tracer-artikel cureert één evenement via relatedContent. Het 'Gerelateerd' blok onderaan moet een evenementkaart tonen met de 'Evenement' badge en een datumvoettekst — en de link moet naar /events/<slug> wijzen.",
          },
        ],
      },
    ],
    relatedContent: [
      {
        _key: "curated-event",
        ...eventRef,
      },
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
