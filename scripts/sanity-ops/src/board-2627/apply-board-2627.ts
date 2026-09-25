/**
 * Applies the 2026-2027 board update in ./plan.ts (#3184).
 *
 * Dry run by default: prints every position's people before → after and every
 * help-topic text it changes, and writes nothing.
 *
 * Run:
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops board-2627            # dry run
 *   SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops board-2627 --execute  # write
 *   CONFIRM_PRODUCTION_BOARD_UPDATE=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops board-2627 --execute
 */
import { memberRef, ref } from "../shared/refs";
import { client, dataset, draftAwareClient } from "../shared/sanity-client";
import {
  NODE_CREATES,
  NODE_UPDATES,
  PRIMARY_CONTACT,
  STAFF,
  STAFF_CREATES,
  SUMMARY,
  TOPIC_UPDATES,
  TOUCHED_IDS,
  preflight,
  stepPath,
  topicDone,
  type Snapshot,
} from "./plan";

const EXECUTE = process.argv.includes("--execute");

async function readSnapshot(): Promise<Snapshot> {
  const nodeIds = [
    ...NODE_UPDATES.map((n) => n.id),
    ...NODE_CREATES.map((n) => n._id),
    ...NODE_CREATES.map((n) => n.parent),
  ];
  const [staffRows, nodeRows, topicRows, pending] = await Promise.all([
    client.fetch<Array<{ _id: string; name: string; archived?: boolean }>>(
      `*[_type == "staffMember" && _id in $ids]{ _id, "name": firstName + " " + lastName, archived }`,
      { ids: Object.keys(STAFF) },
    ),
    client.fetch<
      Array<{
        _id: string;
        _rev: string;
        title: string;
        members: Array<{ name: string }> | null;
      }>
    >(
      `*[_type == "organigramNode" && _id in $ids]{ _id, _rev, title, "members": members[]->{ "name": firstName + " " + lastName } }`,
      { ids: nodeIds },
    ),
    client.fetch<
      Array<{
        _id: string;
        _rev: string;
        primaryRef?: string;
        summary?: string;
        steps: Array<{ _key: string; description?: string }> | null;
      }>
    >(
      `*[_type == "responsibility" && _id in $ids]{ _id, _rev, "primaryRef": primaryContact.organigramNode._ref, summary, "steps": steps[]{ _key, description } }`,
      { ids: TOPIC_UPDATES.map((t) => t.id) },
    ),
    // Draft-aware on purpose: a pending draft or content-release version
    // (versions.<release>.<id>) of a document written here would be published
    // over this update later, so its existence must be seen.
    draftAwareClient.fetch<string[]>(
      `*[_id in $drafts || (_id in path("versions.**") && string::split(_id, ".")[2] in $ids)]._id`,
      { drafts: TOUCHED_IDS.map((id) => `drafts.${id}`), ids: TOUCHED_IDS },
    ),
  ]);

  return {
    staff: Object.fromEntries(
      staffRows.map((s) => [
        s._id,
        { name: s.name, archived: s.archived ?? false },
      ]),
    ),
    nodes: Object.fromEntries(
      nodeRows.map((n) => [
        n._id,
        {
          rev: n._rev,
          title: n.title,
          memberNames: (n.members ?? []).map((m) => m.name),
        },
      ]),
    ),
    topics: Object.fromEntries(
      topicRows.map((t) => [
        t._id,
        {
          rev: t._rev,
          values: {
            [PRIMARY_CONTACT]: t.primaryRef,
            [SUMMARY]: t.summary,
            ...Object.fromEntries(
              (t.steps ?? []).map((s) => [stepPath(s._key), s.description]),
            ),
          },
        },
      ]),
    ),
    pending,
  };
}

function printPlan(snap: Snapshot) {
  const names = (list?: string[]) => (list?.length ? list.join(", ") : "—");
  const planned = (ids: string[]) => names(ids.map((id) => STAFF[id]!));

  console.log("\nPeople to create:");
  for (const s of STAFF_CREATES) {
    console.log(
      `  ${s._id in snap.staff ? "exists " : "create "} ${s.firstName} ${s.lastName}`,
    );
  }

  console.log("\nPositions to update:");
  for (const n of NODE_UPDATES) {
    const cur = snap.nodes[n.id];
    const title =
      n.title && n.title !== cur?.title
        ? `${cur?.title} → ${n.title}`
        : (cur?.title ?? n.id);
    const active = n.active === false ? "  [deactivated]" : "";
    console.log(
      `  ${title}${active}\n      ${names(cur?.memberNames)}\n    → ${planned(n.members)}`,
    );
  }

  console.log("\nPositions to create (an existing one is reset to this):");
  for (const n of NODE_CREATES) {
    const cur = snap.nodes[n._id];
    console.log(
      `  ${cur ? "exists " : "create "} ${n.title} (${n.department})` +
        (cur ? `\n      ${names(cur.memberNames)}` : "") +
        `\n    → ${planned(n.members)}`,
    );
  }

  console.log("\nHelp topics:");
  for (const t of TOPIC_UPDATES) {
    console.log(`  ${t.id}${topicDone(t, snap) ? "  (already applied)" : ""}`);
    for (const c of t.changes) console.log(`      ${c.path}: "${c.to}"`);
  }
}

async function write(snap: Snapshot) {
  const tx = client.transaction();

  for (const s of STAFF_CREATES) tx.createIfNotExists(s);

  // One write path for positions: an existing one is patched at the revision
  // the preflight judged — if an editor saved it since, the whole transaction
  // fails instead of overwriting — and a missing one is created.
  const positions = [
    ...NODE_UPDATES.map((n) => ({
      id: n.id,
      fields: {
        members: n.members.map(memberRef),
        ...(n.title ? { title: n.title } : {}),
        ...(n.active !== undefined ? { active: n.active } : {}),
      },
    })),
    ...NODE_CREATES.map((n) => ({
      id: n._id,
      fields: {
        title: n.title,
        roleCode: n.roleCode,
        department: n.department,
        parentNode: ref(n.parent),
        sortOrder: n.sortOrder,
        active: true,
        members: n.members.map(memberRef),
      },
    })),
  ];
  for (const { id, fields } of positions) {
    const cur = snap.nodes[id];
    if (cur) tx.patch(client.patch(id).ifRevisionId(cur.rev).set(fields));
    else tx.create({ _id: id, _type: "organigramNode", ...fields });
  }

  for (const t of TOPIC_UPDATES) {
    tx.patch(
      client
        .patch(t.id)
        .ifRevisionId(snap.topics[t.id]!.rev)
        .set(Object.fromEntries(t.changes.map((c) => [c.path, c.to]))),
    );
  }

  const result = await tx.commit();
  console.log(`\nDone. Transaction ${result.transactionId} on ${dataset}.`);
}

async function main() {
  const snap = await readSnapshot();

  const errors = preflight(snap);
  if (errors.length > 0) {
    console.error(`\nRefusing to run — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  printPlan(snap);

  if (!EXECUTE) {
    console.log("\nDry run — nothing written. Add --execute to write.");
    return;
  }
  if (
    dataset === "production" &&
    process.env.CONFIRM_PRODUCTION_BOARD_UPDATE !== "yes"
  ) {
    console.error(
      "\nRefusing to write production without CONFIRM_PRODUCTION_BOARD_UPDATE=yes.\n" +
        "Run: CONFIRM_PRODUCTION_BOARD_UPDATE=yes SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops board-2627 --execute",
    );
    process.exit(1);
  }
  await write(snap);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
