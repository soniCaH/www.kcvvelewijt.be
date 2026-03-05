import {defineField, defineType} from 'sanity'

export const player = defineType({
  name: 'player',
  title: 'Player',
  type: 'document',
  fields: [
    // PSD-synced (never edit manually)
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'jerseyNumber',
      title: 'Jersey number',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'positionPsd',
      title: 'Position (PSD)',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'birthDate',
      title: 'Birth date',
      type: 'date',
      readOnly: true,
    }),
    defineField({
      name: 'nationality',
      title: 'Nationality',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'height',
      title: 'Height (cm)',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'weight',
      title: 'Weight (kg)',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'joinDate',
      title: 'Join date',
      type: 'date',
      readOnly: true,
    }),
    defineField({
      name: 'leaveDate',
      title: 'Leave date',
      type: 'date',
      readOnly: true,
    }),
    defineField({
      name: 'psdImageUrl',
      title: 'PSD image URL',
      type: 'url',
      readOnly: true,
    }),
    // Editorial enrichment
    defineField({
      name: 'transparentImage',
      title: 'Transparent image',
      type: 'image',
      options: {hotspot: true},
      description: 'PNG with transparent background — replaces PSD image on site',
    }),
    defineField({
      name: 'celebrationImage',
      title: 'Celebration image',
      type: 'image',
      options: {hotspot: true},
      description: 'Used for first-team Instagram share cards',
    }),
    defineField({
      name: 'positionOverride',
      title: 'Position override',
      type: 'string',
      description:
        'Full Dutch name (Keeper, Verdediger, Middenvelder, Aanvaller). Overrides PSD position code.',
      options: {
        list: ['Keeper', 'Verdediger', 'Middenvelder', 'Aanvaller', 'Speler'],
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      media: 'transparentImage',
    },
    prepare({firstName, lastName, media}) {
      return {title: `${firstName ?? ''} ${lastName ?? ''}`.trim(), media}
    },
  },
})
