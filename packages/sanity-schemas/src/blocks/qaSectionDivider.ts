import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Q&A section divider — interview act-divider block.
 *
 * Composition (renderer side, see `apps/web/src/components/design-system/QASectionDivider`):
 *   [1px ink rule] · ✦ {italic title} ✦ · [1px ink rule]
 *                   AKTE 02 · DE OVERSTAP    (optional kicker)
 *
 * The `title` is constrained Portable Text — single block, single `accent`
 * decorator, no styles, lists, or annotations. Editor selects a word + clicks
 * the `Accent` toolbar button to mark a span; the renderer paints accent spans
 * jersey-deep + font-weight 900 (italic display). No string matching.
 *
 * Spec: docs/design/mockups/phase-3-a-tier-c-figures/qasectiondivider-locked.md
 */
export const qaSectionDivider = defineType({
  name: 'qaSectionDivider',
  title: 'Q&A section divider',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description:
        'Italic kop van de divider. Selecteer één woord en klik op "Accent" voor de groene cursief.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [{title: 'Accent', value: 'accent'}],
            annotations: [],
          },
        }),
      ],
      validation: (r) =>
        r
          .required()
          .max(1)
          .custom((blocks) => {
            const arr = blocks as
              | {children?: {text?: string}[]}[]
              | undefined
            const text =
              arr?.[0]?.children?.map((c) => c.text ?? '').join('') ?? ''
            return text.trim().length > 0
              ? true
              : 'Titel mag niet leeg zijn.'
          }),
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker',
      description:
        'Optioneel — kleine mono caps regel onder de divider, bv. "AKTE 02 · DE OVERSTAP".',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'title', kicker: 'kicker'},
    prepare({title, kicker}) {
      const arr = title as {children?: {text?: string}[]}[] | undefined
      const flat =
        arr?.[0]?.children?.map((c) => c.text ?? '').join('') ?? ''
      return {
        title: flat.trim() || 'Q&A section divider',
        subtitle: kicker ? `Kicker: ${kicker}` : 'Geen kicker',
      }
    },
  },
})
