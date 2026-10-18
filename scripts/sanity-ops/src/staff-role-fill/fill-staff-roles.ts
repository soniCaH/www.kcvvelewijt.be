/**
 * One-off fill of `team.staff[].role = "andere"` (#3560). Read-only: it never
 * writes to Sanity. It lists every empty role on a team with a `psdId`, and
 * with `--out=<dir>` writes the revision-pinned `mutations.json` plus an
 * `apply.sh` that the owner runs by hand after reviewing the list.
 *
 * Run:
 *   SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops staff-role:fill                       # list
 *   SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops staff-role:fill --out=/abs/dir        # + files
 *   ... --add=<key,key> --skip=<key,key>   # move staff in or out of the proposal
 *
 * A staff `_key` is the member's PSD id (the sync writes it), so one key in
 * `--add` / `--skip` moves that person on every team they are listed on.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dataset, draftAwareClient } from "../shared/sanity-client";
import {
  applyScript,
  buildMutations,
  classifyEmptyRoles,
  type EmptyRoleEntry,
  type TeamRow,
} from "./plan";

const arg = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const keys = (name: string) =>
  new Set((arg(name) ?? "").split(",").filter(Boolean));

const line = (e: EmptyRoleEntry) =>
  `  ${e.team.padEnd(28)} ${e.name.padEnd(28)} ${(e.functionTitle ?? "(geen PSD-titel)").padEnd(28)} ${e.key}${e.docId.startsWith("drafts.") ? "  [draft]" : ""}`;

async function main() {
  // Draft-aware on purpose: a team draft still holds the empty role, and
  // publishing it later would undo the fill on the published document.
  const rows = await draftAwareClient.fetch<TeamRow[]>(
    `*[_type == "team" && defined(psdId)] | order(name asc){
      _id, _rev, name,
      "staff": staff[]{ _key, role, "member": member->{ firstName, lastName, functionTitle } }
    }`,
  );
  if (rows.length === 0) {
    // A private dataset answers a tokenless read with [] instead of an error.
    console.error("No teams read — check the token and dataset.");
    process.exit(1);
  }
  const { andere, undecided } = classifyEmptyRoles(rows, {
    add: keys("add"),
    skip: keys("skip"),
  });

  console.log(`\nDataset ${dataset}: ${rows.length} PSD team documents read.`);
  console.log(`\nSet to "andere" (${andere.length}):`);
  andere.forEach((e) => console.log(line(e)));
  console.log(`\nLeft empty — "nog niet ingevuld" (${undecided.length}):`);
  undecided.forEach((e) => console.log(line(e)));

  const out = arg("out");
  if (!out) {
    console.log(
      "\nDry run — add --out=<dir> to write mutations.json + apply.sh.",
    );
    return;
  }
  const mutations = buildMutations(andere);
  if (mutations.length === 0) {
    console.log("\nNothing to fill — no files written.");
    return;
  }
  const dir = resolve(out);
  mkdirSync(dir, { recursive: true });
  const mutationsPath = join(dir, "mutations.json");
  writeFileSync(mutationsPath, `${JSON.stringify({ mutations }, null, 2)}\n`);
  writeFileSync(join(dir, "apply.sh"), applyScript(mutationsPath, dataset), {
    mode: 0o755,
  });
  console.log(
    `\nWrote ${mutations.length} patches (${andere.length} entries) to ${mutationsPath}\nApply: bash ${join(dir, "apply.sh")}`,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
