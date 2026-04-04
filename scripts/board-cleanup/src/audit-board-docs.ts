import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { client } from "./sanity-client.js";

interface BoardDoc {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  hasPhoto: boolean;
  archived: boolean;
  referencedBy: string[];
}

interface PsdDoc {
  _id: string;
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  hasPhoto: boolean;
  archived: boolean;
}

interface ManualDoc {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  hasPhoto: boolean;
  archived: boolean;
}

interface TeamDoc {
  _id: string;
  title: string;
  members: Array<{ _ref: string }> | null;
}

async function main() {
  // 1. Fetch all remaining board docs
  const boardDocs = await client.fetch<BoardDoc[]>(`
    *[_type == "staffMember" && _id match "staff-board-*"] {
      _id,
      firstName,
      lastName,
      "hasPhoto": defined(photo),
      archived,
      "referencedBy": *[references(^._id)]._id
    } | order(lastName asc, firstName asc)
  `);

  // 2. Fetch all PSD docs (active)
  const psdDocs = await client.fetch<PsdDoc[]>(`
    *[_type == "staffMember" && _id match "staffMember-psd-*"] {
      _id,
      psdId,
      firstName,
      lastName,
      "hasPhoto": defined(photo),
      archived
    } | order(lastName asc, firstName asc)
  `);

  // 3. Fetch all manual docs
  const manualDocs = await client.fetch<ManualDoc[]>(`
    *[_type == "staffMember" && _id match "staffMember-manual-*"] {
      _id,
      firstName,
      lastName,
      "hasPhoto": defined(photo),
      archived
    } | order(lastName asc, firstName asc)
  `);

  // 4. Fetch team-bestuur and team-jeugdbestuur
  const teams = await client.fetch<TeamDoc[]>(`
    *[_type == "team" && _id in ["team-bestuur", "team-jeugdbestuur", "team-angels"]] {
      _id,
      title,
      "members": staff[]
    }
  `);

  console.log("\n=== BOARD DOCUMENTS ===");
  console.log(`Total: ${boardDocs.length}`);
  console.log(`  With photo: ${boardDocs.filter(d => d.hasPhoto).length}`);
  console.log(`  Archived: ${boardDocs.filter(d => d.archived).length}`);
  console.log(`  Referenced: ${boardDocs.filter(d => d.referencedBy.length > 0).length}`);
  console.log(`  Unreferenced: ${boardDocs.filter(d => d.referencedBy.length === 0).length}`);

  console.log("\n--- Board docs with references ---");
  for (const doc of boardDocs.filter(d => d.referencedBy.length > 0)) {
    console.log(`  ${doc._id}: ${doc.firstName} ${doc.lastName} (photo: ${doc.hasPhoto}, archived: ${doc.archived})`);
    console.log(`    Referenced by: ${doc.referencedBy.join(", ")}`);
  }

  console.log("\n--- Board docs WITHOUT references ---");
  for (const doc of boardDocs.filter(d => d.referencedBy.length === 0)) {
    console.log(`  ${doc._id}: ${doc.firstName} ${doc.lastName} (photo: ${doc.hasPhoto}, archived: ${doc.archived})`);
  }

  console.log("\n=== PSD STAFF ===");
  console.log(`Total: ${psdDocs.length} (active: ${psdDocs.filter(d => !d.archived).length})`);
  for (const doc of psdDocs.filter(d => !d.archived)) {
    console.log(`  ${doc._id} (psdId: ${doc.psdId}): ${doc.firstName} ${doc.lastName} (photo: ${doc.hasPhoto})`);
  }

  console.log("\n=== MANUAL STAFF ===");
  console.log(`Total: ${manualDocs.length}`);
  for (const doc of manualDocs) {
    console.log(`  ${doc._id}: ${doc.firstName} ${doc.lastName} (photo: ${doc.hasPhoto}, archived: ${doc.archived})`);
  }

  console.log("\n=== TEAM REFERENCES ===");
  for (const team of teams) {
    console.log(`\n${team._id} (${team.title}):`);
    if (team.members) {
      for (const m of team.members) {
        console.log(`  - ${m._ref}`);
      }
    } else {
      console.log("  (no members)");
    }
  }

  // Output JSON for further processing
  const output = { boardDocs, psdDocs, manualDocs, teams };
  const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "audit-result.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log("\nFull data written to audit-result.json");
}

main().catch(console.error);
