#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-1317-curated-team-and-staff.mjs
 *
 * Phase 2 tracer for the related-content extension (#1317).
 *
 * Extends the Phase 1 (#1316) tracer to prove that team and staffMember
 * references can be curated alongside article and player references in a
 * single `relatedContent` array, and that the dedupe logic still kicks in
 * when the same team/staff is also linked inline in the article body.
 *
 * The article ALSO links the curated team inline via an internalLink mark,
 * so the related strip should render the team exactly once with
 * source: "editorial" (the curated pick wins over the auto-derived
 * mentioned-team).
 *
 * Idempotent — uses a fixed `_id` so re-runs update instead of duplicate.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login` in ~/.config/sanity/config.json.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *   # Override picks:
 *   #   SEED_TEAM_ID   — pin a specific team _id
 *   #   SEED_STAFF_ID  — pin a specific staffMember _id
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-1317-curated-team-and-staff.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-phase-1317-curated-team-and-staff
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-phase-1317-curated-team-and-staff";
const SLUG = "phase-1317-tracer-curated-team-en-staff";

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

async function resolveTeam() {
  const overrideId = process.env.SEED_TEAM_ID;
  if (overrideId) {
    const team = await client.fetch(
      `*[_type == "team" && _id == $id][0]{_id, name, "slug": slug.current}`,
      { id: overrideId },
    );
    if (!team) throw new Error(`SEED_TEAM_ID=${overrideId} not found`);
    if (!team.slug) throw new Error(`SEED_TEAM_ID=${overrideId} has no slug`);
    return team;
  }
  const team = await client.fetch(
    `*[_type == "team" && defined(slug.current) && defined(name) && !(_id in path("drafts.**"))] | order(name asc)[0]{_id, name, "slug": slug.current}`,
  );
  if (!team) {
    throw new Error(
      "No team documents with name+slug found in dataset — sync teams first.",
    );
  }
  return team;
}

async function resolveStaff() {
  const overrideId = process.env.SEED_STAFF_ID;
  if (overrideId) {
    const staff = await client.fetch(
      `*[_type == "staffMember" && _id == $id][0]{_id, firstName, lastName}`,
      { id: overrideId },
    );
    if (!staff) throw new Error(`SEED_STAFF_ID=${overrideId} not found`);
    return staff;
  }
  const staff = await client.fetch(
    `*[_type == "staffMember" && defined(firstName) && !(_id in path("drafts.**"))] | order(lastName asc)[0]{_id, firstName, lastName}`,
  );
  if (!staff) {
    throw new Error(
      "No staffMember documents with firstName found in dataset — seed at least one staff member first.",
    );
  }
  return staff;
}

const label = `[seed-phase-1317-curated-team-and-staff] dataset=${DATASET}`;
console.log(`${label} upserting ${ARTICLE_ID}…`);

try {
  const [team, staff] = await Promise.all([resolveTeam(), resolveStaff()]);
  const staffName =
    [staff.firstName, staff.lastName].filter(Boolean).join(" ") || "staff";
  console.log(`${label} curated team _id=${team._id} (${team.name})`);
  console.log(`${label} curated staff _id=${staff._id} (${staffName})`);

  const teamRef = { _type: "reference", _ref: team._id };
  const staffRef = { _type: "reference", _ref: staff._id };

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "announcement",
    title:
      "Tracer — gerelateerde inhoud met gecureerd team en gecureerde staf",
    slug: { _type: "slug", current: SLUG },
    publishAt: new Date("2026-04-25T08:00:00Z").toISOString(),
    featured: false,
    tags: ["Eerste ploeg"],
    body: [
      {
        _key: "p1",
        _type: "block",
        style: "normal",
        markDefs: [
          {
            _key: "ref-team",
            _type: "internalLink",
            reference: teamRef,
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
            text: team.name,
            marks: ["ref-team"],
          },
          {
            _type: "span",
            _key: "p1-s3",
            text:
              " in de body én cureert hetzelfde team via relatedContent. Het 'Gerelateerd' blok onderaan moet het team precies één keer tonen — dat bewijst de dedupe-logica voor team-referenties.",
          },
        ],
      },
      {
        _key: "p2",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "p2-s1",
            text:
              `Daarnaast wordt ${staffName} expliciet gecureerd via relatedContent zonder body-vermelding — die kaart moet ook verschijnen in de strip 'In dit artikel'.`,
          },
        ],
      },
    ],
    relatedContent: [
      {
        _key: "curated-team",
        ...teamRef,
      },
      {
        _key: "curated-staff",
        ...staffRef,
      },
    ],
  };

  const result = await client.createOrReplace(doc);
  console.log(`${label} ✓ upserted _id=${result._id}`);
  console.log(
    `${label} staging URL: https://staging.kcvvelewijt.be/nieuws/${SLUG}`,
  );
  console.log(
    `${label} delete with: sanity documents delete --dataset=${DATASET} ${ARTICLE_ID}`,
  );
} catch (err) {
  console.error(`${label} ✗ failed`, err);
  process.exit(1);
}
