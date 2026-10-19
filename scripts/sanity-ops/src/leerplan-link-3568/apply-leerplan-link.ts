/**
 * Repoints the dead Drupal file link in the leerplan article to the PDF the
 * site serves from `apps/web/public/downloads/` (#3568, part of #3547). Dry
 * run by default: prints the before/after of the href and writes nothing.
 *
 * Run:
 *   SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops leerplan-link             # dry run
 *   CONFIRM_PRODUCTION_LEERPLAN_LINK=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops leerplan-link --execute
 *
 * The patch is pinned to the revision read, so an article saved since fails
 * instead of being overwritten.
 */
import { client, draftAwareClient } from "../shared/sanity-client";
import {
  ARTICLE_ID,
  NEW_HREF,
  OLD_HREF,
  buildLinkPatch,
  preflight,
  type ArticleDoc,
  type Snapshot,
} from "./plan";

const EXECUTE = process.argv.includes("--execute");

// The guard reads the dataset the client really uses — `getCliClient({dataset})`
// silently ignores that option and hits production, so an env var is no proof.
const { dataset } = client.config();

async function readSnapshot(): Promise<Snapshot> {
  // `perspective: "raw"` on purpose (`draftAwareClient`): the revision pinned
  // below must be the published document's, and a draft or a content-release
  // version would be published over this write.
  const [article, drafts] = await Promise.all([
    draftAwareClient.fetch<ArticleDoc | null>(
      `*[_id == $id][0]{ _id, _rev, body }`,
      { id: ARTICLE_ID },
    ),
    draftAwareClient.fetch<string[]>(
      `*[_id == $draft || (_id in path("versions.**") && string::split(_id, ".")[2] == $id)]._id`,
      { draft: `drafts.${ARTICLE_ID}`, id: ARTICLE_ID },
    ),
  ]);
  return { article, drafts };
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

  const patch = buildLinkPatch(snap.article!);
  console.log(`\nDataset ${dataset}:`);
  if (!patch) {
    console.log(`${ARTICLE_ID} already links to ${NEW_HREF} — nothing to do.`);
    return;
  }
  console.log(`\nPatch ${patch.id} @ ${patch.rev}:`);
  for (const path of patch.paths) {
    console.log(`  ${path}\n    before: ${OLD_HREF}\n    after:  ${NEW_HREF}`);
  }

  if (!EXECUTE) {
    console.log("\nDry run — nothing written. Add --execute to write.");
    return;
  }
  if (
    dataset === "production" &&
    process.env.CONFIRM_PRODUCTION_LEERPLAN_LINK !== "yes"
  ) {
    console.error(
      "\nRefusing to write production without CONFIRM_PRODUCTION_LEERPLAN_LINK=yes.\n" +
        "Run: CONFIRM_PRODUCTION_LEERPLAN_LINK=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops leerplan-link --execute",
    );
    process.exit(1);
  }

  const result = await client
    .patch(patch.id)
    .ifRevisionId(patch.rev)
    .set(Object.fromEntries(patch.paths.map((p) => [p, NEW_HREF])))
    .commit();
  console.log(`\nDone. Revision ${result._rev} on ${dataset}.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
