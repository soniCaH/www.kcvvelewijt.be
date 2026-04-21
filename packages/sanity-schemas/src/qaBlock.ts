import {defineField, defineType} from 'sanity'

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
