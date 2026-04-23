import {defineField, defineType} from 'sanity'
import {validateRespondentKey} from './validation/respondent-key'

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
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [
        {
          type: 'block',
          // Design §6.1: answer is flat prose — no headings, no lists, no
          // images. Default marks (bold, italic, underline, code, link) are
          // retained to support emphasis and inline links.
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
        },
      ],
      validation: (r) => r.required(),
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
    defineField({
      name: 'respondentKey',
      title: 'Respondent',
      description:
        "Voor duo- en panel-interviews: kies wie dit gezegd heeft. Verplicht op key- en quote-pairs wanneer het artikel 2 of meer subjects heeft. Verborgen op standard en rapid-fire.",
      // String storing the `_key` of one of `article.subjects[]`. Cannot be a
      // Sanity reference — `subject` is an embedded object type, not a
      // document, so references can't target it. Client-side resolution
      // happens via `article.subjects.find(s => s._key === pair.respondentKey)`
      // at the repository boundary. The custom Studio input (`RespondentPicker`
      // in `@kcvv/sanity-studio`) reads document.subjects[] and renders a
      // dropdown scoped to the article's subjects — editors never pick from
      // the global player pool.
      type: 'string',
      hidden: ({parent}) => {
        const tag = (parent as {tag?: string} | undefined)?.tag ?? 'standard'
        return !['key', 'quote'].includes(tag)
      },
      validation: (r) =>
        r.custom((val, ctx) =>
          validateRespondentKey(val, {
            parent: ctx.parent as {tag?: string} | undefined,
            document: ctx.document as
              | {articleType?: string; subjects?: Array<{_key?: string}>}
              | undefined,
          }),
        ),
    }),
  ],
  preview: {
    select: {question: 'question', tag: 'tag'},
    prepare({question, tag}) {
      return {
        title: question ?? 'Untitled Q&A pair',
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
      validation: (r) => r.min(1).error('At least one Q&A pair required.'),
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
