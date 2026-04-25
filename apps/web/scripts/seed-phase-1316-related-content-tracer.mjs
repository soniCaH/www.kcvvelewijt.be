#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-1316-related-content-tracer.mjs
 *
 * Phase 1 tracer for the related-content extension (#1316).
 *
 * Creates (or updates) a tracer article on Sanity staging that proves
 * the architecture for mixed-type curated relatedContent end-to-end:
 *
 *   1. Sanity schema accepts a non-article reference in a single
 *      relatedContent array (here: one player).
 *   2. The GROQ projection in article.repository.ts reads the mixed
 *      array via _type-conditional spreads.
 *   3. The page composes curated + auto-derived sources into one list
 *      via mergeRelatedItems(), with curated entries winning on id
 *      collision.
 *
 * The tracer ALSO links the same player inline in the body via an
 * internalLink mark, so the article exercises both code paths at once
 * — proving dedupe by _id (the player must render exactly once).
 *
 * Idempotent — uses a fixed `_id` so re-running the script updates the
 * existing document instead of creating duplicates.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login` in ~/.config/sanity/config.json.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *   # Player override: SEED_PLAYER_ID skips the auto-pick and uses that document _id.
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-1316-related-content-tracer.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-phase-1316-related-content-tracer
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-phase-1316-related-content-tracer";
const SLUG = "phase-1316-tracer-curated-related-content";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the related-content tracer into production — this " +
      "article is staging-only. Re-run with SANITY_DATASET=staging, or set " +
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

// Pick a player document with a psdId — without psdId the related card
// has no link target. Override with SEED_PLAYER_ID to pin a specific one
// (useful when QA wants the same person across re-runs of the seed).
async function resolvePlayer() {
  const overrideId = process.env.SEED_PLAYER_ID;
  if (overrideId) {
    const player = await client.fetch(
      `*[_type == "player" && _id == $id][0]{_id, firstName, lastName, psdId}`,
      { id: overrideId },
    );
    if (!player) throw new Error(`SEED_PLAYER_ID=${overrideId} not found`);
    if (!player.psdId) {
      throw new Error(`SEED_PLAYER_ID=${overrideId} has no psdId`);
    }
    return player;
  }
  const player = await client.fetch(
    `*[_type == "player" && defined(psdId) && defined(firstName)] | order(lastName asc)[0]{_id, firstName, lastName, psdId}`,
  );
  if (!player) {
    throw new Error(
      "No player documents with psdId found in dataset — seed at least one player first.",
    );
  }
  return player;
}

const label = `[seed-phase-1316-related-content-tracer] dataset=${DATASET}`;
console.log(`${label} upserting ${ARTICLE_ID}…`);

try {
  const player = await resolvePlayer();
  const playerName =
    [player.firstName, player.lastName].filter(Boolean).join(" ") || "speler";
  console.log(
    `${label} curated player _id=${player._id} (${playerName}, psdId=${player.psdId})`,
  );

  const playerRef = { _type: "reference", _ref: player._id };

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "announcement",
    title: "Tracer — gerelateerde inhoud met één gecureerde speler",
    slug: { _type: "slug", current: SLUG },
    publishAt: new Date("2026-04-22T08:00:00Z").toISOString(),
    featured: false,
    tags: ["Eerste ploeg"],
    body: [
      {
        _key: "p1",
        _type: "block",
        style: "normal",
        markDefs: [
          {
            _key: "ref-player",
            _type: "internalLink",
            reference: playerRef,
          },
        ],
        children: [
          {
            _type: "span",
            _key: "p1-s1",
            text: "Dit tracer-artikel verwijst naar ",
          },
          {
            _type: "span",
            _key: "p1-s2",
            text: playerName,
            marks: ["ref-player"],
          },
          {
            _type: "span",
            _key: "p1-s3",
            text: " in de body én cureert dezelfde speler via relatedContent. Het 'Gerelateerd' blok onderaan moet de speler precies één keer tonen — dat bewijst de dedupe-logica.",
          },
        ],
      },
    ],
    relatedContent: [
      {
        _key: "curated-player",
        ...playerRef,
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
