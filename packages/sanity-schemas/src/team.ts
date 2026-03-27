import {defineField, defineType} from 'sanity'

export const trainingDay = defineType({
  name: 'trainingSession',
  title: 'Training session',
  type: 'object',
  fields: [
    defineField({
      name: 'day',
      title: 'Day',
      type: 'string',
      options: {
        list: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'],
      },
    }),
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      description: 'e.g. 19:30',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Sportpark Elewijt - Veld 1',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: ['Training', 'Fysiek', 'Tactisch', 'Keeperstraining', 'Andere'],
      },
    }),
  ],
})

export const team = defineType({
  name: 'team',
  title: 'Team',
  type: 'document',
  fields: [
    // PSD-synced
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'age',
      title: 'Age group',
      type: 'string',
      readOnly: true,
      description: 'e.g. "A", "U17", "U15"',
    }),
    defineField({
      name: 'gender',
      title: 'Gender',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'footbelId',
      title: 'Footbel ID',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'division',
      title: 'Division',
      type: 'string',
      description: 'Korte competitiecode, bv. "3NA".',
    }),
    defineField({
      name: 'divisionFull',
      title: 'Division (full)',
      type: 'string',
      description:
        "Volledige naam, bv. 'Eerste Elftal A - 3e Nationale A' of 'U9 - Wit'",
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'players',
      title: 'Players',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'player'}]}],
      readOnly: true,
    }),
    // Editorial
    defineField({
      name: 'showInNavigation',
      title: 'Show in navigation',
      type: 'boolean',
      description:
        'Uncheck to hide this team from the website navigation and team listings. Use for external/opponent teams or teams with their own nav item.',
      initialValue: true,
    }),
    defineField({name: 'tagline', title: 'Tagline', type: 'string'}),
    defineField({
      name: 'body',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact info',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'teamImage',
      title: 'Team image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'trainingSchedule',
      title: 'Training schedule',
      type: 'array',
      of: [{type: 'trainingSession'}],
    }),
    defineField({
      name: 'staff',
      title: 'Staff',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'staffMember'}]}],
      readOnly: true,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description:
        'Set automatically by sync when team is no longer in PSD. Do not edit manually.',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {title: 'name', media: 'teamImage'},
  },
})
