/**
 * Phase 1 — Staff data cleanup (issue #1212)
 *
 * 1. Dearchive ~26 staffMembers that were incorrectly archived by PSD sync
 * 2. Create ~16 new staffMember-manual-* documents for people not in PSD
 * 3. Delete the Kevin Schutijser draft duplicate (drafts.staffMember-psd-8576)
 *
 * Run: SANITY_API_TOKEN=... SANITY_DATASET=staging tsx src/phase1-dearchive-create-delete.ts
 */
import { client } from "./sanity-client";

// ─── 1. Dearchive list ──────────────────────────────────────────────────────

const DEARCHIVE_IDS = [
  "staffMember-psd-850",   // David Symkens
  "staffMember-psd-8948",  // Sebastien Decnoop
  "staffMember-psd-3050",  // Christophe Alaers
  "staffMember-psd-261",   // Erik Talboom
  "staffMember-psd-257",   // Stefan De Wael
  "staffMember-psd-6588",  // Tim Moens
  "staffMember-psd-10748", // Niels De Wael
  "staffMember-psd-10929", // Sven Cooreman
  "staffMember-psd-259",   // Nick Lauwers
  "staffMember-psd-10747", // Robbie Lebrun
  "staffMember-psd-524",   // Anthony Lagae
  "staffMember-psd-519",   // Joeri Vanhove
  "staffMember-psd-7786",  // Koen Verest
  "staffMember-psd-8939",  // Christophe Jessen
  "staffMember-psd-6530",  // Tim Ooghe
  "staffMember-psd-11278", // Mike Meuwis
  "staffMember-psd-10837", // Mats Uyttebroeck
  "staffMember-psd-8690",  // Elias Van Paesschen
  "staffMember-psd-2062",  // Lucas Goovaerts
  "staffMember-psd-7787",  // Jeroen Vanhelden
  "staffMember-psd-1699",  // Koen Muyldermans
  "staffMember-psd-9169",  // Laurens Maes
  "staffMember-psd-9255",  // Kristof Desmet
  "staffMember-psd-258",   // Chris Maes
  "staffMember-psd-4244",  // Yannick Brabant
  "staffMember-psd-8615",  // Jordy Benoot
];

// ─── 2. New manual staff members ────────────────────────────────────────────

interface ManualStaff {
  _id: string;
  firstName: string;
  lastName: string;
}

const MANUAL_STAFF: ManualStaff[] = [
  { _id: "staffMember-manual-rudy-bautmans", firstName: "Rudy", lastName: "Bautmans" },
  { _id: "staffMember-manual-ilona-trouwkens", firstName: "Ilona", lastName: "Trouwkens" },
  { _id: "staffMember-manual-matthias-knevels", firstName: "Matthias", lastName: "Knevels" },
  { _id: "staffMember-manual-werner-sanfrinnon", firstName: "Werner", lastName: "Sanfrinnon" },
  { _id: "staffMember-manual-igor-michiels", firstName: "Igor", lastName: "Michiels" },
  { _id: "staffMember-manual-mike-vermoes", firstName: "Mike", lastName: "Vermoes" },
  { _id: "staffMember-manual-kim-bautmans", firstName: "Kim", lastName: "Bautmans" },
  { _id: "staffMember-manual-dennis-thyssens", firstName: "Dennis", lastName: "Thyssens" },
  { _id: "staffMember-manual-sven-de-smedt", firstName: "Sven", lastName: "De Smedt" },
  { _id: "staffMember-manual-shauni-hellemans", firstName: "Shauni", lastName: "Hellemans" },
  { _id: "staffMember-manual-fred-degryse", firstName: "Fred", lastName: "Degryse" },
  { _id: "staffMember-manual-lena-van-marsenille", firstName: "Lena", lastName: "Van Marsenille" },
  { _id: "staffMember-manual-paul-vanhamme", firstName: "Paul", lastName: "Vanhamme" },
  { _id: "staffMember-manual-chris-nobels", firstName: "Chris", lastName: "Nobels" },
  { _id: "staffMember-manual-jurgen-vergalle", firstName: "Jurgen", lastName: "Vergalle" },
  { _id: "staffMember-manual-pieter-de-keyser", firstName: "Pieter", lastName: "De Keyser" },
];

// ─── 3. Draft duplicate to delete ───────────────────────────────────────────

const DRAFT_DUPLICATE_ID = "drafts.staffMember-psd-8576";

// ─── Execute ────────────────────────────────────────────────────────────────

async function dearchiveStaff() {
  console.log("\n=== Step 1: Dearchiving staff members ===\n");

  // First verify which ones actually exist and are archived
  const existing = await client.fetch<Array<{ _id: string; firstName: string; lastName: string; archived: boolean }>>(
    `*[_type == "staffMember" && _id in $ids]{ _id, firstName, lastName, archived }`,
    { ids: DEARCHIVE_IDS }
  );

  const existingMap = new Map(existing.map((d) => [d._id, d]));

  const toUnarchive: string[] = [];
  const alreadyActive: string[] = [];
  const notFound: string[] = [];

  for (const id of DEARCHIVE_IDS) {
    const doc = existingMap.get(id);
    if (!doc) {
      notFound.push(id);
    } else if (doc.archived) {
      toUnarchive.push(id);
    } else {
      alreadyActive.push(id);
    }
  }

  if (notFound.length > 0) {
    console.log(`WARNING: ${notFound.length} documents not found:`);
    notFound.forEach((id) => console.log(`  - ${id}`));
  }

  if (alreadyActive.length > 0) {
    console.log(`Already active (skipping): ${alreadyActive.length}`);
    alreadyActive.forEach((id) => {
      const doc = existingMap.get(id)!;
      console.log(`  - ${doc.firstName} ${doc.lastName} (${id})`);
    });
  }

  if (toUnarchive.length === 0) {
    console.log("No staff members need dearchiving.");
    return;
  }

  console.log(`\nDearchiving ${toUnarchive.length} staff members...`);

  console.log(`\nDearchiving ${toUnarchive.length} staff members (one by one to skip missing drafts)...`);

  for (const id of toUnarchive) {
    const doc = existingMap.get(id)!;
    console.log(`  + ${doc.firstName} ${doc.lastName} (${id})`);
    await client.patch(id).set({ archived: false }).commit();
    // Also patch the draft if it exists — ignore 404
    try {
      await client.patch(`drafts.${id}`).set({ archived: false }).commit();
    } catch {
      // draft doesn't exist — fine
    }
  }

  console.log(`Done — ${toUnarchive.length} staff members dearchived.`);
}

async function createManualStaff() {
  console.log("\n=== Step 2: Creating manual staff members ===\n");

  // Check which ones already exist
  const existing = await client.fetch<Array<{ _id: string }>>(
    `*[_type == "staffMember" && _id in $ids]{ _id }`,
    { ids: MANUAL_STAFF.map((s) => s._id) }
  );

  const existingIds = new Set(existing.map((d) => d._id));

  const toCreate = MANUAL_STAFF.filter((s) => !existingIds.has(s._id));
  const alreadyExist = MANUAL_STAFF.filter((s) => existingIds.has(s._id));

  if (alreadyExist.length > 0) {
    console.log(`Already exist (skipping): ${alreadyExist.length}`);
    alreadyExist.forEach((s) => console.log(`  - ${s.firstName} ${s.lastName} (${s._id})`));
  }

  if (toCreate.length === 0) {
    console.log("No new staff members to create.");
    return;
  }

  console.log(`Creating ${toCreate.length} new staff members...`);

  const transaction = client.transaction();
  for (const staff of toCreate) {
    console.log(`  + ${staff.firstName} ${staff.lastName} (${staff._id})`);
    transaction.create({
      _id: staff._id,
      _type: "staffMember",
      firstName: staff.firstName,
      lastName: staff.lastName,
      archived: false,
    });
  }

  await transaction.commit({ visibility: "async" });
  console.log(`Done — ${toCreate.length} staff members created.`);
}

async function deleteDraftDuplicate() {
  console.log("\n=== Step 3: Deleting draft duplicate ===\n");

  const exists = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{ _id }`,
    { id: DRAFT_DUPLICATE_ID }
  );

  if (!exists) {
    console.log(`Draft ${DRAFT_DUPLICATE_ID} not found — already deleted or never existed.`);
    return;
  }

  console.log(`Deleting ${DRAFT_DUPLICATE_ID}...`);
  await client.delete(DRAFT_DUPLICATE_ID);
  console.log("Done — draft duplicate deleted.");
}

async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  Phase 1 — Staff Data Cleanup (Issue #1212)  ║");
  console.log("╚═══════════════════════════════════════════════╝");

  await dearchiveStaff();
  await createManualStaff();
  await deleteDraftDuplicate();

  console.log("\n✅ Phase 1 complete.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
