/**
 * Board-document opschoning en teamreferenties bijwerken (#1215)
 *
 * Operations:
 * 1. Create new PSD docs from board docs (with photo migration)
 * 2. Relink refs from board docs → existing PSD docs
 * 3. Create new PSD docs from manual docs (upgrades)
 * 4. Create manual doc for Luc Deheyder
 * 5. Relink ALL references (organigram, responsibility, articles, etc.)
 * 6. Set team-bestuur and team-jeugdbestuur compositions
 * 7. Delete replaced board docs, replaced manual docs, and unreferenced board docs
 *
 * Usage:
 *   SANITY_DATASET=production npx tsx src/migrate-board-docs.ts          # dry-run
 *   SANITY_DATASET=production npx tsx src/migrate-board-docs.ts --execute # real run
 */
import { client } from "./sanity-client.js";

const DRY_RUN = !process.argv.includes("--execute");

interface SanityDoc {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

// ─── Mapping definitions ───────────────────────────────────────────────

interface BoardToPsdMapping {
  boardId: string;
  psdId: string;
  firstName?: string; // override firstName from board doc
  archived?: boolean;
}

interface ManualToPsdMapping {
  manualId: string;
  psdId: string;
}

interface BoardToManualMapping {
  boardId: string;
  manualSlug: string;
}

/** Board docs → new PSD docs (create PSD doc from board data) */
const BOARD_TO_NEW_PSD: BoardToPsdMapping[] = [
  { boardId: "staff-board-d2332ee2-19b0-4c9e-ac21-5c3bb35a60fc", psdId: "160" },                 // Rudy Bautmans
  { boardId: "staff-board-67832a6b-9cbb-4776-8307-e01268df9f2b", psdId: "256", archived: true },  // Maarten Boon
  { boardId: "staff-board-97bcb134-f673-475c-9507-c98cf33a5b10", psdId: "255", archived: true },  // Guido Dierickx
  { boardId: "staff-board-82404e68-9c6f-466e-80d4-f1c0d67e3369", psdId: "122" },                 // Hans Junius
  { boardId: "staff-board-9aeed3fc-2d50-4f52-85c4-ee8c72ad7b1d", psdId: "774", firstName: "Chris" }, // Chris Nobels
  { boardId: "staff-board-400e96fc-df0f-474b-9b2a-dc7d9aac0536", psdId: "825" },                 // Werner Sanfrinnon
  { boardId: "staff-board-24c53ac0-ba52-428a-a039-a146a5eff963", psdId: "821" },                  // Ilona Trouwkens
  { boardId: "staff-board-acffe287-67c1-42fc-8aa6-eab82c268b4c", psdId: "823" },                  // Paul Vanhamme
];

/** Board docs → existing PSD docs (relink only, possibly migrate photo) */
const BOARD_TO_EXISTING_PSD: BoardToPsdMapping[] = [
  { boardId: "staff-board-ef3a6397-8dd8-443c-b06a-1a3fb3e39fcc", psdId: "257" },  // Stefan De Wael
  { boardId: "staff-board-dd7508e6-f7c6-4425-81d8-8f176265eacd", psdId: "248" },  // Stefan Robberechts
  { boardId: "staff-board-19c6f821-55cb-405b-ad0e-7fd70839a455", psdId: "261" },  // Erik Talboom
];

/** Manual docs → new PSD docs (upgrade manual to PSD) */
const MANUAL_TO_PSD: ManualToPsdMapping[] = [
  { manualId: "staffMember-manual-rudy-bautmans", psdId: "160" },
  { manualId: "staffMember-manual-chris-nobels", psdId: "774" },
  { manualId: "staffMember-manual-werner-sanfrinnon", psdId: "825" },
  { manualId: "staffMember-manual-ilona-trouwkens", psdId: "821" },
  { manualId: "staffMember-manual-paul-vanhamme", psdId: "823" },
  { manualId: "staffMember-manual-sven-de-smedt", psdId: "10061" },
  { manualId: "staffMember-manual-matthias-knevels", psdId: "8946" },
  { manualId: "staffMember-manual-shauni-hellemans", psdId: "10228" },
];

/** Board doc → new manual doc */
const BOARD_TO_MANUAL: BoardToManualMapping[] = [
  { boardId: "staff-board-89f7bc6a-9b53-4e81-b596-49f580b02dd6", manualSlug: "luc-deheyder" },
];

/** Board docs to delete outright (no migration target) */
const BOARD_DELETE_ONLY = [
  "staff-board-0f2a92a4-2de4-411b-a6dd-e195b6141cb3", // Anthony Michiels
];

// ─── Team compositions ─────────────────────────────────────────────────

const TEAM_BESTUUR_REFS = [
  "staffMember-psd-160",  // Rudy Bautmans
  "staffMember-psd-821",  // Ilona Trouwkens
  "staffMember-psd-248",  // Stefan Robberechts
  "staffMember-psd-261",  // Erik Talboom
  "staffMember-psd-825",  // Werner Sanfrinnon
  "staffMember-psd-122",  // Hans Junius
  "staffMember-psd-257",  // Stefan De Wael
  "staffMember-psd-774",  // Chris Nobels
  "staffMember-manual-luc-deheyder", // Luc Deheyder
  "staffMember-psd-823",  // Paul Vanhamme
  "staffMember-psd-245",  // Kevin Van Ransbeeck
];

const TEAM_JEUGDBESTUUR_REFS = [
  "staffMember-psd-8946",  // Matthias Knevels
  "staffMember-psd-10228", // Shauni Hellemans
  "staffMember-psd-2094",  // Bram Van Zegbroeck
  "staffMember-psd-10061", // Sven De Smedt
  "staffMember-psd-8576",  // Kevin Schutijser
  "staffMember-psd-6530",  // Tim Ooghe
  "staffMember-psd-11278", // Mike Meuwis
  "staffMember-psd-6588",  // Tim Moens
];

// ─── Helpers ───────────────────────────────────────────────────────────

/** Recursively replace all `_ref` values matching `oldId` with `newId`. */
function deepReplaceRef(value: unknown, oldId: string, newId: string): unknown {
  if (value === null || value === undefined || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepReplaceRef(item, oldId, newId));
  }
  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "_ref" && val === oldId) {
      result[key] = newId;
    } else if (key === "_key" && val === oldId) {
      // Also update _key if it matches the old ID (organigram pattern)
      result[key] = newId;
    } else {
      result[key] = deepReplaceRef(val, oldId, newId);
    }
  }
  return result;
}

/** Fetch a full document by ID. */
async function fetchDoc(id: string): Promise<SanityDoc | null> {
  return client.fetch<SanityDoc | null>(`*[_id == $id][0]`, { id });
}

/** Find all documents referencing a given ID. */
async function findReferencingDocs(docId: string): Promise<SanityDoc[]> {
  return client.fetch<SanityDoc[]>(`*[references($docId)]`, { docId });
}

/** Relink all references from oldId → newId across the dataset. */
async function relinkReferences(oldId: string, newId: string): Promise<number> {
  const referencingDocs = await findReferencingDocs(oldId);
  if (referencingDocs.length === 0) return 0;

  console.log(`    Relinking ${referencingDocs.length} ref(s): ${oldId} → ${newId}`);

  if (!DRY_RUN) {
    const transaction = client.transaction();
    const draftOldId = `drafts.${oldId}`;

    for (const refDoc of referencingDocs) {
      let updated = deepReplaceRef(refDoc, oldId, newId) as SanityDoc;
      updated = deepReplaceRef(updated, draftOldId, newId) as SanityDoc;
      transaction.createOrReplace(updated);
      console.log(`      ${refDoc._type}:${refDoc._id}`);
    }

    await transaction.commit({ visibility: "async" });
  } else {
    for (const refDoc of referencingDocs) {
      console.log(`      [DRY] ${refDoc._type}:${refDoc._id}`);
    }
  }

  return referencingDocs.length;
}

/** Delete a document (published + draft), tolerating missing docs. */
async function deleteDoc(id: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`    [DRY] Would delete ${id}`);
    return;
  }
  for (const docId of [id, `drafts.${id}`]) {
    try {
      await client.delete(docId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("not found") || msg.includes("404")) continue;
      console.warn(`    Warning deleting ${docId}: ${msg}`);
    }
  }
}

// ─── Migration steps ───────────────────────────────────────────────────

const SYSTEM_FIELDS = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt"]);

/** Copy fields from source doc, excluding system fields. */
function copyUserFields(doc: SanityDoc): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc)) {
    if (!SYSTEM_FIELDS.has(key)) {
      result[key] = val;
    }
  }
  return result;
}

async function step1_boardToNewPsd() {
  console.log("\n═══ Step 1: Board docs → new PSD docs ═══");

  for (const mapping of BOARD_TO_NEW_PSD) {
    const targetId = `staffMember-psd-${mapping.psdId}`;
    const boardDoc = await fetchDoc(mapping.boardId);
    if (!boardDoc) {
      console.log(`  SKIP ${mapping.boardId} — not found`);
      continue;
    }

    const name = `${mapping.firstName ?? boardDoc.firstName} ${boardDoc.lastName}`;
    console.log(`\n  ${name}: ${mapping.boardId} → ${targetId}`);

    // Check if PSD doc already exists (it shouldn't for "new" ones, but be safe)
    const existingPsd = await fetchDoc(targetId);

    if (!DRY_RUN) {
      const fields = copyUserFields(boardDoc);
      if (mapping.firstName) fields.firstName = mapping.firstName;
      fields.psdId = mapping.psdId;
      if (mapping.archived) fields.archived = true;

      if (existingPsd) {
        // PSD doc exists — only migrate photo if needed
        if (boardDoc.photo && !existingPsd.photo) {
          console.log(`    Copying photo to existing ${targetId}`);
          await client.patch(targetId).set({ photo: boardDoc.photo }).commit();
        }
      } else {
        // Create new PSD doc
        console.log(`    Creating ${targetId}`);
        await client.createOrReplace({
          _id: targetId,
          _type: "staffMember",
          ...fields,
        });
      }
    } else {
      console.log(`    [DRY] Would create ${targetId} (photo: ${!!boardDoc.photo}, archived: ${!!mapping.archived})`);
      if (existingPsd) console.log(`    [DRY] PSD doc already exists — would merge photo only`);
    }

    // Relink references
    await relinkReferences(mapping.boardId, targetId);
  }
}

async function step2_boardToExistingPsd() {
  console.log("\n═══ Step 2: Board docs → existing PSD docs (relink + photo) ═══");

  for (const mapping of BOARD_TO_EXISTING_PSD) {
    const targetId = `staffMember-psd-${mapping.psdId}`;
    const boardDoc = await fetchDoc(mapping.boardId);
    if (!boardDoc) {
      console.log(`  SKIP ${mapping.boardId} — not found`);
      continue;
    }

    const name = `${boardDoc.firstName} ${boardDoc.lastName}`;
    console.log(`\n  ${name}: ${mapping.boardId} → ${targetId}`);

    // Photo migration if board has one and PSD doesn't
    if (boardDoc.photo) {
      const psdDoc = await fetchDoc(targetId);
      if (psdDoc && !psdDoc.photo) {
        console.log(`    Copying photo to ${targetId}`);
        if (!DRY_RUN) {
          await client.patch(targetId).set({ photo: boardDoc.photo }).commit();
        } else {
          console.log(`    [DRY] Would copy photo`);
        }
      } else {
        console.log(`    PSD already has photo — keeping PSD version`);
      }
    }

    // Relink references
    await relinkReferences(mapping.boardId, targetId);
  }
}

async function step3_manualToPsd() {
  console.log("\n═══ Step 3: Manual docs → PSD docs (upgrade) ═══");

  for (const mapping of MANUAL_TO_PSD) {
    const targetId = `staffMember-psd-${mapping.psdId}`;
    const manualDoc = await fetchDoc(mapping.manualId);
    if (!manualDoc) {
      console.log(`  SKIP ${mapping.manualId} — not found`);
      continue;
    }

    const name = `${manualDoc.firstName} ${manualDoc.lastName}`;
    console.log(`\n  ${name}: ${mapping.manualId} → ${targetId}`);

    // Check if PSD doc already exists (created in step 1 from board doc)
    const existingPsd = await fetchDoc(targetId);

    if (!existingPsd && !DRY_RUN) {
      // Create PSD doc from manual doc data
      const fields = copyUserFields(manualDoc);
      fields.psdId = mapping.psdId;
      console.log(`    Creating ${targetId}`);
      await client.createOrReplace({
        _id: targetId,
        _type: "staffMember",
        ...fields,
      });
    } else if (existingPsd) {
      console.log(`    ${targetId} already exists (created from board doc) — relink only`);
    } else {
      console.log(`    [DRY] Would create ${targetId}`);
    }

    // Relink references
    await relinkReferences(mapping.manualId, targetId);
  }
}

async function step4_boardToManual() {
  console.log("\n═══ Step 4: Board docs → new manual docs ═══");

  for (const mapping of BOARD_TO_MANUAL) {
    const targetId = `staffMember-manual-${mapping.manualSlug}`;
    const boardDoc = await fetchDoc(mapping.boardId);
    if (!boardDoc) {
      console.log(`  SKIP ${mapping.boardId} — not found`);
      continue;
    }

    const name = `${boardDoc.firstName} ${boardDoc.lastName}`;
    console.log(`\n  ${name}: ${mapping.boardId} → ${targetId}`);

    if (!DRY_RUN) {
      const fields = copyUserFields(boardDoc);
      console.log(`    Creating ${targetId}`);
      await client.createOrReplace({
        _id: targetId,
        _type: "staffMember",
        ...fields,
      });
    } else {
      console.log(`    [DRY] Would create ${targetId}`);
    }

    // Relink references
    await relinkReferences(mapping.boardId, targetId);
  }
}

async function step5_updateTeamCompositions() {
  console.log("\n═══ Step 5: Update team compositions ═══");

  const makeStaffArray = (refs: string[]) =>
    refs.map((ref, i) => ({
      _type: "reference" as const,
      _ref: ref,
      _key: `staff-${i}`,
    }));

  // team-bestuur
  const bestuurStaff = makeStaffArray(TEAM_BESTUUR_REFS);
  console.log(`\n  team-bestuur: ${bestuurStaff.length} members`);
  for (const ref of TEAM_BESTUUR_REFS) console.log(`    - ${ref}`);

  if (!DRY_RUN) {
    await client.patch("team-bestuur").set({ staff: bestuurStaff }).commit();
    console.log("    ✓ Updated");
  } else {
    console.log("    [DRY] Would update");
  }

  // team-jeugdbestuur
  const jeugdStaff = makeStaffArray(TEAM_JEUGDBESTUUR_REFS);
  console.log(`\n  team-jeugdbestuur: ${jeugdStaff.length} members`);
  for (const ref of TEAM_JEUGDBESTUUR_REFS) console.log(`    - ${ref}`);

  if (!DRY_RUN) {
    await client.patch("team-jeugdbestuur").set({ staff: jeugdStaff }).commit();
    console.log("    ✓ Updated");
  } else {
    console.log("    [DRY] Would update");
  }
}

async function step5b_cleanTeamAngelsRefs() {
  console.log("\n═══ Step 5b: Remove board-doc refs from team-angels ═══");

  const teamAngels = await fetchDoc("team-angels");
  if (!teamAngels || !Array.isArray(teamAngels.staff)) {
    console.log("  team-angels not found or has no staff — skipping");
    return;
  }

  const originalCount = teamAngels.staff.length;
  const cleaned = (teamAngels.staff as Array<{ _ref: string; _key: string; _type: string }>)
    .filter((ref) => !ref._ref.startsWith("staff-board-"));

  const removedCount = originalCount - cleaned.length;
  console.log(`  Removing ${removedCount} board-doc refs from team-angels (keeping ${cleaned.length})`);

  if (!DRY_RUN && removedCount > 0) {
    await client.patch("team-angels").set({ staff: cleaned }).commit();
    console.log("    ✓ Updated");
  } else if (removedCount > 0) {
    console.log("    [DRY] Would update");
  }
}

async function step6_deleteOldDocs() {
  console.log("\n═══ Step 6: Delete old documents ═══");

  // 6a. Delete board docs that were migrated or explicitly marked for deletion
  const boardIdsToDelete = [
    ...BOARD_TO_NEW_PSD.map((m) => m.boardId),
    ...BOARD_TO_EXISTING_PSD.map((m) => m.boardId),
    ...BOARD_TO_MANUAL.map((m) => m.boardId),
    ...BOARD_DELETE_ONLY,
  ];

  console.log(`\n  Deleting ${boardIdsToDelete.length} migrated/marked board docs...`);
  for (const id of boardIdsToDelete) {
    console.log(`    ${id}`);
    await deleteDoc(id);
  }

  // 6b. Delete replaced manual docs
  const manualIdsToDelete = MANUAL_TO_PSD.map((m) => m.manualId);
  console.log(`\n  Deleting ${manualIdsToDelete.length} replaced manual docs...`);
  for (const id of manualIdsToDelete) {
    console.log(`    ${id}`);
    await deleteDoc(id);
  }

  // 6c. Delete all remaining staff-board-* documents (should be unreferenced after relinking)
  const remainingBoardDocs = await client.fetch<Array<{ _id: string; firstName: string; lastName: string }>>(
    `*[_type == "staffMember" && _id match "staff-board-*"] { _id, firstName, lastName } | order(lastName asc)`
  );

  console.log(`\n  Deleting ${remainingBoardDocs.length} remaining board docs...`);
  for (const doc of remainingBoardDocs) {
    console.log(`    ${doc._id} (${doc.firstName} ${doc.lastName})`);
    await deleteDoc(doc._id);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Board-document opschoning (#1215)                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (add --execute to run for real)" : "⚠️  EXECUTING FOR REAL"}`);
  console.log(`Dataset: ${process.env.SANITY_DATASET ?? "staging"}`);

  await step1_boardToNewPsd();
  await step2_boardToExistingPsd();
  await step3_manualToPsd();
  await step4_boardToManual();
  await step5_updateTeamCompositions();
  await step5b_cleanTeamAngelsRefs();
  await step6_deleteOldDocs();

  console.log("\n═══ Complete ═══");
  if (DRY_RUN) {
    console.log("This was a dry run. Run with --execute to apply changes.");
  } else {
    console.log("✅ All mutations applied successfully.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
