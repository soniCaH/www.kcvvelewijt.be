import {defineField, defineType} from 'sanity'

export const searchFeedback = defineType({
  name: 'searchFeedback',
  title: 'Search Feedback',
  type: 'document',
  __experimental_actions: ['read', 'delete'],
  fields: [
    defineField({name: 'pathSlug', title: 'Path slug', type: 'string'}),
    defineField({name: 'pathTitle', title: 'Path title', type: 'string'}),
    defineField({
      name: 'vote',
      title: 'Vote',
      type: 'string',
      options: {list: ['up', 'down']},
    }),
  ],
  preview: {
    select: {title: 'pathTitle', subtitle: 'vote'},
    prepare({title, subtitle}) {
      return {title, subtitle: subtitle === 'up' ? '👍' : '👎'}
    },
  },
})
