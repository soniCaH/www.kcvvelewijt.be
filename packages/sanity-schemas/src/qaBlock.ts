import {defineField, defineType} from 'sanity'
import {ALL_RESPONDENTS_KEY, validateRespondentKey} from './validation/respondent-key'

/**
 * Plain-text of a Portable Text answer, for legible previews. Guards every
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

/**
 * One respondent's answer inside a qaPair. The 5.B.int data model
 * treats a qaPair as one question + one-or-more `respondents`, each
 * carrying their own respondent key + Portable Text answer.
 *
 * Validation on `respondentKey` is intentionally light here — the
 * outer qaPair's validator pulls `respondents[]` apart and reuses
 * `validateRespondentKey` against the article-level `subjects[]`
 * (where the `tag` lives) so we don't have to walk up the path here.
 */
export const qaPairRespondent = defineType({
  name: 'qaPairRespondent',
  title: 'Respondent',
  type: 'object',
  fields: [
    defineField({
      name: 'respondentKey',
      title: 'Respondent',
      description: 'Kies wie dit antwoord geeft (referentie naar article.subjects).',
      type: 'string',
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [
        {
          type: 'block',
          // Design §6.1: answer is flat prose — no headings, no lists,
          // no images. Default marks (bold, italic, underline, code,
          // link) are retained.
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
        },
      ],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    // Never surface the raw `respondentKey` (#2277). The `"__all__"` sentinel
    // resolves to "Allen (unaniem)"; a real key shows a neutral "Respondent"
    // label with the answer as the subtitle for legibility — the actual
    // speaker name is shown inline by the RespondentPicker in the authoring
    // surface, so no async subject deref is needed here.
    select: {respondentKey: 'respondentKey', answer: 'answer'},
    prepare({respondentKey, answer}) {
      return {
        title:
          respondentKey === ALL_RESPONDENTS_KEY ? 'Allen (unaniem)' : 'Respondent',
        subtitle: answerSnippet(answer),
      }
    },
  },
})

export const qaPair = defineType({
  name: 'qaPair',
  title: 'Q&A pair',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (r) => r.required().max(240),
    }),
    defineField({
      name: 'respondents',
      title: 'Respondents',
      description:
        'Eén of meerdere sprekers met elk hun eigen antwoord. Voor een gewoon Q&A: één respondent. Voor een duo-vraag: voeg meerdere toe.',
      type: 'array',
      of: [{type: 'qaPairRespondent'}],
      // Seed one respondent so a new pair is answer-ready without an extra
      // "Add respondent" click (#2277). Editors add more only for duos/panels.
      initialValue: [{_type: 'qaPairRespondent', _key: 'respondent-0'}],
      validation: (r) =>
        r
          .required()
          .min(1)
          .error('Minstens één respondent vereist.')
          .custom((val, ctx) => {
            // Re-run the legacy respondent-key validator per entry: the
            // `key`/`quote` tags still gate the "respondent required"
            // rule when the article has 2+ subjects.
            if (!Array.isArray(val) || val.length === 0) return true
            const document = ctx.document as
              | {articleType?: string; subjects?: Array<{_key?: string}>}
              | undefined
            const parent = ctx.parent as {tag?: string} | undefined
            const errors: Array<{message: string; path: [number, 'respondentKey']}> = []
            for (const [i, entry] of val.entries()) {
              const e = entry as {respondentKey?: unknown} | undefined
              const result = validateRespondentKey(e?.respondentKey, {
                parent,
                document,
              })
              if (typeof result === 'string') {
                errors.push({
                  message: result,
                  path: [i, 'respondentKey'],
                })
              }
            }
            return errors.length > 0 ? errors : true
          }),
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'string',
      options: {
        list: [
          {title: 'Standard', value: 'standard'},
          {title: 'Key quote', value: 'key'},
          {title: 'Standalone quote', value: 'quote'},
          {title: 'Rapid-fire', value: 'rapid-fire'},
        ],
      },
      initialValue: 'standard',
    }),
  ],
  preview: {
    select: {question: 'question', tag: 'tag'},
    prepare({question, tag}) {
      return {
        title: question ?? 'Naamloos Q&A-paar',
        // Distinguish an explicitly-set `standard` from an unset tag so
        // editors can see at a glance whether the field has been touched.
        subtitle: tag ? `Tag: ${tag}` : 'Tag: — (defaults to standard)',
      }
    },
  },
})

export const qaBlock = defineType({
  name: 'qaBlock',
  title: 'Q&A',
  type: 'object',
  fields: [
    defineField({
      name: 'pairs',
      title: 'Pairs',
      type: 'array',
      of: [{type: 'qaPair'}],
      // Seed one ready-to-fill pair (with its one respondent) when a Q&A block
      // is inserted, so the editor lands on question + answer, not an empty
      // array (#2277).
      initialValue: [
        {
          _type: 'qaPair',
          _key: 'pair-0',
          tag: 'standard',
          respondents: [{_type: 'qaPairRespondent', _key: 'respondent-0'}],
        },
      ],
      validation: (r) => r.min(1).error('Minstens één Q&A-paar vereist.'),
    }),
    defineField({
      name: 'groupAtTail',
      title: 'Onderaan groeperen',
      type: 'boolean',
      description:
        'Groepeer deze Q&A onderaan het artikel in plaats van in de tekstvloei.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {pairs: 'pairs'},
    prepare({pairs}) {
      const count = Array.isArray(pairs) ? pairs.length : 0
      return {
        title: 'Q&A block',
        subtitle: `${count} pair${count === 1 ? '' : 's'}`,
      }
    },
  },
})
