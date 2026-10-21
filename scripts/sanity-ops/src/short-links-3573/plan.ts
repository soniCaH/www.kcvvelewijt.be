/**
 * The two short links the old Gatsby site's flyers carry (#3573, decided in
 * #3562). Pure: builds the documents and judges what a run would change, so the
 * dry run and the write read the same plan and a test can pin it.
 */
export const SHORT_LINK_SEED = [
  { name: "tornooi", target: "https://www.tournify.nl/live/kcvvelewijt2025" },
  { name: "stage", target: "/nieuws/herfststage-2026" },
] as const;

/** Deterministic, so a re-run replaces instead of duplicating. No `.`: a dotted id is a draft/private path. */
export const shortLinkId = (name: string) => `shortLink-${name}`;

export interface ShortLinkDoc {
  _id: string;
  _type: "shortLink";
  name: string;
  target: string;
}

/** What the read found: any `shortLink` that uses a seed name, or has a seed id (or its draft). */
export interface ExistingDoc {
  _id: string;
  name?: string | null;
  target?: string | null;
}

export interface PlanRow {
  action: "create" | "update" | "unchanged";
  doc: ShortLinkDoc;
  /** The target now in the dataset, for an `update`. */
  before?: string;
}

export function planSeed(existing: ExistingDoc[]): PlanRow[] {
  return SHORT_LINK_SEED.map(({ name, target }) => {
    const doc: ShortLinkDoc = {
      _id: shortLinkId(name),
      _type: "shortLink",
      name,
      target,
    };
    const current = existing.find((e) => e._id === doc._id);
    if (!current) return { action: "create", doc };
    if (current.name === name && current.target === target) {
      return { action: "unchanged", doc };
    }
    return { action: "update", doc, before: current.target ?? undefined };
  });
}

/** Reasons to refuse before anything is planned; empty means go. */
export function preflight(existing: ExistingDoc[]): string[] {
  const errors: string[] = [];
  for (const { name } of SHORT_LINK_SEED) {
    const id = shortLinkId(name);
    for (const doc of existing) {
      if (doc._id === id) continue;
      const isCopyOfSeed =
        doc._id === `drafts.${id}` ||
        (doc._id.startsWith("versions.") && doc._id.endsWith(`.${id}`));
      if (isCopyOfSeed) {
        errors.push(
          `Draft or release copy ${doc._id} exists — publish or discard it first, it would be published over this write.`,
        );
      } else if (doc.name === name) {
        errors.push(
          `"${name}" is already used by ${doc._id} — a second document with the same name would break the Studio's unique-name rule. Delete or rename it first.`,
        );
      }
    }
  }
  return errors;
}
