#!/usr/bin/env node
/*
 * apps/web/scripts/seed-1945-team-editorial-staging.mjs
 *
 * Phase 6.C — `/ploegen/[slug]` page assembly verification (issue #1945).
 *
 * The editorial section (`<TeamEditorial>`: body / trainingSchedule /
 * contactInfo) is manual editorial data that PSD sync never populates, so a
 * freshly-synced staging team renders the page WITHOUT the "Info" section.
 * This seed patches the A-ploeg (`team-psd-1`) editorial fields so the full
 * single-scroll composition — including the "Het verhaal" pull-quote, the
 * training table and the contact block — is demoable on the preview.
 *
 *   Field             | Seeded value
 *   ------------------|------------------------------------------------------
 *   body              | 2 paragraphs, one `pullquote`-decorated run
 *   trainingSchedule  | 2 sessions (Dinsdag / Donderdag)
 *   contactInfo       | 1 paragraph (afgevaardigde + secretariaat)
 *
 * Per `[[feedback_run_seed_yourself]]` the script is part of the PR
 * deliverable — execute it before requesting review and paste the URL into
 * the PR body. Re-runnable: fields are replaced (not appended), so re-runs
 * leave staging in the same state.
 *
 * Usage:
 *   pnpm --filter @kcvv/web exec node scripts/seed-1945-team-editorial-staging.mjs
 *
 * Env:
 *   SANITY_API_TOKEN  — write token (falls back to ~/.config/sanity/config.json)
 *   SANITY_DATASET    — defaults to "staging"; refuses prod unless
 *                       SANITY_ALLOW_PRODUCTION=1
 */

import { assertProductionGuard, makeClient } from "./seeds/phase-5-shared.mjs";

assertProductionGuard();

const client = makeClient();

const TEAM_ID = "team-psd-1"; // A-ploeg (Eerste Elftallen A)
const TEAM_SLUG = "eerste-elftallen-a";

function span(key, text, marks = []) {
  return { _type: "span", _key: key, text, marks };
}

function block(key, children) {
  return { _type: "block", _key: key, style: "normal", markDefs: [], children };
}

const body = [
  block("verhaal-1", [
    span(
      "v1a",
      "Onze A-ploeg speelt al sinds de promotie op het hoogste provinciale niveau. De kern is een mix van eigen jeugd en ervaren spelers die week na week de kleuren verdedigen. ",
    ),
    span("v1b", "Hier wordt voetbal nog met het hart gespeeld.", ["pullquote"]),
  ]),
  block("verhaal-2", [
    span(
      "v2a",
      "Spelers, staf en supporters zetten samen de schouders onder elke wedstrijd — thuis op Sportpark Elewijt of op verplaatsing.",
    ),
  ]),
];

const trainingSchedule = [
  {
    _type: "trainingSession",
    _key: "train-di",
    day: "Dinsdag",
    time: "19:30",
    location: "Sportpark Elewijt — Veld 1",
    type: "Training",
  },
  {
    _type: "trainingSession",
    _key: "train-do",
    day: "Donderdag",
    time: "20:00",
    location: "Sportpark Elewijt — Veld 1",
    type: "Tactisch",
  },
];

const contactInfo = [
  block("contact-1", [
    span("c1", "Ploegafgevaardigde: Jan Janssens — 0470 12 34 56"),
  ]),
  block("contact-2", [span("c2", "Secretariaat: info@kcvvelewijt.be")]),
];

async function main() {
  const existing = await client.getDocument(TEAM_ID);
  if (!existing) {
    console.error(
      `Team ${TEAM_ID} not found on this dataset — cannot seed editorial fields.`,
    );
    process.exit(1);
  }

  await client
    .patch(TEAM_ID)
    .set({ body, trainingSchedule, contactInfo })
    .commit();

  console.log(`✔ Patched ${TEAM_ID} editorial fields (body / trainingSchedule / contactInfo).`);
  console.log(`  https://staging.kcvvelewijt.be/ploegen/${TEAM_SLUG}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
