/**
 * Sanity preview select + prepare for `qaPairRespondent` (#2277).
 *
 * Never surfaces the raw `respondentKey`: the `ALL_RESPONDENTS_KEY` sentinel
 * resolves to "Allen (unaniem)"; a real key shows a neutral "Respondent" label
 * with the answer text as the subtitle. The actual speaker name is shown inline
 * by the `RespondentPicker` in the authoring surface, so no async subject deref
 * is needed here.
 */
import {ALL_RESPONDENTS_KEY} from '../validation/respondent-key'

export const qaPairRespondentPreviewSelect = {
  respondentKey: 'respondentKey',
  answer: 'answer',
}

interface QaPairRespondentPreviewSelection {
  respondentKey?: unknown
  answer?: unknown
}

/**
 * Plain-text of a Portable Text answer, for a legible subtitle. Guards every
 * level — preview `prepare` runs on partially-authored / malformed data and
 * must never throw. Intentionally a small re-implementation of apps/web's
 * `flattenAnswerToString`: `@kcvv/sanity-schemas` is app-free by policy and
 * cannot import from `apps/web`, and this variant only needs a subtitle.
 */
function answerSnippet(answer: unknown): string | undefined {
  if (!Array.isArray(answer)) return undefined
  const blocks: string[] = []
  for (const block of answer as unknown[]) {
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

export function prepareQaPairRespondentPreview(
  selection: QaPairRespondentPreviewSelection,
) {
  const {respondentKey, answer} = selection
  return {
    title:
      respondentKey === ALL_RESPONDENTS_KEY ? 'Allen (unaniem)' : 'Respondent',
    subtitle: answerSnippet(answer),
  }
}
