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
 * own `required()` rule (a separate array entry in `banner.ts`, at its own
 * error level) already gates on "no image at all"; this gates on "an image
 * that will crop badly".
 */
const EXPECTED_RATIO = 6
const MIN_ACCEPTABLE_RATIO = 5

/**
 * A Sanity image asset `_ref` encodes its pixel dimensions in its own id —
 * `image-<sha1>-<width>x<height>-<ext>` (see
 * `packages/sanity-studio/src/migrations/unset-player-placeholder-psd-image.ts`
 * for the same format documented against a real ref). Parsing it answers
 * "how wide is this asset" synchronously, with no network round trip.
 */
const ASSET_REF_DIMENSIONS_RE = /-(\d+)x(\d+)-\w+$/

/**
 * Validation rule for `banner.image`, run at `.warning()` level by its call
 * site in `banner.ts` (never blocking — the field's own `required()` rule is
 * the only thing that can withhold Publish). Warns when the referenced
 * asset's aspect ratio is materially narrower than the slot's 6:1 house
 * ratio, naming the expected ratio so the editor knows what to fix.
 *
 * Synchronous and dependency-free on purpose (#2401 review finding 6): the
 * dimensions live in the asset `_ref` itself, so there is no
 * `context.getClient().fetch()` round trip to make, and therefore no
 * network-failure path that could silently wave a bad asset through — the
 * previous `client.fetch(...).catch(() => null)` version would pass any
 * asset that Studio merely failed to read, which is the wrong failure mode
 * for a check that exists to catch a mistake.
 */
export function validateBannerAspectRatio(
  value: ImageValue | undefined,
): true | {message: string} {
  const ref = value?.asset?._ref
  if (!ref) return true

  const match = ASSET_REF_DIMENSIONS_RE.exec(ref)
  if (!match) return true

  const width = Number(match[1])
  const height = Number(match[2])
  if (!width || !height) return true

  const ratio = width / height
  if (ratio < MIN_ACCEPTABLE_RATIO) {
    return {
      message:
        `Deze afbeelding is smaller dan de verwachte verhouding van ~${EXPECTED_RATIO}:1 voor een bannerslot ` +
        `(huidige verhouding ≈ ${ratio.toFixed(1)}:1). Ze wordt op de homepage bijgesneden tot een brede, liggende ` +
        `crop — een smallere afbeelding verliest daardoor meer van de boven- en onderkant. Gebruik een bredere ` +
        `afbeelding zodat ze niet ongelukkig bijgesneden wordt.`,
    }
  }

  return true
}
