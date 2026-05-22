#!/usr/bin/env node
/*
 * apps/web/scripts/seed-1885-player-profile-staging.mjs
 *
 * Phase 6.A — `/spelers/[slug]` page assembly verification matrix.
 *
 * Issue #1885. Picks 7 deterministic players from staging matching the
 * PRD §5 verification table, then patches the three adult slots whose
 * BioBlock/QuotesBlock branches need a populated bio with `pullquote`
 * decorator marks. Minor slots (#6, #7) get NO bio per
 * `[[project_player_profile_all_ages]]` privacy policy.
 *
 *   Seed | Slot                                  | Bio action              | Renders
 *   -----|---------------------------------------|-------------------------|----------------------------------
 *   1    | Adult A-team w/ photo                 | 2 pullquote marks       | Hero photo + BioBlock + QuotesBlock
 *   2    | Adult A-team w/ photo                 | 1 pullquote mark        | Hero photo + BioBlock inline only
 *   3    | Adult A-team w/ photo                 | 0 pullquote marks       | Hero photo + BioBlock paragraph only
 *   4    | Adult A-team w/ photo                 | empty bio (clear)       | Hero photo only
 *   5    | Adult B-team without photo            | empty bio               | Hero illustration fallback (adult)
 *   6    | U17 minor (photo permitted)           | NO bio (privacy)        | Hero photo + age-graded DOB
 *   7    | U8 minor (often no photo)             | NO bio (privacy)        | Hero illustration + age-graded DOB
 *
 * Per `[[feedback_run_seed_yourself]]` the script is part of the PR
 * deliverable — execute it before requesting review and paste the
 * resolved psdId / URL table into the PR body.
 *
 * Usage:
 *   pnpm --filter @kcvv/web exec node scripts/seed-1885-player-profile-staging.mjs
 *
 * Env:
 *   SANITY_API_TOKEN   — write token (falls back to ~/.config/sanity/config.json)
 *   SANITY_DATASET     — defaults to "staging"; refuses to run against prod
 *                        unless SANITY_ALLOW_PRODUCTION=1
 *
 * Re-runnable: each player's bio is replaced (not appended) so re-runs
 * leave the staging dataset in the same state.
 */

import {
  assertProductionGuard,
  makeClient,
} from "./seeds/phase-5-shared.mjs";

assertProductionGuard();

const client = makeClient();

// ─── Bio fixtures (Portable Text with `pullquote` decorator) ─────────────────

function span(key, text, marks = []) {
  return { _type: "span", _key: key, text, marks };
}

function block(key, children) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children,
  };
}

const BIO_TWO_MARKS = [
  block("seed1-p1", [
    span("seed1-p1-a", "Hij groeide op in Elewijt en kreeg de liefde voor het spel met de paplepel mee. "),
    span("seed1-p1-b", "Vanaf zijn zesde stond hij elke zaterdag bij de jeugdploegen.", ["pullquote"]),
    span("seed1-p1-c", " Op zijn zeventiende debuteerde hij in de eerste ploeg."),
  ]),
  block("seed1-p2", [
    span("seed1-p2-a", "Op het veld is hij "),
    span("seed1-p2-b", "een meedogenloze tackler die elk duel wint en de opbouw vanuit het midden draagt.", ["pullquote"]),
    span("seed1-p2-c", " Een combinatie die hem onmisbaar maakt in het middenveld."),
  ]),
];

const BIO_ONE_MARK = [
  block("seed2-p1", [
    span("seed2-p1-a", "Hij kwam over van een naburige ploeg en groeide snel uit tot vaste waarde in de verdediging. "),
    span("seed2-p1-b", "Zijn linkervoet legt elke vrije trap waar hij hem hebben wil.", ["pullquote"]),
  ]),
  block("seed2-p2", [
    span("seed2-p2-a", "In zijn vrije tijd coacht hij de jeugd — een rol waar hij naar eigen zeggen evenveel uit haalt als uit het weekend."),
  ]),
];

const BIO_NO_MARKS = [
  block("seed3-p1", [
    span("seed3-p1-a", "Hij staat sinds zijn elfde tussen de palen en heeft alle jeugdcategorieën doorlopen bij KCVV. Een rustige keeper met goeie spelhervattingen en een vaste hand in het penaltygebied."),
  ]),
];

// ─── Candidate query ─────────────────────────────────────────────────────────
//
// Strategy: pick deterministic candidates per slot by querying staging and
// ordering alphabetically on (firstName, lastName). This keeps the matrix
// stable across re-runs as long as the underlying roster doesn't change.
//
// "A-team adults" = teams where `age` is null or the literal "A" / "B"
// labels used by the club for the senior squads. We query teams first to
// pick the right slots, then fetch their rostered players.

const TEAM_BUCKETS_QUERY = /* groq */ `{
  "aTeam": *[_type == "team" && archived != true && name == "Eerste Elftallen A"][0]{ _id, name, season,
    "players": players[]->{
      _id, psdId, firstName, lastName, birthDate,
      "hasPhoto": defined(psdImage.asset._ref) || defined(transparentImage.asset._ref),
      "bioBlocks": coalesce(length(bio), 0)
    }
  },
  "bTeam": *[_type == "team" && archived != true && name == "Eerste Elftallen B"][0]{ _id, name, season,
    "players": players[]->{
      _id, psdId, firstName, lastName, birthDate,
      "hasPhoto": defined(psdImage.asset._ref) || defined(transparentImage.asset._ref)
    }
  },
  "u17": *[_type == "team" && archived != true && age == "U17"][0]{ _id, name, season,
    "players": players[]->{
      _id, psdId, firstName, lastName, birthDate,
      "hasPhoto": defined(psdImage.asset._ref) || defined(transparentImage.asset._ref)
    }
  },
  "u8": *[_type == "team" && archived != true && age == "U8"][0]{ _id, name, season,
    "players": players[]->{
      _id, psdId, firstName, lastName, birthDate,
      "hasPhoto": defined(psdImage.asset._ref) || defined(transparentImage.asset._ref)
    }
  }
}`;

function byName(a, b) {
  const an = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim().toLowerCase();
  const bn = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim().toLowerCase();
  return an.localeCompare(bn);
}

function nameOf(p) {
  return `${p?.firstName ?? "?"} ${p?.lastName ?? "?"}`.trim();
}

function isAdult(birthDate) {
  if (!birthDate) return true;
  const ageMs = Date.now() - new Date(birthDate).getTime();
  return ageMs / (365.25 * 24 * 60 * 60 * 1000) >= 18;
}

async function pickSlots() {
  const buckets = await client.fetch(TEAM_BUCKETS_QUERY);

  const aPlayers = (buckets.aTeam?.players ?? [])
    .filter((p) => p.psdId && isAdult(p.birthDate))
    .sort(byName);
  const aWithPhoto = aPlayers.filter((p) => p.hasPhoto);

  const bPlayers = (buckets.bTeam?.players ?? [])
    .filter((p) => p.psdId && isAdult(p.birthDate))
    .sort(byName);
  const bWithoutPhoto = bPlayers.filter((p) => !p.hasPhoto);

  const u17Players = (buckets.u17?.players ?? [])
    .filter((p) => p.psdId)
    .sort(byName);
  const u17WithPhoto = u17Players.filter((p) => p.hasPhoto);

  const u8Players = (buckets.u8?.players ?? [])
    .filter((p) => p.psdId)
    .sort(byName);
  const u8WithoutPhoto = u8Players.filter((p) => !p.hasPhoto);

  const seed5 = bWithoutPhoto[0] ?? bPlayers[0] ?? null;
  if (seed5 !== null && seed5.hasPhoto) {
    console.warn(
      `⚠️  seed5 fallback: no B-team player without a photo on staging. Picked ${nameOf(seed5)} (has photo), which DEFEATS the "illustration fallback (adult)" branch this slot is supposed to cover. Add a photo-less B-team player to staging to fix.`,
    );
  }

  return {
    seed1: aWithPhoto[0] ?? null,
    seed2: aWithPhoto[1] ?? null,
    seed3: aWithPhoto[2] ?? null,
    seed4: aWithPhoto[3] ?? null,
    seed5,
    seed6: u17WithPhoto[0] ?? u17Players[0] ?? null,
    seed7: u8WithoutPhoto[0] ?? u8Players[0] ?? null,
  };
}

async function patchBio(player, bio) {
  if (!player) return;
  await client
    .patch(player._id)
    .set({ bio })
    .commit({ autoGenerateArrayKeys: false });
}

async function clearBio(player) {
  if (!player) return;
  await client.patch(player._id).unset(["bio"]).commit();
}

async function main() {
  console.log("📋 Probing staging for candidate players …");
  const slots = await pickSlots();

  const missing = Object.entries(slots)
    .filter(([, p]) => p === null)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.warn(
      `⚠️  Could not resolve every slot — staging is missing candidates for: ${missing.join(", ")}`,
    );
    console.warn(
      "    The script will still patch the slots it CAN resolve. Re-run after adding the missing rosters.",
    );
  }

  console.log("✏️  Patching seed 1 (2 marks) →", nameOf(slots.seed1));
  await patchBio(slots.seed1, BIO_TWO_MARKS);

  console.log("✏️  Patching seed 2 (1 mark) →", nameOf(slots.seed2));
  await patchBio(slots.seed2, BIO_ONE_MARK);

  console.log("✏️  Patching seed 3 (0 marks) →", nameOf(slots.seed3));
  await patchBio(slots.seed3, BIO_NO_MARKS);

  console.log("🧹 Clearing bio for seed 4 (empty) →", nameOf(slots.seed4));
  await clearBio(slots.seed4);

  console.log("🧹 Clearing bio for seed 5 (empty, no photo) →", nameOf(slots.seed5));
  await clearBio(slots.seed5);

  console.log("⏭  Skipping bio for seed 6 (U17 minor — privacy) →", nameOf(slots.seed6));
  console.log("⏭  Skipping bio for seed 7 (U8 minor — privacy) →", nameOf(slots.seed7));

  console.log("\n──────────────────────────────────────────");
  console.log("✅ Verification matrix (paste into PR body)");
  console.log("──────────────────────────────────────────\n");

  const rows = [
    ["1", "2 marks (full path)", slots.seed1],
    ["2", "1 mark (QuotesBlock auto-hide)", slots.seed2],
    ["3", "0 marks (inline-pullquote auto-hide)", slots.seed3],
    ["4", "empty bio (BioBlock auto-hide)", slots.seed4],
    ["5", "no photo, empty bio (illustration fallback, adult)", slots.seed5],
    ["6", "U17 minor (DOB grading + photo)", slots.seed6],
    ["7", "U8 minor (illustration fallback, age-graded)", slots.seed7],
  ];

  console.log("| Seed | Branch | psdId | Player | URL |");
  console.log("| ---- | ------ | ----- | ------ | --- |");
  for (const [n, branch, p] of rows) {
    const psd = p?.psdId ?? "—";
    const name = p ? nameOf(p) : "(missing)";
    const url = p?.psdId
      ? `https://www.kcvvelewijt.be/spelers/${p.psdId}`
      : "—";
    console.log(`| ${n} | ${branch} | ${psd} | ${name} | ${url} |`);
  }

  console.log("\n(swap the host for the Vercel preview URL when verifying the PR)");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
