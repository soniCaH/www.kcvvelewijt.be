/**
 * Selection logic for the PSD privacy cleanup (#3469). Pure, so the dry run
 * and the apply run judge the same rows and a test can pin what is selected.
 *
 * Two things the nightly PSD sync no longer maintains, which the data it wrote
 * earlier still carries:
 * - `staffMember.birthDate` — stored, never read, field removed from the schema.
 * - `player-psd-*` / `staffMember-psd-*` image assets that no document
 *   references any more (superseded or removed portraits).
 */

export interface StaffRow {
  _id: string;
  _rev: string;
  birthDate?: string | null;
}

export interface AssetRow {
  _id: string;
  _rev: string;
  originalFilename?: string | null;
  /** `count(*[references(<this asset>)])`, drafts included. */
  refs: number;
}

/** The filenames the sync uploads portraits under (`sanity/mutation.ts`). */
export const PSD_PORTRAIT_FILENAME = /^(player|staffMember)-psd-.+/;

/** Staff documents (published and draft) that still hold a birth date. */
export function selectStaffToUnset(rows: readonly StaffRow[]): StaffRow[] {
  return rows.filter((r) => r.birthDate != null);
}

/** PSD portrait assets nothing references: safe to delete. */
export function selectUnreferencedPortraitAssets(
  rows: readonly AssetRow[],
): AssetRow[] {
  return rows.filter(
    (r) =>
      r.refs === 0 &&
      r.originalFilename != null &&
      PSD_PORTRAIT_FILENAME.test(r.originalFilename),
  );
}
