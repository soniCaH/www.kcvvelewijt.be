/**
 * One-off cleanup for the PSD privacy fix (#3469). Dry run by default: prints
 * the count per action and writes nothing.
 *
 *   1. Unset `birthDate` on every staffMember (the sync no longer stores it).
 *   2. Delete every `player-psd-*` / `staffMember-psd-*` image asset that no
 *      document references (superseded or removed portraits).
 *
 * Run:
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops psd-privacy:cleanup            # dry run
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops psd-privacy:cleanup --execute  # write
 *   CONFIRM_PRODUCTION_PSD_PRIVACY_CLEANUP=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops psd-privacy:cleanup --execute
 */
import { client, dataset, draftAwareClient } from "../shared/sanity-client";
import {
  selectStaffToUnset,
  selectUnreferencedPortraitAssets,
  type AssetRow,
  type StaffRow,
} from "./plan";

const EXECUTE = process.argv.includes("--execute");
const BATCH = 100;

// Draft-aware on purpose, for both reads: a staff draft still holds the birth
// date, and a draft that references an asset must keep that asset alive.
async function readSnapshot() {
  const [staff, assets] = await Promise.all([
    draftAwareClient.fetch<StaffRow[]>(
      `*[_type == "staffMember" && defined(birthDate)]{ _id, _rev, birthDate }`,
    ),
    draftAwareClient.fetch<AssetRow[]>(
      `*[_type == "sanity.imageAsset" && defined(originalFilename) && (string::startsWith(originalFilename, "player-psd-") || string::startsWith(originalFilename, "staffMember-psd-"))]{ _id, _rev, originalFilename, "refs": count(*[references(^._id)]) }`,
    ),
  ]);
  return {
    staff: selectStaffToUnset(staff),
    assets: selectUnreferencedPortraitAssets(assets),
  };
}

const chunks = <T>(list: T[]): T[][] =>
  Array.from({ length: Math.ceil(list.length / BATCH) }, (_, i) =>
    list.slice(i * BATCH, (i + 1) * BATCH),
  );

async function main() {
  const { staff, assets } = await readSnapshot();

  console.log(`\nDataset ${dataset}:`);
  console.log(`  staffMember documents to unset birthDate on: ${staff.length}`);
  console.log(
    `  unreferenced PSD portrait assets to delete:  ${assets.length}`,
  );

  if (!EXECUTE) {
    console.log("\nDry run — nothing written. Add --execute to write.");
    return;
  }
  if (
    dataset === "production" &&
    process.env.CONFIRM_PRODUCTION_PSD_PRIVACY_CLEANUP !== "yes"
  ) {
    console.error(
      "\nRefusing to write production without CONFIRM_PRODUCTION_PSD_PRIVACY_CLEANUP=yes.\n" +
        "Run: CONFIRM_PRODUCTION_PSD_PRIVACY_CLEANUP=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops psd-privacy:cleanup --execute",
    );
    process.exit(1);
  }

  // Patches are pinned to the revision read: a document an editor saved since
  // fails the transaction instead of being overwritten (re-run to pick it up).
  for (const batch of chunks(staff)) {
    const tx = client.transaction();
    for (const s of batch) {
      tx.patch(client.patch(s._id).ifRevisionId(s._rev).unset(["birthDate"]));
    }
    await tx.commit();
  }
  // No revision pin on deletes: Sanity itself refuses to delete a document
  // that is still referenced, so an asset that gained a reference since the
  // read fails the batch rather than breaking a reference.
  for (const batch of chunks(assets)) {
    const tx = client.transaction();
    for (const a of batch) tx.delete(a._id);
    await tx.commit();
  }
  console.log(
    `\nDone. Unset birthDate on ${staff.length} staff, deleted ${assets.length} assets on ${dataset}.`,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
