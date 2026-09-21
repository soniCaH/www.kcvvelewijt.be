/**
 * Deletes the legacy `responsibilityPath` documents, the March 2026 set the
 * type rename (#910) never migrated.
 *
 * Safe to run only after `restore-missing-responsibilities.ts`, which recreates
 * the six topics that were never carried over in any form. This script refuses
 * to run until those six exist and are active, so the order cannot be got
 * wrong.
 *
 * Vectorize is a separate store with no Sanity binding, so the 40 stale vectors
 * cannot be removed from here. The script prints the exact `wrangler` command
 * for them once the documents are gone.
 *
 * Run against staging first, then production.
 *
 * Usage:
 *   SANITY_DATASET=staging  pnpm delete-legacy          # dry run, lists only
 *   SANITY_DATASET=staging  pnpm delete-legacy -- --confirm
 */

import { stripDraftPrefix } from "./draft-id";
import { client, dataset, draftAwareClient } from "./sanity-client";

/** The six topics that existed only as `responsibilityPath`. */
const RESTORED_SLUGS = [
  "pestgedrag-melden",
  "discriminatie-melden",
  "ongepast-gedrag-rapporteren",
  "keeper-worden",
  "sportief-verantwoordelijke-zoeken",
  "prosoccerdata-gebruiken",
];

interface LegacyDoc {
  _id: string;
  slug: string | null;
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  console.log(`[delete-legacy] Targeting dataset: ${dataset}`);

  // The restore must have landed first, or deleting these drops six topics —
  // three of them safeguarding — with nothing standing in their place.
  const restored = await client.fetch<string[]>(
    '*[_type == "responsibility" && active == true && slug.current in $slugs].slug.current',
    { slugs: RESTORED_SLUGS },
  );
  const notRestored = RESTORED_SLUGS.filter((s) => !restored.includes(s));
  if (notRestored.length > 0) {
    console.error(
      `[delete-legacy] Refusing to run. These topics are not yet active as "responsibility": ${notRestored.join(", ")}`,
    );
    console.error("[delete-legacy] Run restore-missing-responsibilities.ts first.");
    process.exit(1);
  }
  console.log(`[delete-legacy] All ${RESTORED_SLUGS.length} restored topic(s) are active.`);

  // Draft-aware: a legacy document that survives only as a draft must still be
  // deleted, or it is left dangling once this script reports success (#2839).
  const docs = await draftAwareClient.fetch<LegacyDoc[]>(
    '*[_type == "responsibilityPath"]{_id, "slug": slug.current} | order(_id asc)',
  );

  if (docs.length === 0) {
    console.log("[delete-legacy] Nothing to delete.");
    return;
  }

  // Every id in this set is `responsibility-path-*` once a `drafts.` prefix is
  // stripped: the migration preserved `_id`, so a document under any other
  // shape would mean the query caught something this script was not written for.
  const unexpected = docs.filter((d) => !stripDraftPrefix(d._id).startsWith("responsibility-path-"));
  if (unexpected.length > 0) {
    console.error(
      `[delete-legacy] Refusing to run. Unexpected _id shape: ${unexpected.map((d) => d._id).join(", ")}`,
    );
    process.exit(1);
  }

  console.log(`[delete-legacy] ${docs.length} legacy document(s):`);
  for (const d of docs) console.log(`    ${d._id}`);

  if (!confirm) {
    console.log("");
    console.log("[delete-legacy] Dry run. Re-run with --confirm to delete.");
    return;
  }

  // One transaction: 40 documents either all go or none do, so a mid-run
  // failure cannot leave the set half-deleted.
  const tx = docs.reduce((t, d) => t.delete(d._id), client.transaction());
  await tx.commit();
  console.log(`[delete-legacy] Deleted ${docs.length} document(s) from "${dataset}".`);

  console.log("");
  console.log("[delete-legacy] Now remove their vectors (Vectorize is a separate store):");
  console.log("");
  console.log(
    `  cd apps/api && pnpm wrangler vectorize delete-vectors kcvv-search --ids ${docs
      .map((d) => d._id)
      .join(" ")}`,
  );
}

main().catch((err) => {
  console.error("[delete-legacy] Fatal error:", err);
  process.exit(1);
});
