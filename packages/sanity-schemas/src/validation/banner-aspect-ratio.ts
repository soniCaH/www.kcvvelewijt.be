import type {ValidationContext} from 'sanity'

interface ImageValue {
  asset?: {_ref?: string}
}

/**
 * The banner slot's house ratio (#2401) — 6:1, locked 2026-07-13 and
 * reaffirmed 2026-09-10. The homepage always crops a banner asset to 6:1 at
 * the medium breakpoint and up (`fit=crop&crop=focalpoint` in
 * `HOMEPAGE_QUERY`), so a materially narrower source loses more than the
 * schema description's "brede afbeelding" ask accounts for: the live
 * `bannerSlotA` asset that prompted this check is 1920×427 (≈4.5:1),
 * fitted into a 6:1 frame with roughly a quarter of its height discarded.
 * `MIN_ACCEPTABLE_RATIO` sits below the house ratio with headroom for
 * ordinary photography (not every banner is a pure 6:1 crop already) but
 * catches exactly that kind of asset — a warning, not a block: the field's
 * own `required()` already gates on "no image at all"; this gates on "an
 * image that will crop badly".
 */
const EXPECTED_RATIO = 6
const MIN_ACCEPTABLE_RATIO = 5

/**
 * Async validation rule for `banner.image`. Warns (never blocks) when the
 * uploaded asset's aspect ratio is materially narrower than the slot's 6:1
 * house ratio, naming the expected ratio so the editor knows what to fix.
 * Mirrors `validateOrganigramMember`'s shape — deref via the validation
 * context's client, swallow a transient fetch failure to `true` (a hint,
 * not a gate).
 */
export async function validateBannerAspectRatio(
  value: ImageValue | undefined,
  context: ValidationContext,
): Promise<true | {level: 'warning'; message: string}> {
  const ref = value?.asset?._ref
  if (!ref) return true

  const client = context.getClient({apiVersion: '2024-01-01'})
  const asset = await client
    .fetch<{width?: number; height?: number} | null>(
      `*[_id == $id][0]{ "width": metadata.dimensions.width, "height": metadata.dimensions.height }`,
      {id: ref},
    )
    .catch(() => null)

  const width = asset?.width
  const height = asset?.height
  if (!width || !height) return true

  const ratio = width / height
  if (ratio < MIN_ACCEPTABLE_RATIO) {
    return {
      level: 'warning',
      message:
        `Deze afbeelding is smaller dan de verwachte verhouding van ~${EXPECTED_RATIO}:1 voor een bannerslot ` +
        `(huidige verhouding ≈ ${ratio.toFixed(1)}:1). Ze wordt op de homepage bijgesneden tot een brede, liggende ` +
        `crop — een smallere afbeelding verliest daardoor meer van de boven- en onderkant. Gebruik een bredere ` +
        `afbeelding zodat ze niet ongelukkig bijgesneden wordt.`,
    }
  }

  return true
}
