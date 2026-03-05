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
      name: 'keeper',
      title: 'Keeper',
      type: 'boolean',
      readOnly: true,
      description: 'Synced from PSD — always reliable for keepers',
    }),
    defineField({
      name: 'positionPsd',
      title: 'Position (PSD)',
      type: 'string',
      readOnly: true,
      description:
        'Synced from PSD bestPosition — null until the club populates positions in PSD. Use position field as fallback.',
    }),
    // Editorial — not available from PSD for KCVV
    defineField({
      name: 'jerseyNumber',
      title: 'Jersey number',
      type: 'number',
    }),
    defineField({
      name: 'height',
      title: 'Height (cm)',
      type: 'number',
    }),
    defineField({
      name: 'weight',
      title: 'Weight (kg)',
      type: 'number',
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
      name: 'position',
      title: 'Position',
      type: 'string',
      description: 'PSD does not provide position data for KCVV — set manually.',
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
