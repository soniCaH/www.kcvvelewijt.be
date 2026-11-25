import type {AssetSource, InputOnSelectFileFunctionProps, SchemaType} from 'sanity'

interface FanOutContext {
  imageMember: SchemaType
  assetSource: AssetSource
  onSelectFile: ((props: InputOnSelectFileFunctionProps) => void) | undefined
}

/**
 * Feeds each picked image file to Sanity's native per-file upload entry point
 * (`onSelectFile` — the same function the native drop path calls), synchronously
 * and in picker order, so a slow file can never overtake a fast one. Non-image
 * files are skipped; without `onSelectFile` there is nothing to feed.
 *
 * Own file (no runtime imports) so vitest can import it without dragging
 * Sanity's runtime bundle into the module graph — same split as
 * `filterLauncherTemplates` and `match-tag-candidates`.
 */
export const fanOutSelectedFiles = (
  files: readonly File[],
  {imageMember, assetSource, onSelectFile}: FanOutContext,): void => {
  if (!onSelectFile) return
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    onSelectFile({file, schemaType: imageMember, assetSource})
  }
};
