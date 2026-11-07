interface MaybePsdImageDoc {
  psdImage?: {asset?: {_ref?: string}; [key: string]: unknown} | null
  [key: string]: unknown
}

type Doc = MaybePsdImageDoc | null | undefined

export interface RemovePsdImageInput {
  /** Published document id (what the Document Action receives as `id`). */
  id: string
  draft: Doc
  published: Doc
}

export interface UnsetMutation {
  patch: {id: string; unset: string[]}
}

const PSD_IMAGE_FIELDS = ['psdImage', 'psdImageUrl']

/** Distinct asset ids held by the draft and/or published `psdImage`. */
export const collectPsdImageAssetIds = (draft: Doc, published: Doc): string[] => [
  ...new Set(
    [draft, published].flatMap((doc) => {
      const ref = doc?.psdImage?.asset?._ref
      return ref ? [ref] : []
    }),
  ),
]

export const hasPsdImage = (draft: Doc, published: Doc): boolean =>
  collectPsdImageAssetIds(draft, published).length > 0

/** Unset the PSD portrait on every version of the document that exists. */
export const buildRemovePsdImageMutations = ({
  id,
  draft,
  published,
}: RemovePsdImageInput): UnsetMutation[] =>
  [published ? id : null, draft ? `drafts.${id}` : null]
    .filter((docId): docId is string => docId !== null)
    .map((docId) => ({patch: {id: docId, unset: PSD_IMAGE_FIELDS}}))

/**
 * The action stays visible while its dialog is open: the commit removes the
 * `psdImage`, and hiding the action then would unmount the dialog before the
 * editor reads the result.
 */
export const isRemovePsdImageVisible = ({
  type,
  dialogOpen,
  draft,
  published,
}: {
  type: string
  dialogOpen: boolean
  draft: Doc
  published: Doc
}): boolean =>
  (type === 'player' || type === 'staffMember') && (dialogOpen || hasPsdImage(draft, published))
