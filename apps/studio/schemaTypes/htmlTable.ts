import {defineField, defineType} from 'sanity'
import {InlineElementIcon} from '@sanity/icons'

export const htmlTable = defineType({
  name: 'htmlTable',
  title: 'HTML Table',
  type: 'object',
  icon: InlineElementIcon,
  fields: [
    defineField({
      name: 'html',
      title: 'Table HTML',
      type: 'text',
      description: 'Raw HTML table imported from Drupal. Edit the surrounding article text, but leave this block for table data.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {html: 'html'},
    prepare({html}: {html?: string}) {
      const text = (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      return {title: 'Table', subtitle: text.slice(0, 80)}
    },
  },
})
