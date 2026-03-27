/**
 * Migration: rename Sanity document type responsibilityPath → responsibility
 *
 * Fetches all documents with _type == "responsibilityPath" and re-creates them
 * with _type == "responsibility", preserving _id and all field values.
 * References (relatedPaths) reference by _id and are unaffected by the type rename.
 *
 * Run against staging first, then production.
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=xxx SANITY_DATASET=production \
 *     npx tsx src/migrate-responsibility-type.ts
 */

import "dotenv/config";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "staging",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

async function main() {
  const dataset = process.env.SANITY_DATASET ?? "staging";
  console.log(`[migrate] Targeting dataset: ${dataset}`);

  const docs = await client.fetch<Array<Record<string, unknown>>>(
    '*[_type == "responsibilityPath"]',
  );

  console.log(`[migrate] Found ${docs.length} responsibilityPath document(s)`);

  if (docs.length === 0) {
    console.log("[migrate] Nothing to migrate.");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const doc of docs) {
    const id = doc._id as string;
    try {
      // createOrReplace replaces the entire document at the given _id,
      // allowing _type to change. _id is preserved; _rev is managed by Sanity.
      await client.createOrReplace({
        ...doc,
        _type: "responsibility",
      });
      console.log(`[migrate] ✓ ${id}`);
      successCount++;
    } catch (err) {
      console.error(`[migrate] ✗ ${id}:`, err);
      errorCount++;
    }
  }

  console.log(
    `[migrate] Done. ${successCount} migrated, ${errorCount} failed.`,
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
