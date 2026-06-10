#!/usr/bin/env node
/**
 * Creates all 27 KCVV custom dimensions in GA4 via the Analytics Admin API.
 *
 * Prerequisites:
 *   1. gcloud CLI installed and authenticated:
 *      gcloud auth application-default login \
 *        --scopes=https://www.googleapis.com/auth/analytics.edit,https://www.googleapis.com/auth/cloud-platform
 *   2. Analytics Admin API enabled on your GCP project:
 *      https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com
 *
 * Usage:
 *   PROPERTY_ID=530024143 node scripts/create-ga4-dimensions.mjs
 *   node scripts/create-ga4-dimensions.mjs 530024143
 */

import { execSync } from "child_process";

const PROPERTY_ID = process.env.PROPERTY_ID ?? process.argv[2];
if (!PROPERTY_ID) {
  console.error("Error: PROPERTY_ID is required. Provide it as an env var or CLI argument:");
  console.error("  PROPERTY_ID=530024143 node scripts/create-ga4-dimensions.mjs");
  console.error("  node scripts/create-ga4-dimensions.mjs 530024143");
  process.exit(1);
}
const BASE_URL = `https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/customDimensions`;

const dimensions = [
  { parameterName: "role",               displayName: "Role" },
  { parameterName: "query_text",         displayName: "Query text" },
  { parameterName: "query_length",       displayName: "Query length" },
  { parameterName: "results_count",      displayName: "Results count" },
  { parameterName: "path_id",            displayName: "Path ID" },
  { parameterName: "category",           displayName: "Category" },
  { parameterName: "position",           displayName: "Position" },
  { parameterName: "contact_type",       displayName: "Contact type" },
  { parameterName: "dwell_seconds",      displayName: "Dwell seconds" },
  { parameterName: "had_results",        displayName: "Had results" },
  { parameterName: "filter_type",        displayName: "Filter type" },
  { parameterName: "result_type",        displayName: "Result type" },
  { parameterName: "result_title",       displayName: "Result title" },
  { parameterName: "view",               displayName: "Organigram view" },
  { parameterName: "source",             displayName: "Interaction source" },
  { parameterName: "department",         displayName: "Department" },
  { parameterName: "member_id",          displayName: "Member ID" },
  { parameterName: "target_type",        displayName: "Target type" },
  { parameterName: "target_id",          displayName: "Target ID" },
  { parameterName: "source_entity_type", displayName: "Source entity type" },
  { parameterName: "match_id",          displayName: "Match ID" },
  { parameterName: "match_status",      displayName: "Match status" },
  { parameterName: "destination",       displayName: "Destination" },
  { parameterName: "video_source",      displayName: "Video source" },
  { parameterName: "video_provider",    displayName: "Video provider" },
  { parameterName: "video_position",    displayName: "Video position" },
  { parameterName: "event_type",        displayName: "Event type" },
  // Phase 6.D /kalender (#1992/#1995). `view` + `source` reuse the existing
  // params above. `kalender_type` is registered SEPARATELY from `event_type`:
  // it is a superset ("Wedstrijden" ∪ the 4 eventType values), not an eventType.
  { parameterName: "kalender_type",      displayName: "Kalender type" },
  { parameterName: "teams_count",        displayName: "Teams count" },
  { parameterName: "side",               displayName: "Match side" },
  // Phase 7 /jeugd nav hub (#2042) — jeugd_card_click.
  { parameterName: "card_type",          displayName: "Card type" },
  { parameterName: "tag",                displayName: "Card tag" },
  { parameterName: "article_id_hashed",  displayName: "Article ID (hashed)" },
];

let token;
try {
  token = execSync("gcloud auth application-default print-access-token", { stdio: ["pipe", "pipe", "pipe"] })
    .toString()
    .trim();
} catch {
  console.error("Could not get gcloud access token. Run:");
  console.error("  gcloud auth application-default login --scopes=https://www.googleapis.com/auth/analytics.edit,https://www.googleapis.com/auth/cloud-platform");
  process.exit(1);
}

// Preload existing custom dimension parameterNames to skip duplicates
const existingParams = new Set();
try {
  const listRes = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const listData = await listRes.json();
    for (const d of listData.customDimensions ?? []) {
      existingParams.add(d.parameterName);
    }
    if (existingParams.size > 0) {
      console.log(`Found ${existingParams.size} existing custom dimension(s). Skipping duplicates.\n`);
    }
  } else {
    console.warn("Could not list existing dimensions; proceeding without dedup check.\n");
  }
} catch {
  console.warn("Could not list existing dimensions; proceeding without dedup check.\n");
}

console.log(`Creating ${dimensions.length} custom dimensions for property ${PROPERTY_ID}...\n`);

let ok = 0;
let failed = 0;
let skipped = 0;

for (const dim of dimensions) {
  if (existingParams.has(dim.parameterName)) {
    console.log(`  –  ${dim.displayName} (${dim.parameterName}) — already exists, skipped`);
    skipped++;
    continue;
  }

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parameterName: dim.parameterName,
        displayName: dim.displayName,
        scope: "EVENT",
      }),
    });

    if (res.ok) {
      console.log(`  ✓  ${dim.displayName} (${dim.parameterName})`);
      ok++;
    } else {
      let msg;
      try {
        const err = await res.json();
        msg = err?.error?.message ?? res.statusText;
      } catch {
        msg = (await res.text()) || res.statusText;
      }
      console.log(`  ✗  ${dim.displayName} (${dim.parameterName}) — ${res.status}: ${msg}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗  ${dim.displayName} (${dim.parameterName}) — network error: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${ok} created, ${skipped} skipped, ${failed} failed.`);
