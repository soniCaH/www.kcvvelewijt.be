import {defineField, defineType} from 'sanity'
import {validateRespondentKey} from './validation/respondent-key'

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
    select: {respondentKey: 'respondentKey'},
    prepare({respondentKey}) {
      return {
        title: respondentKey ? `Respondent: ${respondentKey}` : 'Respondent — geen',
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
