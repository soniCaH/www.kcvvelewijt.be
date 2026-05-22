import {at, defineMigration, unset} from 'sanity/migrate'

/**
 * Migration: unset `psdImage` on every player document that currently
 * references the PSD "no image available" placeholder asset (#1895).
 *
 * Sanity deduplicates asset uploads by content hash, so every player
 * whose `psdImage` resolves to the placeholder shares the same asset
 * `_ref`. We can therefore target the whole cohort by matching on the
 * exact asset ref — no per-player heuristics needed.
 *
 * The hash in the asset ref is SHA-1 of the placeholder bytes; the
 * staging dataset stores the placeholder at
 * `image-6607821528ffa87bb0d39b159a7a4aa81dc78683-350x350-jpg`, and the
 * production dataset carries the same bytes → same hash → same asset id.
 *
 * Idempotent: docs that no longer reference the placeholder (or never
 * did) produce zero patches and are left alone.
 *
 * After this migration runs, the PlayerHero illustration fallback fires
 * for the affected players per the Phase 6.A 6.d2 lock.
 *
 * Exported separately from `defineMigration` so unit tests can exercise
 * the branching against synthetic documents without a Sanity dataset.
 */
export const PSD_PLACEHOLDER_ASSET_REF =
  'image-6607821528ffa87bb0d39b159a7a4aa81dc78683-350x350-jpg'

export interface PlayerWithPsdImageDoc {
  _id?: string
  _type?: string
  psdImage?: {
    _type?: 'image'
    asset?: {
      _type?: 'reference'
      _ref?: string
    }
  }
  // The sync also writes a sibling `psdImageUrl` string used for dedup on
  // the next run. Leaving it set would re-trigger the upload path on the
  // next sync — but with #1895's hash-skip in place that path now bails
  // before patching, so the lingering URL is harmless. Unset it anyway to
  // keep the document tidy.
  //
  // Trade-off: unsetting `psdImageUrl` means `needsUpload` returns true on
  // every subsequent sync for these players → the sync re-fetches the
  // placeholder bytes from PSD just to hash + skip them, burning one
  // PSD-counter call per affected player per sync. Acceptable at the
  // current scale (~80 calls/sync, well under the PSD daily ceiling).
  // A future enhancement could persist a "known-placeholder" marker so
  // the sync short-circuits before fetching — out of scope for #1895.
  psdImageUrl?: string
}

type Patch = ReturnType<typeof at>

export function migrateUnsetPlayerPlaceholderPsdImage(
  doc: PlayerWithPsdImageDoc,
): Patch[] | undefined {
  const ref = doc.psdImage?.asset?._ref
  if (ref !== PSD_PLACEHOLDER_ASSET_REF) return undefined

  const patches: Patch[] = [at('psdImage', unset())]
  if (doc.psdImageUrl !== undefined) {
    patches.push(at('psdImageUrl', unset()))
  }
  return patches
}

export default defineMigration({
  title:
    'Unset psdImage on players carrying the PSD "no image available" placeholder (#1895)',
  documentTypes: ['player'],

  migrate: {
    document(doc) {
      return migrateUnsetPlayerPlaceholderPsdImage(
        doc as PlayerWithPsdImageDoc,
      )
    },
  },
})
