#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-5-closeout.mjs
 *
 * Phase 5 closeout — orchestrator (issue #1864).
 *
 * Runs the four article-type modules in sequence (interview, transfer,
 * event, announcement), collects 20 {key, articleId, slug} entries, and
 * rewrites the GitHub issue #1860 master-checklist body so each
 * `- [ ] <label> — _staging URL TBD_` line now points at the live
 * staging URL. Idempotent — re-runs produce identical issue body.
 *
 * Usage (from `apps/web`):
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-5-closeout.mjs
 *
 * Flags:
 *   --skip-issue-update      Seed Sanity but skip the gh issue edit. Useful
 *                            when iterating on the modules without touching
 *                            #1860 every run.
 *
 * Production safety: refuses to run when SANITY_DATASET=production unless
 * SANITY_ALLOW_PRODUCTION=1 is also set.
 *
 * GitHub requirement: `gh` CLI must be installed and authenticated against
 * the soniCaH/www.kcvvelewijt.be repository. The checklist update is a
 * no-op (no errors, just a console warning) when --skip-issue-update is on.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertProductionGuard,
  makeClient,
  stagingUrl,
} from "./seeds/phase-5-shared.mjs";
import { seed as seedInterviews } from "./seed-phase-5-interviews.mjs";
import { seed as seedTransfers } from "./seed-phase-5-transfers.mjs";
import { seed as seedEvents } from "./seed-phase-5-events.mjs";
import { seed as seedAnnouncements } from "./seed-phase-5-announcements.mjs";

const TRACKER_ISSUE = "1860";

// Mapping module-result `key` → the exact label text on the #1860
// checklist line (without the leading `- [ ] ` and without the trailing
// ` — <url>`). Must match the source bullet text character-for-character.
const CHECKLIST_LABEL_BY_KEY = {
  "tracer-interview-matrix": "`tracer-interview-matrix`",
  "interview-duo": "Realistic: duo interview",
  "interview-panel": "Realistic: panel interview (3 subjects)",
  "interview-rapid-fire-heavy": "Realistic: single subject, rapid-fire heavy",
  "interview-ending-on-eventfact":
    "Stretch: interview ending on an `eventFact`",

  "tracer-transfer-matrix": "`tracer-transfer-matrix`",
  "transfer-incoming": "Realistic: single incoming",
  "transfer-outgoing": "Realistic: outgoing with context",
  "transfer-extension": "Realistic: extension",
  "transfer-multi": "Realistic: multi-transfer roundup (3 transferFacts)",

  "tracer-event-matrix": "`tracer-event-matrix`",
  "event-matchday": "Realistic: single-day match-day-style",
  "event-multiday": "Realistic: multi-day tournament (`sessions[]`)",
  "event-past-recap": "Realistic: past event recap",
  "event-rapid-fire": "Stretch: event article with rapid-fire Q&A",

  "tracer-announcement-matrix": "`tracer-announcement-matrix`",
  "announcement-short": "Realistic: short notice",
  "announcement-long-form": "Realistic: long-form with images + video",
  "announcement-attachment-table":
    "Realistic: with `fileAttachment` + `htmlTable`",
  "announcement-side-transfer":
    "Stretch: announcement with a side-mention `transferFact`",
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * For each result, replace the matching `- [ ] <label> — …` line in the
 * issue body with a refreshed URL. Lines that already contain the URL
 * survive a re-run unchanged (idempotent).
 */
function rewriteChecklist(originalBody, results) {
  let body = originalBody;
  const missing = [];
  for (const { key, slug } of results) {
    const label = CHECKLIST_LABEL_BY_KEY[key];
    if (!label) {
      missing.push(`unknown result key: ${key}`);
      continue;
    }
    const url = stagingUrl(slug);
    // Capture the checkbox token so a `[x]` entry stays checked across
    // re-runs — grilling-session sign-offs survive subsequent seeds.
    const pattern = new RegExp(
      `^- \\[([ x])\\] ${escapeRegExp(label)} — .*$`,
      "m",
    );
    if (!pattern.test(body)) {
      missing.push(`no matching checklist line for label: ${label}`);
      continue;
    }
    body = body.replace(pattern, (_match, checkbox) => `- [${checkbox}] ${label} — ${url}`);
  }
  return { body, missing };
}

function ghIssueView(issue) {
  const raw = execFileSync(
    "gh",
    ["issue", "view", issue, "--json", "body", "--jq", ".body"],
    { encoding: "utf8" },
  );
  return raw;
}

function ghIssueEditBody(issue, body) {
  const tmpDir = mkdtempSync(join(tmpdir(), `seed-phase-5-${issue}-`));
  const tmpFile = join(tmpDir, "body.md");
  try {
    writeFileSync(tmpFile, body);
    execFileSync("gh", ["issue", "edit", issue, "--body-file", tmpFile], {
      stdio: "inherit",
    });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const skipIssueUpdate = process.argv.includes("--skip-issue-update");

  assertProductionGuard();
  const client = makeClient();
  const dataset = client.config().dataset;
  console.log(`\nSeeding Phase 5 closeout into dataset=${dataset}\n`);

  console.log("→ Interviews");
  const interviews = await seedInterviews(client);
  console.log("\n→ Transfers");
  const transfers = await seedTransfers(client);
  console.log("\n→ Events");
  const events = await seedEvents(client);
  console.log("\n→ Announcements");
  const announcements = await seedAnnouncements(client);

  const results = [
    ...interviews,
    ...transfers,
    ...events,
    ...announcements,
  ];

  console.log(`\nSeeded ${results.length} articles.\n`);
  console.log("Staging URLs:\n");
  for (const { key, slug } of results) {
    console.log(`  ${key.padEnd(34)} ${stagingUrl(slug)}`);
  }

  if (skipIssueUpdate) {
    console.log("\n--skip-issue-update set — leaving #1860 untouched.");
    return;
  }

  console.log(`\nUpdating #${TRACKER_ISSUE} checklist…`);
  const originalBody = ghIssueView(TRACKER_ISSUE);
  const { body, missing } = rewriteChecklist(originalBody, results);

  if (missing.length > 0) {
    console.error("Checklist update problems:");
    for (const m of missing) console.error(`  · ${m}`);
    // Refuse to write a partially-updated body — the user can re-run
    // after fixing the label drift between this script and the issue.
    process.exit(1);
  }

  if (body === originalBody) {
    console.log(
      `No-op: #${TRACKER_ISSUE} already up-to-date (every label already at the latest URL).`,
    );
    return;
  }

  ghIssueEditBody(TRACKER_ISSUE, body);
  console.log(`✓ #${TRACKER_ISSUE} checklist updated.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
