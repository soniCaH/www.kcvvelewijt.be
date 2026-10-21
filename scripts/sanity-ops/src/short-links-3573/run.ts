import {
  planSeed,
  preflight,
  type ExistingDoc,
  type PlanRow,
  type ShortLinkDoc,
} from "./plan";

/** The slice of `@sanity/client` the seed uses, so a test can fake it. */
export interface SeedClient {
  config: () => { dataset?: string };
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
  transaction: () => {
    createOrReplace: (doc: ShortLinkDoc) => unknown;
    commit: () => Promise<{ transactionId: string }>;
  };
}

export interface SeedOptions {
  client: SeedClient;
  /** `--execute`. Without it nothing is written. */
  execute: boolean;
  /** The dataset the operator asked for (`SANITY_DATASET`). */
  requestedDataset: string;
  /** `CONFIRM_PRODUCTION_SHORT_LINKS=yes`. */
  productionConfirmed: boolean;
  log: (line: string) => void;
  error: (line: string) => void;
}

/**
 * Every short link that uses a seed name, plus the published, draft and release
 * copies of a seed id (the id is the last dot-segment of all three).
 * `perspective: "raw"` on the client the caller passes: a draft or release copy
 * must show up here, not be waved through.
 */
const EXISTING_QUERY = `*[_type == "shortLink" && (name in $names || string::split(_id, ".")[-1] in $ids)]{ _id, name, target }`;

const describeRow = ({ action, doc, before }: PlanRow) =>
  action === "update"
    ? `  update    ${doc._id}  /${doc.name}  ${before} → ${doc.target}`
    : `  ${action.padEnd(9)} ${doc._id}  /${doc.name} → ${doc.target}`;

/** Returns the process exit code. Never throws on a refusal. */
export async function runSeed(options: SeedOptions): Promise<number> {
  const { client, execute, requestedDataset, log, error } = options;

  // The guard reads the dataset the client really uses — `getCliClient({dataset})`
  // silently ignores that option and hits production, so an env var is no proof.
  const dataset = client.config().dataset;
  if (dataset !== requestedDataset) {
    error(
      `Refusing to run: asked for dataset "${requestedDataset}" but the client uses "${dataset}".`,
    );
    return 1;
  }
  if (dataset !== "staging" && dataset !== "production") {
    error(`Refusing to run on dataset "${dataset}".`);
    return 1;
  }
  log(`Dataset ${dataset}`);

  const names = planSeed([]).map((row) => row.doc.name);
  const ids = planSeed([]).map((row) => row.doc._id);
  const existing = await client.fetch<ExistingDoc[]>(EXISTING_QUERY, {
    names,
    ids,
  });

  const problems = preflight(existing);
  if (problems.length > 0) {
    error(`\nRefusing to run — ${problems.length} problem(s):`);
    for (const problem of problems) error(`  ✗ ${problem}`);
    return 1;
  }

  const plan = planSeed(existing);
  log("");
  for (const row of plan) log(describeRow(row));

  const changes = plan.filter((row) => row.action !== "unchanged");
  if (changes.length === 0) {
    log("\nEvery short link is already there — nothing to do.");
    return 0;
  }
  if (!execute) {
    log("\nDry run — nothing written. Add --execute to write.");
    return 0;
  }
  if (dataset === "production" && !options.productionConfirmed) {
    error(
      "\nRefusing to write production without CONFIRM_PRODUCTION_SHORT_LINKS=yes.\n" +
        "Run: CONFIRM_PRODUCTION_SHORT_LINKS=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops short-links --execute",
    );
    return 1;
  }

  const tx = client.transaction();
  for (const { doc } of changes) tx.createOrReplace(doc);
  const result = await tx.commit();
  log(`\nDone. Transaction ${result.transactionId} on ${dataset}.`);
  return 0;
}
