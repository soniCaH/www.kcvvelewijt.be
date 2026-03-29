import {defineField, defineType} from 'sanity'

export const jeugdLandingPage = defineType({
  name: 'jeugdLandingPage',
  title: 'Jeugd Landing Page',
  type: 'document',
  // @ts-expect-error __experimental_actions is not in the public type yet
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'editorialCards',
      title: 'Editorial Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'tag',
              type: 'string',
              title: 'Tag label',
            }),
            defineField({
              name: 'title',
              type: 'string',
              title: 'Card title',
            }),
            defineField({
              name: 'description',
              type: 'text',
              title: 'Short description (optional)',
              rows: 2,
            }),
            defineField({
              name: 'arrowText',
              type: 'string',
              title: 'Arrow link text',
              initialValue: 'Meer info',
            }),
            defineField({
              name: 'href',
              type: 'string',
              title: 'Link URL',
            }),
            defineField({
              name: 'image',
              type: 'image',
              title: 'Background image',
            }),
            defineField({
              name: 'position',
              type: 'string',
              title: 'Grid position',
              options: {
                list: [
                  {title: 'Featured (large, left)', value: 'featured'},
                  {title: 'Medium (right column)', value: 'medium'},
                  {title: 'Third (bottom row)', value: 'third'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'cardType',
              type: 'string',
              title: 'Card type',
              options: {
                list: [
                  {title: 'Navigation card', value: 'nav'},
                  {title: 'Dynamic article (auto-filled)', value: 'article'},
                ],
              },
              description:
                'Article slots are auto-filled with the latest jeugd-tagged articles from Sanity. Nav cards use the fields above.',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'tag',
              cardType: 'cardType',
            },
            prepare({
              title,
              subtitle,
              cardType,
            }: {
              title?: string
              subtitle?: string
              cardType?: string
            }) {
              return {
                title:
                  cardType === 'article'
                    ? '📰 Article slot (auto-filled)'
                    : (title ?? 'Untitled card'),
                subtitle: subtitle ?? cardType ?? '',
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.max(12).warning('Maximum 12 cards recommended for layout'),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Jeugd landing page configuratie'}
    },
  },
})
