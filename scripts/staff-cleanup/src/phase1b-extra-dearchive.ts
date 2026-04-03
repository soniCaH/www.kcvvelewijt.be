/**
 * Phase 1b — Additional dearchives + cleanup duplicate manual doc
 */
import { client } from "./sanity-client";

const EXTRA_DEARCHIVE = [
  "staffMember-psd-1072",   // Maarten Weber
  "staffMember-psd-11111",  // Kissy Peremans
  "staffMember-psd-12101",  // Jeroen Peeters
  "staffMember-psd-6532",   // Pieter Joanna De Keyser (= Pieter De Keyser)
];

const MANUAL_TO_DELETE = "staffMember-manual-pieter-de-keyser";

async function main() {
  console.log("=== Extra dearchives ===\n");

  for (const id of EXTRA_DEARCHIVE) {
    const doc = await client.fetch<{ _id: string; firstName: string; lastName: string } | null>(
      `*[_id == $id][0]{ _id, firstName, lastName }`,
      { id }
    );
    if (!doc) {
      console.log(`  WARNING: ${id} not found`);
      continue;
    }
    console.log(`  + ${doc.firstName} ${doc.lastName} (${id})`);
    await client.patch(id).set({ archived: false }).commit();
    try {
      await client.patch(`drafts.${id}`).set({ archived: false }).commit();
    } catch {
      // draft doesn't exist
    }
  }

  console.log("\n=== Removing duplicate manual doc ===\n");

  const manual = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{ _id }`,
    { id: MANUAL_TO_DELETE }
  );

  if (manual) {
    console.log(`  Deleting ${MANUAL_TO_DELETE} (PSD version exists as staffMember-psd-6532)`);
    await client.delete(MANUAL_TO_DELETE);
    try { await client.delete(`drafts.${MANUAL_TO_DELETE}`); } catch { /* */ }
  } else {
    console.log(`  ${MANUAL_TO_DELETE} not found — already cleaned up`);
  }

  console.log("\nDone.");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
