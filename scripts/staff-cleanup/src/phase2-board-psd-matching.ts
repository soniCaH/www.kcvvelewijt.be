/**
 * Phase 2 — Board→PSD matching report (issue #1212)
 *
 * Queries all staff-board-* and staffMember-psd-* documents, matches by name,
 * and outputs a JSON report for human review.
 *
 * Run: SANITY_API_TOKEN=... SANITY_DATASET=staging tsx src/phase2-board-psd-matching.ts
 */
import { client } from "./sanity-client";

interface StaffDoc {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  photo: unknown;
  psdId: string | null;
}

interface Match {
  boardDoc: StaffDoc;
  psdDoc: StaffDoc;
  confidence: "exact" | "normalized";
  boardName: string;
  psdName: string;
}

function normalize(name: string | null): string {
  return (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/\s+/g, " ")
    .trim();
}

function fullName(doc: StaffDoc): string {
  return `${doc.firstName ?? ""} ${doc.lastName ?? ""}`.trim();
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Phase 2 — Board→PSD Matching Report (#1212)     ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  // Fetch all board docs (non-archived, with the staff-board- prefix)
  const boardDocs = await client.fetch<StaffDoc[]>(
    `*[_type == "staffMember" && _id match "staff-board-*"]{
      _id, firstName, lastName, photo, psdId
    }`
  );

  // Fetch all PSD docs (active)
  const psdDocs = await client.fetch<StaffDoc[]>(
    `*[_type == "staffMember" && _id match "staffMember-psd-*" && !archived]{
      _id, firstName, lastName, photo, psdId
    }`
  );

  console.log(`Found ${boardDocs.length} board documents`);
  console.log(`Found ${psdDocs.length} active PSD documents\n`);

  // Build normalized name → PSD doc index
  const psdByNormalizedName = new Map<string, StaffDoc[]>();
  for (const doc of psdDocs) {
    const key = `${normalize(doc.firstName)}|${normalize(doc.lastName)}`;
    const existing = psdByNormalizedName.get(key) ?? [];
    existing.push(doc);
    psdByNormalizedName.set(key, existing);
  }

  const matches: Match[] = [];
  const unmatched: StaffDoc[] = [];

  for (const boardDoc of boardDocs) {
    const boardKey = `${normalize(boardDoc.firstName)}|${normalize(boardDoc.lastName)}`;
    const candidates = psdByNormalizedName.get(boardKey);

    if (candidates && candidates.length === 1) {
      matches.push({
        boardDoc,
        psdDoc: candidates[0],
        confidence: boardDoc.firstName === candidates[0].firstName && boardDoc.lastName === candidates[0].lastName
          ? "exact"
          : "normalized",
        boardName: fullName(boardDoc),
        psdName: fullName(candidates[0]),
      });
    } else if (candidates && candidates.length > 1) {
      console.log(`WARNING: Multiple PSD matches for board doc ${boardDoc._id} (${fullName(boardDoc)}):`);
      candidates.forEach((c) => console.log(`  - ${c._id} (${fullName(c)})`));
      unmatched.push(boardDoc);
    } else {
      unmatched.push(boardDoc);
    }
  }

  // Report
  console.log("═══ MATCHES ═══\n");
  for (const m of matches) {
    const hasPhoto = m.boardDoc.photo ? "has photo" : "no photo";
    console.log(`  ${m.boardDoc._id} → ${m.psdDoc._id}`);
    console.log(`    Board: "${m.boardName}" | PSD: "${m.psdName}" | ${m.confidence} | ${hasPhoto}`);
  }

  console.log(`\n═══ UNMATCHED BOARD DOCS (${unmatched.length}) ═══\n`);
  for (const doc of unmatched) {
    console.log(`  ${doc._id} — "${fullName(doc)}" ${doc.photo ? "(has photo)" : "(no photo)"}`);
  }

  console.log(`\n═══ SUMMARY ═══`);
  console.log(`  Matches:   ${matches.length}`);
  console.log(`  Unmatched: ${unmatched.length}`);
  console.log(`  Total:     ${boardDocs.length} board docs\n`);

  // Write matches to a JSON file for the migration step
  const reportPath = "phase2-matches.json";
  const { writeFileSync } = await import("fs");
  writeFileSync(
    reportPath,
    JSON.stringify(
      matches.map((m) => ({
        boardId: m.boardDoc._id,
        psdId: m.psdDoc._id,
        psdIdNum: m.psdDoc.psdId,
        boardName: m.boardName,
        psdName: m.psdName,
        confidence: m.confidence,
        hasPhoto: !!m.boardDoc.photo,
      })),
      null,
      2
    )
  );
  console.log(`Match report written to ${reportPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
