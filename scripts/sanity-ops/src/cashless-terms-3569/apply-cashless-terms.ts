/**
 * The cashless terms get their own page before Drupal goes (#3569, part of
 * #3547). Dry run by default: prints the page it would create and the
 * before/after of the `cashless` paragraph it would patch, and writes nothing.
 *
 *   1. Create the `page` at `/club/cashless/voorwaarden`, the 11 sections
 *      copied verbatim from Drupal (`terms.ts`).
 *   2. Patch the "Algemene voorwaarden" paragraph of the `cashless` page to
 *      link to it, pinned to the revision read.
 *
 * Run:
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops cashless-terms             # dry run
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops cashless-terms --execute   # write
 *   CONFIRM_PRODUCTION_CASHLESS_TERMS=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops cashless-terms --execute
 *
 * Both writes are one transaction: the new page is created and the patch is
 * pinned to the revision read, so a `cashless` page saved since fails the
 * whole thing instead of being overwritten.
 */
import { client, draftAwareClient } from "../shared/sanity-client";
import {
  CASHLESS_ID,
  TERMS_ID,
  TERMS_SLUG,
  buildCashlessPatch,
  buildTermsPage,
  preflight,
  type CashlessDoc,
  type Snapshot,
} from "./plan";

const EXECUTE = process.argv.includes("--execute");

// The guard reads the dataset the client really uses — `getCliClient({dataset})`
// silently ignores that option and hits production, so an env var is no proof.
const { dataset } = client.config();

async function readSnapshot(): Promise<Snapshot> {
  // `perspective: "raw"` on purpose (`draftAwareClient`): the revision pinned
  // below must be the published document's, and a draft or a content-release
  // version of either page would be published over this write.
  const [cashless, existingTerms, drafts] = await Promise.all([
    draftAwareClient.fetch<CashlessDoc | null>(
      `*[_id == $id][0]{ _id, _rev, body }`,
      { id: CASHLESS_ID },
    ),
    draftAwareClient.fetch<string[]>(
      `*[_type == "page" && (_id == $id || slug.current == $slug)]._id`,
      { id: TERMS_ID, slug: TERMS_SLUG },
    ),
    draftAwareClient.fetch<string[]>(
      `*[_id in [$a, $b] || (_id in path("versions.**") && string::split(_id, ".")[2] in [$c, $d])]._id`,
      {
        a: `drafts.${CASHLESS_ID}`,
        b: `drafts.${TERMS_ID}`,
        c: CASHLESS_ID,
        d: TERMS_ID,
      },
    ),
  ]);
  return { cashless, existingTerms, drafts };
}

async function main() {
  if (dataset !== "staging" && dataset !== "production") {
    console.error(`Refusing to run on dataset "${dataset}".`);
    process.exit(1);
  }
  const snap = await readSnapshot();
  const errors = preflight(snap);
  if (errors.length > 0) {
    console.error(`\nRefusing to run — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  const page = buildTermsPage();
  const patch = buildCashlessPatch(snap.cashless!);

  console.log(`\nDataset ${dataset}:`);
  console.log(`\nCreate page ${page._id} → /club/${page.slug.current}`);
  console.log(`  title: ${page.title}`);
  for (const b of page.body) {
    const text = b.children.map((c) => c.text).join("");
    console.log(
      b.style === "h2"
        ? `\n  ## ${text}`
        : `    ${text.length > 90 ? `${text.slice(0, 87)}...` : text}`,
    );
  }
  console.log(
    `\n  ${page.body.filter((b) => b.style === "h2").length} sections.`,
  );

  if (patch) {
    console.log(`\nPatch ${patch.id} @ ${patch.rev}, block ${patch.blockKey}:`);
    console.log(`  before: ${patch.before}\n  after:  ${patch.after}`);
  } else {
    console.log(`\n${CASHLESS_ID} already links to the terms — no patch.`);
  }

  if (!EXECUTE) {
    console.log("\nDry run — nothing written. Add --execute to write.");
    return;
  }
  if (
    dataset === "production" &&
    process.env.CONFIRM_PRODUCTION_CASHLESS_TERMS !== "yes"
  ) {
    console.error(
      "\nRefusing to write production without CONFIRM_PRODUCTION_CASHLESS_TERMS=yes.\n" +
        "Run: CONFIRM_PRODUCTION_CASHLESS_TERMS=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops cashless-terms --execute",
    );
    process.exit(1);
  }

  const tx = client.transaction().create(page);
  if (patch) {
    tx.patch(
      client
        .patch(patch.id)
        .ifRevisionId(patch.rev)
        .set({ [`body[_key=="${patch.blockKey}"]`]: patch.block }),
    );
  }
  const result = await tx.commit();
  console.log(`\nDone. Transaction ${result.transactionId} on ${dataset}.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
