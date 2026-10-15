#!/usr/bin/env node
/*
 * apps/web/scripts/audit-interview-candidates.mjs
 *
 * Read-only companion to the `backfill-article-type` Sanity migration
 * (#1334). Scans articles whose tags suggest an interview and prints a
 * candidate report for editors to review in Studio. Nothing is written
 * — editors decide which candidates get their `articleType` flipped.
 *
 * The migration backfills "announcement" on every legacy article. Tag-
 * signalled interview promotion is intentionally manual: auto-rewriting
 * would lose subject attribution (no way to pick the right player ref)
 * and body structure (bold/italic Q&A needs human re-entry into the
 * `qaBlock` editor). See `docs/editorial/restructuring-legacy-
 * interviews.md` for the one-pager editors follow.
 *
 * Usage (from `apps/web` so @sanity/client resolves via the workspace):
 *
 *   SANITY_DATASET=staging node scripts/audit-interview-candidates.mjs
 *   SANITY_DATASET=production node scripts/audit-interview-candidates.mjs
 *
 * Needs a Sanity read token (`SANITY_API_TOKEN` or `sanity login`) on
 * production — that dataset is private since 2026-10-14, so a tokenless
 * read returns 0 rows without an error. The script exits non-zero when it
 * reads no articles at all.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
if (!process.env.SANITY_DATASET) {
  console.warn(
    "⚠️  SANITY_DATASET not set — defaulting to 'staging'. Set it " +
      "explicitly to avoid surprises (especially before running against " +
      "production).",
  );
}

// Patterns (case-insensitive) that signal "this is probably an
// interview". Keep these lists narrow — false positives here create
// editor-review noise. Refine by running the audit and listening to
// editor feedback. Nederlands + English spellings covered because the
// historical dataset has both.
const INTERVIEW_TAG_PATTERNS = [
  /^interview$/i,
  /^intervieuw$/i,
  /^vraaggesprek$/i,
  /^gesprek met/i,
  /^q&a$/i,
  /^q & a$/i,
];

const INTERVIEW_TITLE_PATTERNS = [
  /\binterview\b/i,
  /\bvraaggesprek\b/i,
  /\bgesprek met\b/i,
];

const INTERVIEW_SLUG_PATTERNS = [/interview/i, /gesprek/i, /vraaggesprek/i];

// Production is private: a tokenless read returns 0 rows without an error.
// Staging stays readable without a token, so only production requires one.
function resolveToken() {
  if (process.env.SANITY_API_TOKEN) return process.env.SANITY_API_TOKEN;
  try {
    const configPath = join(homedir(), ".config", "sanity", "config.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (config.authToken) return config.authToken;
  } catch (err) {
    // ENOENT = no `sanity login` yet. Other errors (malformed JSON,
    // permission denied) should surface loudly.
    if (err?.code !== "ENOENT") {
      console.warn(`⚠️  Could not read Sanity config: ${err.message}`);
    }
  }
  if (DATASET === "production") {
    console.error(
      "No Sanity auth token found. Production is private — set " +
        "SANITY_API_TOKEN or run `sanity login`.",
    );
    process.exit(1);
  }
  return undefined;
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  token: resolveToken(),
  useCdn: false,
});

function isInterviewTag(tag) {
  if (typeof tag !== "string") return false;
  return INTERVIEW_TAG_PATTERNS.some((re) => re.test(tag.trim()));
}

function matchesTitle(title) {
  if (typeof title !== "string") return false;
  return INTERVIEW_TITLE_PATTERNS.some((re) => re.test(title));
}

function matchesSlug(slug) {
  if (typeof slug !== "string") return false;
  return INTERVIEW_SLUG_PATTERNS.some((re) => re.test(slug));
}

function classifySignal(article) {
  if (Array.isArray(article.tags) && article.tags.some(isInterviewTag)) {
    return "tag";
  }
  if (matchesTitle(article.title)) return "title";
  if (matchesSlug(article.slug)) return "slug";
  return null;
}

async function main() {
  // Filter out drafts at the GROQ layer — with a write token, the client
  // returns both published + drafts.* duplicates otherwise.
  const articles = await client.fetch(
    `*[_type == "article" && !(_id in path("drafts.**"))]{
       _id,
       "title": coalesce(title, "(no title)"),
       "slug": slug.current,
       articleType,
       tags,
       publishAt
     } | order(coalesce(publishAt, _createdAt) desc)`,
  );

  if (articles.length === 0) {
    console.error(
      `No articles read from ${DATASET} — missing or unauthorised token? Refusing to report "Nothing to review".`,
    );
    process.exit(1);
  }

  const candidates = articles
    .filter((a) => a.articleType !== "interview")
    .map((a) => ({ ...a, signal: classifySignal(a) }))
    .filter((a) => a.signal !== null);

  console.log("━".repeat(72));
  console.log(`Dataset: ${DATASET}`);
  console.log(`Total articles scanned: ${articles.length}`);
  console.log(
    `Interview candidates (not yet tagged as 'interview'): ${candidates.length}`,
  );
  console.log("━".repeat(72));

  if (candidates.length === 0) {
    console.log("\nNothing to review. ✓\n");
    return;
  }

  console.log(
    "\nReview each candidate in Studio. If it's genuinely an interview,\n" +
      "follow docs/editorial/restructuring-legacy-interviews.md to set\n" +
      "articleType='interview', link the subject, and restructure the\n" +
      "Q&A paragraphs into qaBlock pairs.\n",
  );

  for (const a of candidates) {
    const currentType =
      a.articleType ?? "(unset — will be 'announcement' after migration)";
    const signalDetail =
      a.signal === "tag"
        ? `tag: ${(a.tags ?? []).filter(isInterviewTag).join(", ")}`
        : a.signal === "title"
          ? `title matches interview pattern`
          : `slug matches interview pattern`;
    console.log(`• ${a.title}`);
    console.log(`    slug:         ${a.slug ?? "(no slug)"}`);
    console.log(`    _id:          ${a._id}`);
    console.log(`    current type: ${currentType}`);
    console.log(`    signal:       ${signalDetail}`);
    console.log(`    all tags:     ${(a.tags ?? []).join(", ") || "(none)"}`);
    console.log("");
  }
}

main().catch((err) => {
  console.error("audit-interview-candidates failed:", err);
  process.exit(1);
});
