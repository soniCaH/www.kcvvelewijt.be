import {defineField, defineType} from 'sanity'

const contactFields = [
  defineField({
    name: 'staffMember',
    title: 'Staff member',
    type: 'reference',
    to: [{type: 'staffMember'}],
    description: 'Link to a staff member document (takes precedence over inline fields)',
  }),
  defineField({
    name: 'role',
    title: 'Role label',
    type: 'string',
    description: 'Display role when no staff member is linked (e.g. "Trainer")',
  }),
  defineField({name: 'email', title: 'Email', type: 'string'}),
  defineField({name: 'phone', title: 'Phone', type: 'string'}),
  defineField({
    name: 'department',
    title: 'Department',
    type: 'string',
    options: {
      list: [
        {title: 'Hoofdbestuur', value: 'hoofdbestuur'},
        {title: 'Jeugdbestuur', value: 'jeugdbestuur'},
        {title: 'Algemeen', value: 'algemeen'},
      ],
    },
  }),
]

export const responsibilityPath = defineType({
  name: 'responsibilityPath',
  title: 'Responsibility path',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Short display title for Studio (e.g. "Blessure – herstel")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Unique identifier used in the web app (kebab-case, stable across environments)',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Unpublish without deleting. Inactive paths are hidden from the web app.',
      initialValue: true,
    }),
    defineField({
      name: 'audience',
      title: 'Audience',
      type: 'array',
      description: 'Who can ask this question?',
      of: [
        {
          type: 'string',
          options: {
            list: [
              {title: 'Speler', value: 'speler'},
              {title: 'Ouder', value: 'ouder'},
              {title: 'Trainer', value: 'trainer'},
              {title: 'Supporter', value: 'supporter'},
              {title: 'Niet-lid', value: 'niet-lid'},
              {title: 'Andere', value: 'andere'},
            ],
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'Lowercase, conversational (e.g. "heb een ongeval op training")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Search synonyms and related terms. Be generous.',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      description: '1-2 sentences shown immediately after the user selects this path',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Medisch', value: 'medisch'},
          {title: 'Sportief', value: 'sportief'},
          {title: 'Administratief', value: 'administratief'},
          {title: 'Gedrag', value: 'gedrag'},
          {title: 'Algemeen', value: 'algemeen'},
          {title: 'Commercieel', value: 'commercieel'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Lucide icon name (e.g. "heart", "file-text", "shield")',
    }),
    defineField({
      name: 'primaryContact',
      title: 'Primary contact',
      type: 'object',
      description: 'Main contact person for this path',
      fields: contactFields,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      description: 'Ordered solution steps. Array order is the display order.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'string',
              description: 'Optional relative or absolute URL',
            }),
            defineField({
              name: 'contact',
              title: 'Contact (this step)',
              type: 'object',
              description: 'Optional contact specific to this step',
              fields: contactFields,
            }),
          ],
          preview: {
            select: {description: 'description'},
            prepare({description}: {description?: string}) {
              return {title: description ?? '(no description)'}
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'relatedPaths',
      title: 'Related paths',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'responsibilityPath'}]}],
      description: '"See also" links shown at the bottom of the result card',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      active: 'active',
      category: 'category',
    },
    prepare({title, active, category}: {title?: string; active?: boolean; category?: string}) {
      return {
        title: title ?? '(untitled)',
        subtitle: [category, active === false ? '— inactief' : undefined].filter(Boolean).join(' '),
      }
    },
  },
})
