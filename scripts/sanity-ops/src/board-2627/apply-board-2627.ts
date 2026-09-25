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
} from "./plan";

const EXECUTE = process.argv.includes("--execute");

interface NodeRow {
  _id: string;
  title: string;
  members: string[] | null;
}

interface TopicRow {
  _id: string;
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
  ];
  const [staffRows, nodeRows, topicRows, drafts] = await Promise.all([
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
      `*[_type == "organigramNode" && _id in $ids]{ _id, title, "members": members[]._ref }`,
      {
        ids: nodeIds,
      },
    ),
    client.fetch<TopicRow[]>(
      `*[_type == "responsibility" && _id in $ids]{ _id, "primaryRef": primaryContact.organigramNode._ref, summary, "steps": steps[]{ _key, description } }`,
      { ids: TOPIC_UPDATES.map((t) => t.id) },
    ),
    // Draft-aware on purpose: a pending draft of a document written here would
    // be published over this update later, so its existence must be seen.
    draftAwareClient.fetch<string[]>(`*[_id in $ids]._id`, {
      ids: TOUCHED_IDS.map((id) => `drafts.${id}`),
    }),
  ]);

  const snap: Snapshot = {
    staff: Object.fromEntries(
      staffRows.map((s) => [
        s._id,
        { name: `${s.firstName} ${s.lastName}`, archived: s.archived ?? false },
      ]),
    ),
    nodes: Object.fromEntries(nodeRows.map((n) => [n._id, { title: n.title }])),
    topics: Object.fromEntries(
      topicRows.map((t) => [
        t._id,
        {
          primaryRef: t.primaryRef,
          summary: t.summary,
          steps: Object.fromEntries(
            (t.steps ?? []).map((s) => [s._key, s.description]),
          ),
        },
      ]),
    ),
    drafts,
  };
  return { snap, nodeRows };
}

/** Names for the dry-run print. Unknown ids — people leaving — are looked up once. */
async function nameLookup(
  nodeRows: NodeRow[],
): Promise<(id: string) => string> {
  const leaving = [...new Set(nodeRows.flatMap((n) => n.members ?? []))].filter(
    (id) => !(id in STAFF),
  );
  const rows = await client.fetch<
    Array<{ _id: string; firstName: string; lastName: string }>
  >(`*[_id in $ids]{ _id, firstName, lastName }`, { ids: leaving });
  const names: Record<string, string> = { ...STAFF };
  for (const r of rows) names[r._id] = `${r.firstName} ${r.lastName}`;
  return (id) => names[id] ?? id;
}

function printPlan(
  snap: Snapshot,
  nodeRows: NodeRow[],
  name: (id: string) => string,
) {
  const current = new Map(nodeRows.map((n) => [n._id, n]));
  const list = (ids: string[]) => (ids.length ? ids.map(name).join(", ") : "—");

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
      `  ${title}${active}\n      ${list(row?.members ?? [])}\n    → ${list(n.members)}`,
    );
  }

  console.log("\nPositions to create:");
  for (const n of NODE_CREATES) {
    console.log(
      `  ${current.has(n._id) ? "exists " : "create "} ${n.title} (${n.department}) → ${list(n.members)}`,
    );
  }

  console.log("\nHelp topics:");
  for (const t of TOPIC_UPDATES) {
    const done = snap.topics[t.id]?.summary === t.summary?.to;
    console.log(`  ${t.id}${done ? "  (already applied)" : ""}`);
    if (t.primaryRef)
      console.log(`      contact: ${t.primaryRef.from} → ${t.primaryRef.to}`);
    if (t.summary) console.log(`      summary: "${t.summary.to}"`);
  }
}

async function write() {
  const tx = client.transaction();

  for (const s of STAFF_CREATES) tx.createIfNotExists(s);

  for (const n of NODE_CREATES) {
    tx.createIfNotExists({
      _id: n._id,
      _type: "organigramNode",
      title: n.title,
      roleCode: n.roleCode,
      department: n.department,
      parentNode: { _type: "reference", _ref: n.parent, _weak: true },
      sortOrder: n.sortOrder,
      active: true,
      members: n.members.map(memberRef),
    });
  }

  for (const n of NODE_UPDATES) {
    tx.patch(n.id, (p) =>
      p.set({
        members: n.members.map(memberRef),
        ...(n.title ? { title: n.title } : {}),
        ...(n.active !== undefined ? { active: n.active } : {}),
      }),
    );
  }

  for (const t of TOPIC_UPDATES) {
    tx.patch(t.id, (p) =>
      p.set({
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

  printPlan(snap, nodeRows, await nameLookup(nodeRows));

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
  await write();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
