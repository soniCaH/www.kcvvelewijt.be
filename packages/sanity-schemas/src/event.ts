import {defineField, defineType} from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier — auto-generated from the title.',
      options: {source: 'title', maxLength: 96},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'dateStart',
      title: 'Start date',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({name: 'dateEnd', title: 'End date', type: 'datetime'}),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'externalLink',
      title: 'External link',
      type: 'object',
      fields: [
        defineField({name: 'url', title: 'URL', type: 'url'}),
        defineField({name: 'label', title: 'Label', type: 'string'}),
      ],
    }),
    defineField({
      name: 'featuredOnHome',
      title: 'Featured on homepage',
      type: 'boolean',
      description: 'When enabled, this event fills the featured slot in the news section on the homepage.',
      initialValue: false,
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      description: 'Override for SEO meta description and OG description (max 160 characters).',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      description: 'Optional override for the Open Graph image. Falls back to the cover image.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'coverImage', dateStart: 'dateStart'},
    prepare({title, media, dateStart}) {
      return {
        title,
        subtitle: dateStart ? new Date(dateStart).toLocaleDateString('nl-BE') : '',
        media,
      }
    },
  },
})
