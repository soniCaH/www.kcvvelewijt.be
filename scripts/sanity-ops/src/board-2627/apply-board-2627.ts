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
import { client, dataset, draftAwareClient } from "../shared/sanity-client";
import {
  NODE_CREATES,
  NODE_UPDATES,
  STAFF,
  STAFF_CREATES,
  TOPIC_UPDATES,
  TOUCHED_IDS,
  preflight,
  type Snapshot,
  type TopicUpdate,
} from "./plan";

const EXECUTE = process.argv.includes("--execute");

interface NodeRow {
  _id: string;
  _rev: string;
  title: string;
  members: Array<{ _id: string; name: string }> | null;
}

interface TopicRow {
  _id: string;
  _rev: string;
  primaryRef?: string;
  summary?: string;
  steps: Array<{ _key: string; description?: string }> | null;
}

function memberRef(id: string) {
  return { _type: "reference", _ref: id, _key: id.replace(/[^a-z0-9-]/gi, "") };
}

async function readSnapshot() {
  const nodeIds = [
    ...NODE_UPDATES.map((n) => n.id),
    ...NODE_CREATES.map((n) => n._id),
    ...NODE_CREATES.map((n) => n.parent),
  ];
  const [staffRows, nodeRows, topicRows, pending] = await Promise.all([
    client.fetch<
      Array<{
        _id: string;
        firstName: string;
        lastName: string;
        archived?: boolean;
      }>
    >(
      `*[_type == "staffMember" && _id in $ids]{ _id, firstName, lastName, archived }`,
      { ids: Object.keys(STAFF) },
    ),
    client.fetch<NodeRow[]>(
      `*[_type == "organigramNode" && _id in $ids]{ _id, _rev, title, "members": members[]->{ _id, "name": firstName + " " + lastName } }`,
      { ids: nodeIds },
    ),
    client.fetch<TopicRow[]>(
      `*[_type == "responsibility" && _id in $ids]{ _id, _rev, "primaryRef": primaryContact.organigramNode._ref, summary, "steps": steps[]{ _key, description } }`,
      { ids: TOPIC_UPDATES.map((t) => t.id) },
    ),
    // Draft-aware on purpose: a pending draft or content-release version of a
    // document written here would be published over this update later, so its
    // existence must be seen.
    draftAwareClient.fetch<string[]>(
      `*[_id in $drafts || _id in path("versions.**")]._id`,
      { drafts: TOUCHED_IDS.map((id) => `drafts.${id}`) },
    ),
  ]);

  const touched = new Set(TOUCHED_IDS);
  const snap: Snapshot = {
    staff: Object.fromEntries(
      staffRows.map((s) => [
        s._id,
        { name: `${s.firstName} ${s.lastName}`, archived: s.archived ?? false },
      ]),
    ),
    nodes: Object.fromEntries(nodeRows.map((n) => [n._id, { rev: n._rev }])),
    topics: Object.fromEntries(
      topicRows.map((t) => [
        t._id,
        {
          rev: t._rev,
          primaryRef: t.primaryRef,
          summary: t.summary,
          steps: Object.fromEntries(
            (t.steps ?? []).map((s) => [s._key, s.description]),
          ),
        },
      ]),
    ),
    // drafts.<id> is already scoped; versions.<release>.<id> is matched on the id.
    pending: pending.filter(
      (id) =>
        id.startsWith("drafts.") ||
        touched.has(id.split(".").slice(2).join(".")),
    ),
  };
  return { snap, nodeRows };
}

/** True when every field of the topic already holds its new value. */
function topicDone(t: TopicUpdate, snap: Snapshot): boolean {
  const cur = snap.topics[t.id];
  return (
    (!t.primaryRef || cur?.primaryRef === t.primaryRef.to) &&
    (!t.summary || cur?.summary === t.summary.to) &&
    Object.entries(t.steps ?? {}).every(([k, c]) => cur?.steps[k] === c.to)
  );
}

function printPlan(snap: Snapshot, nodeRows: NodeRow[]) {
  const current = new Map(nodeRows.map((n) => [n._id, n]));
  const planned = (ids: string[]) =>
    ids.length ? ids.map((id) => STAFF[id]).join(", ") : "—";
  const now = (row?: NodeRow) =>
    row?.members?.length ? row.members.map((m) => m.name).join(", ") : "—";

  console.log("\nPeople to create:");
  for (const s of STAFF_CREATES) {
    console.log(
      `  ${s._id in snap.staff ? "exists " : "create "} ${s.firstName} ${s.lastName}`,
    );
  }

  console.log("\nPositions to update:");
  for (const n of NODE_UPDATES) {
    const row = current.get(n.id);
    const title =
      n.title && n.title !== row?.title
        ? `${row?.title} → ${n.title}`
        : (row?.title ?? n.id);
    const active = n.active === false ? "  [deactivated]" : "";
    console.log(
      `  ${title}${active}\n      ${now(row)}\n    → ${planned(n.members)}`,
    );
  }

  console.log("\nPositions to create (an existing one is reset to this):");
  for (const n of NODE_CREATES) {
    const row = current.get(n._id);
    console.log(
      `  ${row ? "exists " : "create "} ${n.title} (${n.department})` +
        (row ? `\n      ${now(row)}` : "") +
        `\n    → ${planned(n.members)}`,
    );
  }

  console.log("\nHelp topics:");
  for (const t of TOPIC_UPDATES) {
    console.log(`  ${t.id}${topicDone(t, snap) ? "  (already applied)" : ""}`);
    if (t.primaryRef)
      console.log(`      contact: ${t.primaryRef.from} → ${t.primaryRef.to}`);
    if (t.summary) console.log(`      summary: "${t.summary.to}"`);
    for (const [key, change] of Object.entries(t.steps ?? {})) {
      console.log(`      step ${key}: "${change.to}"`);
    }
  }
}

async function write(snap: Snapshot) {
  const tx = client.transaction();

  for (const s of STAFF_CREATES) tx.createIfNotExists(s);

  // createIfNotExists + set, so a re-run resets a new position to the plan
  // instead of skipping it when it already exists.
  for (const n of NODE_CREATES) {
    const doc = {
      title: n.title,
      roleCode: n.roleCode,
      department: n.department,
      parentNode: { _type: "reference", _ref: n.parent, _weak: true },
      sortOrder: n.sortOrder,
      active: true,
      members: n.members.map(memberRef),
    };
    tx.createIfNotExists({ _id: n._id, _type: "organigramNode", ...doc });
    tx.patch(client.patch(n._id).set(doc));
  }

  // ifRevisionId: the preflight judged the document at this revision. If an
  // editor saved it since, the whole transaction fails instead of overwriting.
  for (const n of NODE_UPDATES) {
    tx.patch(
      client
        .patch(n.id)
        .ifRevisionId(snap.nodes[n.id]!.rev)
        .set({
          members: n.members.map(memberRef),
          ...(n.title ? { title: n.title } : {}),
          ...(n.active !== undefined ? { active: n.active } : {}),
        }),
    );
  }

  for (const t of TOPIC_UPDATES) {
    tx.patch(
      client
        .patch(t.id)
        .ifRevisionId(snap.topics[t.id]!.rev)
        .set({
          ...(t.primaryRef
            ? { "primaryContact.organigramNode._ref": t.primaryRef.to }
            : {}),
          ...(t.summary ? { summary: t.summary.to } : {}),
          ...Object.fromEntries(
            Object.entries(t.steps ?? {}).map(([key, change]) => [
              `steps[_key=="${key}"].description`,
              change.to,
            ]),
          ),
        }),
    );
  }

  const result = await tx.commit();
  console.log(`\nDone. Transaction ${result.transactionId} on ${dataset}.`);
}

async function main() {
  const { snap, nodeRows } = await readSnapshot();

  const errors = preflight(snap);
  if (errors.length > 0) {
    console.error(`\nRefusing to run — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  printPlan(snap, nodeRows);

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
