import {defineField, defineType} from 'sanity'

export const articleImage = defineType({
  name: 'articleImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for accessibility',
      validation: (r) => r.required().warning('Provide descriptive alt text for accessibility'),
    }),
    defineField({
      name: 'fullBleed',
      title: 'Full bleed',
      type: 'boolean',
      description: 'Stretch image to full viewport width',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'alt', media: 'image'},
    prepare({title, media}) {
      return {title: title ?? 'Image', media}
    },
  },
})
