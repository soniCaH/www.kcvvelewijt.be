import {defineField, defineType} from 'sanity'

export const banner = defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Banner image',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      validation: (r) => r.required(),
      description: 'Required for accessibility. Describe the banner content.',
    }),
    defineField({
      name: 'href',
      title: 'Click-through URL',
      type: 'url',
      description: 'Optional. Wraps the banner in a link.',
    }),
  ],
  preview: {
    select: {title: 'alt', media: 'image'},
  },
})
