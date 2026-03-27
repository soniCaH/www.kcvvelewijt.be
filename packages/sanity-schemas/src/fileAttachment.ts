import {defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const fileAttachment = defineType({
  name: 'fileAttachment',
  title: 'File attachment',
  type: 'object',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'label',
      title: 'Button label',
      type: 'string',
      description: 'Text shown on the download button, e.g. "Download trainingsschema (PPT)"',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {label: 'label'},
    prepare({label}: {label?: string}) {
      return {title: label ?? 'File attachment'}
    },
  },
})
