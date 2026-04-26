#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-1318-event-detail-tracer.mjs
 *
 * Phase 3 tracer for the related-content extension (#1318).
 *
 * Creates (or updates) an upcoming event document on Sanity staging so
 * the new `/events/[slug]` detail page is reachable end-to-end:
 *
 *   1. The event has a `slug` (added in this PR).
 *   2. Its `dateStart` is in the future, so the event also surfaces in
 *      `sitemap.ts` (which filters `coalesce(dateEnd, dateStart) > now()`).
 *   3. It carries a `coverImage` and an `externalLink` so the hero image
 *      and the optional CTA branches both render.
 *
 * Idempotent — uses a fixed `_id` so re-running updates the existing
 * document instead of creating duplicates. Cover image is reused from
 * an arbitrary existing event so we don't have to upload a new asset.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login` in ~/.config/sanity/config.json.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-1318-event-detail-tracer.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging event-phase-1318-detail-tracer
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const EVENT_ID = "event-phase-1318-detail-tracer";
const SLUG = "phase-1318-tracer-event-detail";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the event detail tracer into production — this " +
      "event is staging-only. Re-run with SANITY_DATASET=staging, or set " +
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

// Reuse a cover image asset from any existing event so the seed doesn't
// have to upload a binary. Falls back to no cover if the dataset has zero
// events with images (unlikely on staging — 77 events were just backfilled).
async function resolveCoverAsset() {
  const result = await client.fetch(
    `*[_type == "event" && defined(coverImage.asset)] | order(_updatedAt desc) [0] {
      "ref": coverImage.asset._ref
    }`,
  );
  return result?.ref ?? null;
}

const label = `[seed-phase-1318-event-detail-tracer] dataset=${DATASET}`;
console.log(`${label} upserting ${EVENT_ID}…`);

try {
  const coverAssetRef = await resolveCoverAsset();
  if (coverAssetRef) {
    console.log(`${label} reusing coverImage asset ${coverAssetRef}`);
  } else {
    console.log(`${label} no existing event cover found — seeding without one`);
  }

  // Two weeks in the future, with a 3-hour window. Using a fixed offset
  // from "now at script run time" keeps the event upcoming whenever the
  // seed is re-run during PR review.
  const start = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  start.setUTCHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const doc = {
    _id: EVENT_ID,
    _type: "event",
    title: "Tracer — eventdetailpagina (#1318)",
    slug: { _type: "slug", current: SLUG },
    dateStart: start.toISOString(),
    dateEnd: end.toISOString(),
    featuredOnHome: false,
    externalLink: {
      url: "https://www.kcvvelewijt.be",
      label: "Bezoek de clubsite",
    },
    ...(coverAssetRef
      ? {
          coverImage: {
            _type: "image",
            asset: { _type: "reference", _ref: coverAssetRef },
          },
        }
      : {}),
  };

  const result = await client.createOrReplace(doc);
  console.log(`${label} ✓ upserted _id=${result._id}`);
  console.log(
    `${label} staging URL: https://staging.kcvvelewijt.be/events/${SLUG}`,
  );
} catch (err) {
  console.error(`${label} ✗ failed`, err);
  process.exit(1);
}
