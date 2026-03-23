import {defineField, defineType} from 'sanity'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  orderings: [
    {
      title: 'Publish date, newest first',
      name: 'publishAtDesc',
      by: [{field: 'publishAt', direction: 'desc'}],
    },
    {
      title: 'Publish date, oldest first',
      name: 'publishAtAsc',
      by: [{field: 'publishAt', direction: 'asc'}],
    },
  ],
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
    defineField({name: 'publishAt', title: 'Publish at', type: 'datetime'}),
    defineField({name: 'unpublishAt', title: 'Unpublish at', type: 'datetime'}),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'internalLink',
                title: 'Internal link',
                type: 'object',
                fields: [
                  {
                    name: 'reference',
                    title: 'Reference',
                    type: 'reference',
                    to: [{type: 'player'}, {type: 'team'}, {type: 'article'}, {type: 'page'}],
                  },
                ],
              },
            ],
          },
        },
        {type: 'image', options: {hotspot: true}},
        {type: 'fileAttachment'},
        {type: 'htmlTable'},
      ],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
    }),
  ],
  preview: {
    select: {title: 'title', media: 'coverImage', publishAt: 'publishAt'},
    prepare({title, media, publishAt}) {
      return {
        title,
        subtitle: publishAt ? new Date(publishAt).toLocaleDateString('nl-BE') : 'No date',
        media,
      }
    },
  },
})
