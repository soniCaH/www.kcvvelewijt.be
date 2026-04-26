import {defineField, defineType} from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
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
      options: {source: 'title'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}, {type: 'image', options: {hotspot: true}}, {type: 'fileAttachment'}],
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
      description: 'Optional override for the Open Graph image. Falls back to the hero image.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'heroImage', slug: 'slug'},
    prepare({title, media, slug}) {
      return {title, subtitle: slug?.current, media}
    },
  },
})
