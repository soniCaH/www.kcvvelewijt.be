import {defineField, defineType} from 'sanity'
import {responsibilityPreviewSelect, prepareResponsibilityPreview} from './preview/responsibility-preview'

const hasContent = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0

const contactFields = [
  defineField({
    name: 'contactType',
    title: 'Type contact',
    type: 'string',
    options: {
      list: [
        {title: 'Organigram positie', value: 'position'},
        {title: 'Teamrol (dynamisch)', value: 'team-role'},
        {title: 'Handmatig', value: 'manual'},
      ],
      layout: 'radio',
    },
    initialValue: 'position',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'organigramNode',
    title: 'Positie',
    type: 'reference',
    to: [{type: 'organigramNode'}],
    description: 'Kies de organigram-positie (bijv. Secretaris, TVJO, API)',
    hidden: ({parent}) => parent?.contactType !== 'position',
  }),
  defineField({
    name: 'teamRole',
    title: 'Teamrol',
    type: 'string',
    options: {
      list: [
        {title: 'Trainer', value: 'trainer'},
        {title: 'Afgevaardigde', value: 'afgevaardigde'},
      ],
    },
    description: 'Wordt dynamisch ingevuld op basis van de ploeg die de gebruiker kiest',
    hidden: ({parent}) => parent?.contactType !== 'team-role',
  }),
  defineField({
    name: 'role',
    title: 'Rol',
    type: 'string',
    description: 'Weergavenaam (bijv. "Kantine")',
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'email',
    title: 'Email',
    type: 'string',
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'phone',
    title: 'Telefoon',
    type: 'string',
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'department',
    title: 'Afdeling',
    type: 'string',
    options: {
      list: [
        {title: 'Hoofdbestuur', value: 'hoofdbestuur'},
        {title: 'Jeugdbestuur', value: 'jeugdbestuur'},
        {title: 'Algemeen', value: 'algemeen'},
      ],
    },
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
]

export const responsibility = defineType({
  name: 'responsibility',
  title: 'Responsibility',
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
      validation: (Rule) =>
        Rule.required().custom((contact: Record<string, unknown> | undefined) => {
          if (!contact?.contactType) return 'Kies een type contact'
          switch (contact.contactType) {
            case 'position':
              return contact.organigramNode ? true : 'Kies een organigram-positie'
            case 'team-role':
              return contact.teamRole ? true : 'Kies een teamrol'
            case 'manual':
              return hasContent(contact.email) || hasContent(contact.phone) || hasContent(contact.role)
                ? true
                : 'Vul minstens één van: rol, email, telefoon in'
            default:
              return 'Ongeldig type contact'
          }
        }),
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      description: 'Ordered solution steps. Array order is the display order.',
      of: [
        {
          type: 'object',
          name: 'solutionStep',
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
              // @ts-expect-error .uri() exists at runtime but is missing from StringRule types
              validation: (Rule) => Rule.uri({allowRelative: true}),
            }),
            defineField({
              name: 'contact',
              title: 'Contact (this step)',
              type: 'object',
              description: 'Optional contact specific to this step',
              fields: contactFields,
              validation: (Rule) =>
                Rule.custom((contact: Record<string, unknown> | undefined) => {
                  if (!contact?.contactType) return true // step contacts are optional
                  switch (contact.contactType) {
                    case 'position':
                      return contact.organigramNode ? true : 'Kies een organigram-positie'
                    case 'team-role':
                      return contact.teamRole ? true : 'Kies een teamrol'
                    case 'manual':
                      return hasContent(contact.email) || hasContent(contact.phone) || hasContent(contact.role)
                        ? true
                        : 'Vul minstens één van: rol, email, telefoon in'
                    default:
                      return 'Ongeldig type contact'
                  }
                }),
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
      of: [{type: 'reference', to: [{type: 'responsibility'}]}],
      description: '"See also" links shown at the bottom of the result card',
    }),
  ],
  preview: {
    select: responsibilityPreviewSelect,
    prepare: prepareResponsibilityPreview,
  },
})
