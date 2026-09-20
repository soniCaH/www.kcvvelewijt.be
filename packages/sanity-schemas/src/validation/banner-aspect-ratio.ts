interface ImageValue {
  asset?: {_ref?: string}
}

/**
 * The banner slot has **no house ratio** (#2928, owner decision 2026-09-20).
 * The homepage renders a banner at the asset's own shape, identically at
 * every breakpoint (`fit=max` in `HOMEPAGE_QUERY`, a plain `<img>` in
 * `BannerSlot`), so nothing is ever cropped and there is no target ratio to
 * match.
 *
 * That changes what this check is FOR. It used to assert a 6:1 house ratio
 * and warn below 5:1, pushing an editor toward a wider asset so the crop
 * would lose less. With the crop gone that advice is not just obsolete, it
 * was actively harmful: the slot also rendered a 3:1 crop on mobile, so a
 * "correctly" wide 6:1 upload lost HALF its width on a phone, where the old
 * 4.5:1 asset lost a third. Warning toward 6:1 made the mobile rendering
 * worse, which is how the live `bannerSlotA` banner ended up with the first
 * line of its quote cut off at every hotspot value.
 *
 * What is left to guard is the only failure the removed crop used to absorb:
 * an editor uploading something tall (a portrait photo, a square poster) and
 * getting an enormous band on the homepage, because nothing clips it any
 * more. So this now warns on a *range* — too tall to sit in a page, or so
 * thin that artwork inside it is unreadable — and says nothing about the
 * shape in between, because any of those shapes now renders exactly as
 * uploaded.
 *
 * Bounds are deliberately loose. At the `index` container's 1280px, 2.5:1 is
 * already a 512px band — a screenful on a laptop — and 8:1 is a 160px strip
 * where a line of baked-in text is a few pixels tall. Between those, the
 * editor's judgement is better than a rule's.
 */
/** Taller than this and the banner eats the page. */
const MIN_ACCEPTABLE_RATIO = 2.5
/** Thinner than this and anything drawn inside it is too small to read. */
const MAX_ACCEPTABLE_RATIO = 8

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
 * the only thing that can withhold Publish). Warns only when the referenced
 * asset's aspect ratio falls outside the usable band, and says which way it
 * is wrong so the editor knows what to change.
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
        `Deze afbeelding is vrij hoog (verhouding ≈ ${ratio.toFixed(1)}:1). ` +
        `De banner wordt getoond zoals je ze uploadt — er wordt niets bijgesneden — ` +
        `dus een hoge afbeelding wordt een erg hoge balk op de homepage. ` +
        `Gebruik een liggende afbeelding (breder dan ${MIN_ACCEPTABLE_RATIO}:1).`,
    }
  }
  if (ratio > MAX_ACCEPTABLE_RATIO) {
    return {
      message:
        `Deze afbeelding is erg smal (verhouding ≈ ${ratio.toFixed(1)}:1). ` +
        `De banner wordt getoond zoals je ze uploadt, dus ze wordt een dunne strook ` +
        `waarin tekst nauwelijks leesbaar is. Gebruik een minder extreme verhouding ` +
        `(niet breder dan ${MAX_ACCEPTABLE_RATIO}:1).`,
    }
  }

  return true
}
