/*
 * apps/web/scripts/seeds/phase-5-shared.mjs
 *
 * Shared helpers for the Phase 5 closeout seed orchestrator and its four
 * article-type modules. Centralises:
 *   - Sanity client construction (project id, dataset, auth token resolution,
 *     production safety net)
 *   - Portable Text constructors (paragraph, heading, PT title with optional
 *     `accent` decorator, blockquote, multi-respondent qaPair)
 *   - Idempotent asset upsert by `originalFilename`
 *   - Cover-image asset ref reused across every tracer (avoids orphaning
 *     placeholder uploads on each re-seed)
 *
 * All modules import from here; no module talks to `@sanity/client` directly.
 */

import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const PROJECT_ID = "vhb33jaz";
export const DATASET = process.env.SANITY_DATASET ?? "staging";

// Stable cover-image asset ref reused across every Phase 5 tracer. Picked
// from staging so re-runs don't orphan a new upload per article — matches
// the convention established by seed-phase-3b-editorial-hero-variants.mjs.
export const COVER_IMAGE_ASSET_REF =
  "image-902b92c6fbed708cec758ed4f5848f0f3d848416-350x350-jpg";

// Stable opponent-logo placeholder. Uploaded once and re-used on subsequent
// runs via `originalFilename` lookup so re-running the seed doesn't orphan
// new file assets.
export const OPPONENT_LOGO_FILENAME = "seed-phase-5-opponent-logo.png";

// Stable file-attachment placeholder. Reuses an existing public PDF so the
// seed has no external dependencies on operator filesystem state.
export const FILE_ATTACHMENT_FILENAME =
  "seed-phase-5-trainingsschema.pdf";

// Stable PT publish date so re-runs don't bump publication time. Picked
// far enough in the past to clear the `publishedAt <= now()` GROQ filter
// regardless of timezone drift on Vercel preview builds.
export const PUBLISHED_AT = "2026-04-22T08:00:00.000Z";

export function assertProductionGuard() {
  if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
    console.error(
      "Refusing to seed Phase 5 closeout tracers into production — these " +
        "articles are staging-only. Re-run with SANITY_DATASET=staging, or " +
        "set SANITY_ALLOW_PRODUCTION=1 if you truly meant to write to prod.",
    );
    process.exit(1);
  }
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

export function makeClient() {
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2024-01-01",
    token: resolveToken(),
    useCdn: false,
  });
}

// ─── Portable Text helpers ───────────────────────────────────────────────────

export function imageRef(ref) {
  return { _type: "image", asset: { _type: "reference", _ref: ref } };
}

export function fileRef(ref) {
  return { _type: "file", asset: { _type: "reference", _ref: ref } };
}

/** Plain paragraph block with no marks. */
export function paragraph(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  };
}

export function heading(key, text, level = "h2") {
  return {
    _key: key,
    _type: "block",
    style: level,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  };
}

export function blockquote(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "blockquote",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  };
}

/**
 * Constrained Portable Text title with one optional `accent` span. Mirrors
 * the shape `article.title` validates against (single block, normal style,
 * no annotations, accent decorator only).
 */
export function ptTitle({ before = "", accent, after = "", key }) {
  const children = [];
  if (before) {
    children.push({
      _type: "span",
      _key: `${key}-pre`,
      text: before,
      marks: [],
    });
  }
  if (accent) {
    children.push({
      _type: "span",
      _key: `${key}-acc`,
      text: accent,
      marks: ["accent"],
    });
  }
  if (after) {
    children.push({
      _type: "span",
      _key: `${key}-post`,
      text: after,
      marks: [],
    });
  }
  return [
    {
      _type: "block",
      _key: `${key}-block`,
      style: "normal",
      markDefs: [],
      children,
    },
  ];
}

/** Single-respondent answer wrapped in the post-#1795 respondents[] shape. */
export function respondent(key, respondentKey, answerBlocks) {
  const entry = { _key: key, _type: "qaPairRespondent", answer: answerBlocks };
  if (respondentKey) entry.respondentKey = respondentKey;
  return entry;
}

/** Q&A pair compatible with the post-#1795 `respondents[]` schema. */
export function qaPair({ key, question, tag = "standard", respondents }) {
  return {
    _key: key,
    _type: "qaPair",
    question,
    tag,
    respondents,
  };
}

/**
 * Build a `relatedContent` array of article references. Each entry carries
 * a stable `_key` derived from the target article's `_id` so re-runs of
 * the seed don't churn the array order or produce duplicate keys.
 */
export function articleRefs(targetIds) {
  return targetIds.map((id) => ({
    _key: `rel-${id}`,
    _type: "reference",
    _ref: id,
  }));
}

// ─── Asset upserts (idempotent) ──────────────────────────────────────────────

export async function upsertImageAsset(client, filename, sourcePath) {
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $name][0]{_id}`,
    { name: filename },
  );
  if (existing?._id) return existing._id;
  if (!existsSync(sourcePath)) {
    throw new Error(
      `Image source not found at ${sourcePath} (looked up by filename ${filename}).`,
    );
  }
  const buffer = readFileSync(sourcePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

export async function upsertFileAsset(
  client,
  filename,
  sourcePath,
  contentType,
) {
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && originalFilename == $name][0]{_id}`,
    { name: filename },
  );
  if (existing?._id) return existing._id;
  if (!existsSync(sourcePath)) {
    throw new Error(
      `File source not found at ${sourcePath} (looked up by filename ${filename}).`,
    );
  }
  const buffer = readFileSync(sourcePath);
  const asset = await client.assets.upload("file", buffer, {
    filename,
    contentType,
  });
  return asset._id;
}

/**
 * Build the staging URL for a slug. The orchestrator writes these into the
 * #1860 checklist; the grilling sessions then walk each URL in a browser.
 */
export function stagingUrl(slug) {
  return `https://staging.kcvvelewijt.be/nieuws/${slug}`;
}
