/**
 * Sanity preview select + prepare for `pullQuote` (#2517). Title is the
 * quote text itself (plain-text snippet of the Portable Text `body`);
 * subtitle is the speaker — the resolved `speaker` reference's name when
 * set, else `externalName`, else a neutral placeholder for a nameless
 * quote.
 */

export const pullQuotePreviewSelect = {
  body: 'body',
  speakerFirstName: 'speaker.firstName',
  speakerLastName: 'speaker.lastName',
  externalName: 'externalName',
}

interface PullQuotePreviewSelection {
  body?: unknown
  speakerFirstName?: unknown
  speakerLastName?: unknown
  externalName?: unknown
}

/**
 * Plain-text of a Portable Text quote body, for a legible title. Guards
 * every level — preview `prepare` runs on partially-authored / malformed
 * data and must never throw. Intentionally a small re-implementation of
 * apps/web's own snippet helpers: `@kcvv/sanity-schemas` is app-free by
 * policy and cannot import from `apps/web` (mirrors `answerSnippet` in
 * `qa-pair-respondent-preview.ts`).
 */
function quoteSnippet(body: unknown): string | undefined {
  if (!Array.isArray(body)) return undefined
  const blocks: string[] = []
  for (const block of body as unknown[]) {
    const children = (block as {children?: unknown} | null)?.children
    if (!Array.isArray(children)) continue
    let blockText = ''
    for (const child of children as unknown[]) {
      const text = (child as {text?: unknown} | null)?.text
      if (typeof text === 'string') blockText += text
    }
    if (blockText) blocks.push(blockText)
  }
  const joined = blocks.join(' ').trim()
  return joined.length > 0 ? joined : undefined
}

export function preparePullQuotePreview(selection: PullQuotePreviewSelection) {
  const {body, speakerFirstName, speakerLastName, externalName} = selection
  const title = quoteSnippet(body) ?? 'Citaat'
  const referenceName = [
    typeof speakerFirstName === 'string' ? speakerFirstName : undefined,
    typeof speakerLastName === 'string' ? speakerLastName : undefined,
  ]
    .filter((v): v is string => Boolean(v))
    .join(' ')
    .trim()
  const external = typeof externalName === 'string' ? externalName.trim() : ''
  const subtitle = referenceName || external || 'Geen spreker'
  return {title, subtitle}
}
