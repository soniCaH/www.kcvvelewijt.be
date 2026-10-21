/**
 * Seeds the two short links the old site's flyers carry (#3573, ops step
 * #3608): `/tornooi` and `/stage`. Dry run by default: prints the dataset and
 * what it would create or change, and writes nothing.
 *
 * Run:
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops short-links             # dry run
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops short-links --execute   # write
 *   CONFIRM_PRODUCTION_SHORT_LINKS=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops short-links --execute
 *
 * Idempotent: the documents have deterministic ids, so a re-run replaces them
 * (and does nothing at all when they already match).
 */
import { client as publishedClient } from "../shared/sanity-client";
import { runSeed, type SeedClient } from "./run";

// `perspective: "raw"` on purpose: the preflight must see drafts and release
// copies, which a published-only read hides.
const client = publishedClient.withConfig({ perspective: "raw" });

runSeed({
  client: client as unknown as SeedClient,
  execute: process.argv.includes("--execute"),
  requestedDataset: process.env.SANITY_DATASET ?? "staging",
  productionConfirmed: process.env.CONFIRM_PRODUCTION_SHORT_LINKS === "yes",
  log: console.log,
  error: console.error,
}).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error("Fatal error:", err);
    process.exitCode = 1;
  },
);
