/**
 * Phase 2 — Execute approved board→PSD migrations
 *
 * For each match:
 * 1. Copy photo from board→PSD if board has photo and PSD doesn't
 * 2. Relink all references from board doc → PSD doc
 * 3. Delete board doc (published + draft)
 */
import { client } from "./sanity-client";
import { readFileSync } from "fs";

interface MatchEntry {
  boardId: string;
  psdId: string;
  psdIdNum: string;
  boardName: string;
  psdName: string;
  confidence: string;
  hasPhoto: boolean;
}

interface SanityDoc {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

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
    } else {
      result[key] = deepReplaceRef(val, oldId, newId);
    }
  }
  return result;
}

const matches: MatchEntry[] = JSON.parse(readFileSync("phase2-matches.json", "utf-8"));

async function migrateOne(match: MatchEntry, index: number) {
  const { boardId, psdId, boardName, hasPhoto } = match;
  console.log(`\n[${index + 1}/${matches.length}] ${boardName}: ${boardId} → ${psdId}`);

  // 1. Photo migration
  if (hasPhoto) {
    const boardDoc = await client.fetch<{ photo: unknown } | null>(
      `*[_id == $id][0]{ photo }`,
      { id: boardId }
    );
    const psdDoc = await client.fetch<{ photo: unknown } | null>(
      `*[_id == $id][0]{ photo }`,
      { id: psdId }
    );

    if (boardDoc?.photo && !psdDoc?.photo) {
      console.log("  Copying photo to PSD doc...");
      await client.patch(psdId).set({ photo: boardDoc.photo }).commit();
    } else if (boardDoc?.photo && psdDoc?.photo) {
      console.log("  Both have photos — keeping PSD version");
    } else {
      console.log("  No photo to copy");
    }
  }

  // 2. Relink references
  const referencingDocs = await client.fetch<SanityDoc[]>(
    `*[references($boardId)]`,
    { boardId }
  );

  if (referencingDocs.length > 0) {
    console.log(`  Relinking ${referencingDocs.length} reference(s)...`);
    const transaction = client.transaction();
    const draftBoardId = `drafts.${boardId}`;

    for (const refDoc of referencingDocs) {
      let updated = deepReplaceRef(refDoc, boardId, psdId) as SanityDoc;
      updated = deepReplaceRef(updated, draftBoardId, psdId) as SanityDoc;
      transaction.createOrReplace(updated);
      console.log(`    ${refDoc._type}:${refDoc._id}`);
    }

    await transaction.commit({ visibility: "async" });
  }

  // 3. Delete board doc (published + draft)
  console.log("  Deleting board doc...");
  try { await client.delete(boardId); } catch { console.log(`    Published ${boardId} not found`); }
  try { await client.delete(`drafts.${boardId}`); } catch { /* draft may not exist */ }

  console.log("  Done.");
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  Phase 2 — Execute Board→PSD Migration (#1212)       ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`\nProcessing ${matches.length} approved matches...`);

  for (let i = 0; i < matches.length; i++) {
    await migrateOne(matches[i], i);
  }

  console.log(`\n✅ Phase 2 complete — ${matches.length} board docs migrated.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
