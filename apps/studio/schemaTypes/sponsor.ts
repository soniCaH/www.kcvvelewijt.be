import {defineField, defineType} from 'sanity'

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'url', title: 'Website', type: 'url'}),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Crossing', value: 'crossing'},
          {title: 'Training', value: 'training'},
          {title: 'White', value: 'white'},
          {title: 'Green', value: 'green'},
          {title: 'Panel', value: 'panel'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'name', media: 'logo', type: 'type'},
    prepare({title, media, type}) {
      return {title, subtitle: type, media}
    },
  },
})
